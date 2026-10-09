import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  NO_DATABASE_ERROR,
  UNIQUE_VIOLATION_ERROR,
  createAnonClient,
  createInMemoryShim,
  createServiceClient,
  fixturesEnabled,
  isDatabaseConfigured,
  isInMemoryShim,
  readDbEnv,
  resetClientsForTests,
  storagePublicBase,
} from "./server";
import { releaseFixtures } from "./fixtures";

const NO_ENV = { url: null, anonKey: null, serviceRoleKey: null };

describe("readDbEnv", () => {
  it("treats blank values as unset", () => {
    expect(
      readDbEnv({
        NEXT_PUBLIC_SUPABASE_URL: "  ",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      }),
    ).toEqual(NO_ENV);
    expect(isDatabaseConfigured(NO_ENV)).toBe(false);
  });

  it("trims and reports a configured project", () => {
    const env = readDbEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co/ ",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service",
    });
    expect(env).toEqual({
      url: "https://x.supabase.co/",
      anonKey: "anon",
      serviceRoleKey: "service",
    });
    expect(isDatabaseConfigured(env)).toBe(true);
    expect(storagePublicBase(env)).toBe(
      "https://x.supabase.co/storage/v1/object/public",
    );
    expect(storagePublicBase(NO_ENV)).toBeNull();
  });
});

describe("no-env in-memory shim", () => {
  beforeEach(() => {
    resetClientsForTests();
  });
  afterEach(() => {
    resetClientsForTests();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("is what both clients return when NEXT_PUBLIC_SUPABASE_URL is unset", () => {
    expect(isInMemoryShim(createAnonClient(NO_ENV))).toBe(true);
    expect(isInMemoryShim(createServiceClient(NO_ENV))).toBe(true);
  });

  it("reads resolve empty through the query-builder chain", async () => {
    const db = createAnonClient(NO_ENV);
    const many = await db
      .from("releases")
      .select("*, tracks(*)")
      .eq("published", true)
      .order("release_date", { ascending: false })
      .limit(10);
    expect(many).toMatchObject({ data: [], error: null });

    const one = await db
      .from("releases")
      .select("*")
      .eq("slug", "champion")
      .maybeSingle();
    expect(one).toMatchObject({ data: null, error: null });
  });

  it("writes resolve with a no_database error instead of pretending", async () => {
    const db = createServiceClient(NO_ENV);
    const result = await db
      .from("releases")
      .insert({ slug: "x", title: "x" });
    expect(result.data).toBeNull();
    expect(result.error).toEqual(NO_DATABASE_ERROR);
  });

  it("stores drop_alerts in memory and rejects duplicates as 23505", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const db = createServiceClient(NO_ENV);
    const first = await db.from("drop_alerts").insert({ email: "fan@example.com" });
    expect(first.error).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(expect.stringMatching(/in memory only/));

    // citext: case does not make a new subscriber.
    const dupe = await db.from("drop_alerts").insert({ email: "Fan@Example.com" });
    expect(dupe.error).toEqual(UNIQUE_VIOLATION_ERROR);

    const other = await db.from("drop_alerts").insert({ email: "other@example.com" });
    expect(other.error).toBeNull();
  });

  it("defaults to process.env", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(isInMemoryShim(createAnonClient())).toBe(true);
  });
});

describe("configured clients", () => {
  beforeEach(() => {
    resetClientsForTests();
  });
  afterEach(() => {
    resetClientsForTests();
  });

  const env = {
    url: "https://x.supabase.co",
    anonKey: "anon",
    serviceRoleKey: "service",
  };

  it("returns real supabase clients, memoized per process", () => {
    const anon = createAnonClient(env);
    expect(isInMemoryShim(anon)).toBe(false);
    expect(createAnonClient(env)).toBe(anon);

    const service = createServiceClient(env);
    expect(isInMemoryShim(service)).toBe(false);
    expect(service).not.toBe(anon);
  });

  it("refuses a service client when the url is set but the key is missing", () => {
    expect(() =>
      createServiceClient({ ...env, serviceRoleKey: null }),
    ).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });
});

describe("fixture-backed shim (TEST_FIXTURES=1)", () => {
  beforeEach(() => {
    resetClientsForTests();
  });
  afterEach(() => {
    resetClientsForTests();
    vi.unstubAllEnvs();
  });

  it("is off unless TEST_FIXTURES is exactly '1'", () => {
    expect(fixturesEnabled({})).toBe(false);
    expect(fixturesEnabled({ TEST_FIXTURES: "true" })).toBe(false);
    expect(fixturesEnabled({ TEST_FIXTURES: "1" })).toBe(true);
  });

  it("serves published releases newest-first with nulls first, honouring eq and limit", async () => {
    const db = createInMemoryShim({ releases: releaseFixtures });
    const { data } = await db
      .from("releases")
      .select("*, tracks(*)")
      .eq("published", true)
      .order("release_date", { ascending: false, nullsFirst: true })
      .order("sort_order", { ascending: false });
    expect((data as Array<{ slug: string }>).map((r) => r.slug)).toEqual([
      "champion",
      "presave-fixture",
      "throne-room",
    ]);

    const one = await db
      .from("releases")
      .select("*")
      .eq("slug", "draft-fixture")
      .eq("published", true)
      .maybeSingle();
    expect(one.data).toBeNull();

    const draft = await db.from("releases").select("*").eq("slug", "draft-fixture").maybeSingle();
    expect((draft.data as { slug: string }).slug).toBe("draft-fixture");

    const limited = await db
      .from("releases")
      .select("*")
      .eq("published", true)
      .eq("featured", true)
      .limit(1)
      .maybeSingle();
    expect((limited.data as { slug: string }).slug).toBe("champion");
  });

  it("the no-env runtime shim reads empty without the flag and fixtures with it", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("TEST_FIXTURES", "");
    const empty = await createAnonClient().from("releases").select("*");
    expect(empty.data).toEqual([]);

    resetClientsForTests();
    vi.stubEnv("TEST_FIXTURES", "1");
    const seeded = await createAnonClient().from("releases").select("*");
    expect((seeded.data as unknown[]).length).toBe(releaseFixtures.length);
  });
});
