/**
 * Prop shapes for the presentational components.
 *
 * The release / track models come from the data layer so there is exactly one
 * definition (`src/lib/db/types.ts` mirrors the Postgres schema). Only the
 * drop-alert action contract lives here — it is a UI/server-action boundary,
 * not a database row.
 */

export type {
  DspKey,
  DspLinks as DspLinkMap,
  Release,
  ReleaseStatus,
  ReleaseType,
  Track,
} from "@/lib/db/types";

/** Outcome of the drop-alert `subscribe()` server action. */
export type SubscribeResult =
  | { ok: true; state: "created" | "already_subscribed" }
  | { ok: false; code: "invalid_email" | "rate_limited" | "server_error" };
