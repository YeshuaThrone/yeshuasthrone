import { afterEach, describe, expect, it, vi } from "vitest";
import type { DbClient } from "@/lib/db/server";
import { createMemoryRateLimiter, type RateLimiter } from "@/lib/rate-limit";
import { SUBSCRIBE_RATE_LIMIT, readSubscribeInput, subscribeWithDeps } from "./subscribe";

type InsertResponse = { error: { code: string; message: string } | null };

/** A client whose `from('drop_alerts').insert()` is a spy returning `response`. */
function mockDb(response: InsertResponse | Error = { error: null }) {
  const insert = vi.fn(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  const client = { from: vi.fn(() => ({ insert })) } as unknown as DbClient;
  return { client, insert };
}

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const unlimited: RateLimiter = { hit: () => ({ allowed: true, remaining: 1, retryAfterSec: 0 }) };

function deps(db: DbClient, limiter: RateLimiter = unlimited, ip = "203.0.113.9") {
  return { clientIp: async () => ip, limiter, db: () => db };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("subscribeWithDeps", () => {
  it("inserts a normalised email with the form's source and reports created", async () => {
    const { client, insert } = mockDb();
    const result = await subscribeWithDeps(
      form({ email: "  Fan@Example.COM ", source: "release:champion", website: "" }),
      deps(client),
    );
    expect(result).toEqual({ ok: true, state: "created" });
    expect(insert).toHaveBeenCalledWith({ email: "fan@example.com", source: "release:champion" });
  });

  it("treats a unique violation (23505) as already_subscribed", async () => {
    const { client } = mockDb({ error: { code: "23505", message: "duplicate key" } });
    const result = await subscribeWithDeps(
      form({ email: "fan@example.com", source: "home" }),
      deps(client),
    );
    expect(result).toEqual({ ok: true, state: "already_subscribed" });
  });

  it("rate-limits the 6th attempt from one IP and does not insert it", async () => {
    const { client, insert } = mockDb();
    const limiter = createMemoryRateLimiter(SUBSCRIBE_RATE_LIMIT);
    for (let i = 0; i < 5; i++) {
      const r = await subscribeWithDeps(
        form({ email: `fan${i}@example.com`, source: "home" }),
        deps(client, limiter, "203.0.113.9"),
      );
      expect(r).toEqual({ ok: true, state: "created" });
    }
    const sixth = await subscribeWithDeps(
      form({ email: "fan6@example.com", source: "home" }),
      deps(client, limiter, "203.0.113.9"),
    );
    expect(sixth).toEqual({ ok: false, code: "rate_limited" });
    expect(insert).toHaveBeenCalledTimes(5);

    // Another IP is unaffected.
    const other = await subscribeWithDeps(
      form({ email: "fan7@example.com", source: "home" }),
      deps(client, limiter, "198.51.100.4"),
    );
    expect(other).toEqual({ ok: true, state: "created" });
  });

  it("fakes success for a filled honeypot without inserting or counting a hit", async () => {
    const { client, insert } = mockDb();
    const hit = vi.fn(() => ({ allowed: true, remaining: 1, retryAfterSec: 0 }));
    const result = await subscribeWithDeps(
      form({ email: "bot@example.com", source: "home", website: "http://spam.example" }),
      deps(client, { hit }),
    );
    expect(result).toEqual({ ok: true, state: "created" });
    expect(insert).not.toHaveBeenCalled();
    expect(hit).not.toHaveBeenCalled();
  });

  it.each(["", "not-an-email", "a@b", `${"x".repeat(250)}@example.com`])(
    "rejects %j as invalid_email before touching the limiter or the db",
    async (email) => {
      const { client, insert } = mockDb();
      const hit = vi.fn(() => ({ allowed: true, remaining: 1, retryAfterSec: 0 }));
      const result = await subscribeWithDeps(form({ email, source: "home" }), deps(client, { hit }));
      expect(result).toEqual({ ok: false, code: "invalid_email" });
      expect(insert).not.toHaveBeenCalled();
      expect(hit).not.toHaveBeenCalled();
    },
  );

  it("falls back to source 'site' when the hidden field is missing or oversized", async () => {
    const { client, insert } = mockDb();
    await subscribeWithDeps(form({ email: "a@example.com" }), deps(client));
    await subscribeWithDeps(
      form({ email: "b@example.com", source: "s".repeat(65) }),
      deps(client),
    );
    expect(insert).toHaveBeenNthCalledWith(1, { email: "a@example.com", source: "site" });
    expect(insert).toHaveBeenNthCalledWith(2, { email: "b@example.com", source: "site" });
  });

  it("maps any other database error to server_error and logs it", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = mockDb({ error: { code: "no_database", message: "unset" } });
    const result = await subscribeWithDeps(
      form({ email: "fan@example.com", source: "home" }),
      deps(client),
    );
    expect(result).toEqual({ ok: false, code: "server_error" });
    expect(console.error).toHaveBeenCalledWith(expect.stringMatching(/no_database/));
  });

  it("never throws: a failing client factory or insert becomes server_error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const boom = () => {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is unset");
    };
    const fromFactory = await subscribeWithDeps(form({ email: "fan@example.com" }), {
      ...deps(mockDb().client),
      db: boom,
    });
    expect(fromFactory).toEqual({ ok: false, code: "server_error" });

    const { client } = mockDb(new Error("network"));
    const fromInsert = await subscribeWithDeps(form({ email: "fan@example.com" }), deps(client));
    expect(fromInsert).toEqual({ ok: false, code: "server_error" });
  });
});

describe("readSubscribeInput", () => {
  it("reads strings and ignores files", () => {
    const fd = new FormData();
    fd.set("email", "x@example.com");
    fd.set("website", new Blob(["x"]), "x.txt");
    expect(readSubscribeInput(fd)).toEqual({ email: "x@example.com", source: "", website: "" });
  });
});
