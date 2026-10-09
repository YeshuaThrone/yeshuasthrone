import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  NO_DATABASE_ERROR,
  createAnonClient,
  createServiceClient,
  isDatabaseConfigured,
  isInMemoryShim,
  readDbEnv,
  resetClientsForTests,
  storagePublicBase,
} from "./server";

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
      .from("drop_alerts")
      .insert({ email: "fan@example.com" });
    expect(result.data).toBeNull();
    expect(result.error).toEqual(NO_DATABASE_ERROR);
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
