import "server-only";

import {
  createClient,
  type SupabaseClient,
  type WebSocketLike,
  type WebSocketLikeConstructor,
} from "@supabase/supabase-js";
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
 * state) and writes resolve with a `no_database` error rather than pretending.
 * The one exception is `drop_alerts`: the shim keeps a per-process set of
 * emails so the signup form is exercisable end-to-end without a database
 * (first insert succeeds, a duplicate is a `23505` like Postgres). Rows are
 * lost on restart; a warning says so on every write.
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

/** Shape of Postgres' unique_violation as supabase-js reports it. */
export const UNIQUE_VIOLATION_ERROR = {
  code: "23505",
  message: 'duplicate key value violates unique constraint "drop_alerts_email_key"',
  details: "",
  hint: "",
} as const;

interface ShimResponse {
  data: unknown;
  error: typeof NO_DATABASE_ERROR | typeof UNIQUE_VIOLATION_ERROR | null;
  count: null;
  status: number;
  statusText: string;
}

/**
 * `read` resolves empty; `write` refuses with `no_database`; `accepted` is a
 * write the in-memory store took; `duplicate` is one it rejected as a 23505.
 */
type ShimKind = "read" | "write" | "accepted" | "duplicate";
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
    if (this.kind === "duplicate") {
      return {
        data: null,
        error: UNIQUE_VIOLATION_ERROR,
        count: null,
        status: 409,
        statusText: "Conflict",
      };
    }
    if (this.kind === "accepted") {
      return { data: null, error: null, count: null, status: 201, statusText: "Created" };
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

/** Insert signature shared by the shim tables; the payload is only read by drop_alerts. */
type ShimInsert = (payload?: unknown) => ShimQuery;

class ShimTable {
  select = () => new ShimQuery("read", "many");
  insert: ShimInsert = () => new ShimQuery("write", "many");
  upsert = () => new ShimQuery("write", "many");
  update = () => new ShimQuery("write", "many");
  delete = () => new ShimQuery("write", "many");
}

/** Emails from one `drop_alerts` insert payload, lower-cased like citext. */
function emailsFromInsert(payload: unknown): string[] {
  const rows = Array.isArray(payload) ? payload : [payload];
  return rows.flatMap((row) => {
    const email = (row as { email?: unknown } | null)?.email;
    return typeof email === "string" ? [email.toLowerCase()] : [];
  });
}

/** The one table the shim actually stores: see the module comment. */
class ShimDropAlertsTable extends ShimTable {
  constructor(private readonly emails: Set<string>) {
    super();
  }
  insert: ShimInsert = (payload) => {
    const incoming = emailsFromInsert(payload);
    if (incoming.some((e) => this.emails.has(e))) {
      return new ShimQuery("duplicate", "many");
    }
    for (const e of incoming) this.emails.add(e);
    console.warn(
      "[db] drop_alerts insert kept in memory only: Supabase is not configured.",
    );
    return new ShimQuery("accepted", "many");
  };
}

export class InMemoryDbShim {
  readonly isShim = true as const;
  private readonly dropAlertEmails = new Set<string>();

  // Every table but drop_alerts behaves the same: empty reads, refused writes.
  from(table: string): ShimTable {
    return table === "drop_alerts"
      ? new ShimDropAlertsTable(this.dropAlertEmails)
      : new ShimTable();
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

/**
 * Realtime is never used by this site, but supabase-js constructs a
 * RealtimeClient eagerly and, on Node < 22 with no native WebSocket, throws
 * at createClient() unless a transport is supplied. This stub satisfies the
 * constructor contract and only fails if something actually tries to connect.
 */
const NoRealtimeTransport: WebSocketLikeConstructor = function (): WebSocketLike {
  throw new Error("Realtime is not used by this site; no WebSocket transport.");
} as unknown as WebSocketLikeConstructor;

export const clientOptions = {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: NoRealtimeTransport },
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
