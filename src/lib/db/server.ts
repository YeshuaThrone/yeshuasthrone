import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Server-only Supabase access. Two clients:
 *
 * - anon: what a fan gets. RLS limits it to published releases and tracks.
 * - service: bypasses RLS. Preview reads and drop-alert inserts only.
 *   The key never leaves the server; this module refuses to load in a
 *   Client Component (`server-only`).
 *
 * With no NEXT_PUBLIC_SUPABASE_URL set, both return an in-memory shim so the
 * build and the no-env runtime work: reads resolve empty (the no-releases
 * state), writes resolve with a `no_database` error rather than pretending.
 */

export type DbClient = SupabaseClient<Database>;

export interface DbEnv {
  url: string | null;
  anonKey: string | null;
  serviceRoleKey: string | null;
}

/** process.env or any string map; tests pass plain objects. */
export type DbEnvSource = Record<string, string | undefined>;

export function readDbEnv(env: DbEnvSource = process.env): DbEnv {
  const trim = (v: string | undefined): string | null =>
    v && v.trim().length > 0 ? v.trim() : null;
  return {
    url: trim(env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: trim(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRoleKey: trim(env.SUPABASE_SERVICE_ROLE_KEY),
  };
}

export function isDatabaseConfigured(env: DbEnv = readDbEnv()): boolean {
  return env.url !== null && env.anonKey !== null;
}

/** Public storage base for resolving `artwork_path` / `audio_path`, or null without env. */
export function storagePublicBase(env: DbEnv = readDbEnv()): string | null {
  return env.url ? `${env.url.replace(/\/+$/, "")}/storage/v1/object/public` : null;
}

// ---------------------------------------------------------------------------
// In-memory shim
// ---------------------------------------------------------------------------

export const NO_DATABASE_ERROR = {
  code: "no_database",
  message: "Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL is unset).",
  details: "",
  hint: "",
} as const;

interface ShimResponse {
  data: unknown;
  error: typeof NO_DATABASE_ERROR | null;
  count: null;
  status: number;
  statusText: string;
}

type ShimKind = "read" | "write";
type ShimShape = "many" | "one";

/**
 * Minimal stand-in for a PostgREST query builder: every chained filter or
 * modifier returns the same builder; awaiting it yields an empty read or a
 * `no_database` write error. Covers the surface `queries.ts` and the
 * server actions use; anything else is a bug and surfaces as a TypeError.
 */
class ShimQuery implements PromiseLike<ShimResponse> {
  constructor(
    private readonly kind: ShimKind,
    private readonly shape: ShimShape,
  ) {}

  private chain(): ShimQuery {
    return this;
  }
  select = () => (this.kind === "read" ? this : new ShimQuery(this.kind, "many"));
  eq = this.chain;
  neq = this.chain;
  is = this.chain;
  in = this.chain;
  gt = this.chain;
  gte = this.chain;
  lt = this.chain;
  lte = this.chain;
  order = this.chain;
  limit = this.chain;
  range = this.chain;
  single = () => new ShimQuery(this.kind, "one");
  maybeSingle = () => new ShimQuery(this.kind, "one");

  private response(): ShimResponse {
    if (this.kind === "write") {
      return {
        data: null,
        error: NO_DATABASE_ERROR,
        count: null,
        status: 503,
        statusText: "Service Unavailable",
      };
    }
    return {
      data: this.shape === "many" ? [] : null,
      error: null,
      count: null,
      status: 200,
      statusText: "OK",
    };
  }

  then<R1 = ShimResponse, R2 = never>(
    onfulfilled?: ((value: ShimResponse) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return Promise.resolve(this.response()).then(onfulfilled, onrejected);
  }
}

class ShimTable {
  select = () => new ShimQuery("read", "many");
  insert = () => new ShimQuery("write", "many");
  upsert = () => new ShimQuery("write", "many");
  update = () => new ShimQuery("write", "many");
  delete = () => new ShimQuery("write", "many");
}

export class InMemoryDbShim {
  readonly isShim = true as const;
  // Every table behaves the same: empty reads, refused writes.
  from(): ShimTable {
    return new ShimTable();
  }
}

export function createInMemoryShim(): DbClient {
  // The shim is structurally a strict subset of SupabaseClient. The cast is
  // the single place we assert that; keep ShimTable/ShimQuery in step with
  // the methods queries.ts and the server actions actually call.
  return new InMemoryDbShim() as unknown as DbClient;
}

export function isInMemoryShim(client: DbClient): boolean {
  return (client as unknown as { isShim?: true }).isShim === true;
}

// ---------------------------------------------------------------------------
// Clients (memoized per process)
// ---------------------------------------------------------------------------

const clientOptions = {
  auth: { persistSession: false, autoRefreshToken: false },
} as const;

let anonClient: DbClient | undefined;
let serviceClient: DbClient | undefined;

export function createAnonClient(env: DbEnv = readDbEnv()): DbClient {
  if (anonClient) return anonClient;
  if (!env.url || !env.anonKey) {
    anonClient = createInMemoryShim();
    return anonClient;
  }
  anonClient = createClient<Database>(env.url, env.anonKey, clientOptions);
  return anonClient;
}

/**
 * Service-role client. Throws (at call time, never at import) when the URL is
 * set but the service key is not — a half-configured deploy must fail loudly
 * on preview/drop-alert paths rather than silently falling back to anon.
 */
export function createServiceClient(env: DbEnv = readDbEnv()): DbClient {
  if (serviceClient) return serviceClient;
  if (!env.url) {
    serviceClient = createInMemoryShim();
    return serviceClient;
  }
  if (!env.serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is unset but NEXT_PUBLIC_SUPABASE_URL is set.",
    );
  }
  serviceClient = createClient<Database>(
    env.url,
    env.serviceRoleKey,
    clientOptions,
  );
  return serviceClient;
}

/** Test hook: drop memoized clients so a new env takes effect. */
export function resetClientsForTests(): void {
  anonClient = undefined;
  serviceClient = undefined;
}
