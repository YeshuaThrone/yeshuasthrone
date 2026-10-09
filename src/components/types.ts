/**
 * Prop shapes for the presentational components.
 *
 * Defined locally so the component library never imports from the data layer.
 * `src/lib/db` exports the same `Release` / `Track` shape; the pages PR wires
 * the two together.
 */

export type ReleaseType = "single" | "ep" | "album";

/** `upcoming` = release_date is null or in the future; `released` otherwise. */
export type ReleaseStatus = "upcoming" | "released";

export type DspKey = "spotify" | "apple" | "youtube" | "tidal" | "soundcloud";

/** Pre-save links before release day; listen links after. Same keys. */
export type DspLinkMap = Partial<Record<DspKey, string>>;

export interface Track {
  id: string;
  position: number;
  title: string;
  durationSeconds: number | null;
  audioUrl: string;
  isrc: string | null;
  credits: string | null;
}

export interface Release {
  id: string;
  slug: string;
  title: string;
  type: ReleaseType;
  description: string | null;
  /** ISO date (`YYYY-MM-DD`); null when the date is still TBA. */
  releaseDate: string | null;
  artworkUrl: string | null;
  covnantCbtCode: string | null;
  covnantUrl: string | null;
  dspLinks: DspLinkMap;
  status: ReleaseStatus;
  tracks: Track[];
}

/** Outcome of the drop-alert `subscribe()` server action. */
export type SubscribeResult =
  | { ok: true; state: "created" | "already_subscribed" }
  | { ok: false; code: "invalid_email" | "rate_limited" | "server_error" };
