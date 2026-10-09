/**
 * Database row shapes (mirror supabase/migrations/0001_init.sql), the
 * fan-facing models the pages consume, and the pure row -> model mappers.
 *
 * Nothing here touches the network; keep it that way so it stays unit-testable.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ReleaseType = "single" | "ep" | "album";

export const DSP_KEYS = [
  "spotify",
  "apple",
  "youtube",
  "tidal",
  "soundcloud",
] as const;
export type DspKey = (typeof DSP_KEYS)[number];
export type DspLinks = Partial<Record<DspKey, string>>;

export type ReleaseStatus = "upcoming" | "released";

// ---------------------------------------------------------------------------
// Rows — one type per table, column names as in Postgres. Type aliases, not
// interfaces: supabase-js constrains rows to Record<string, unknown>, which an
// interface (no implicit index signature) does not satisfy.
// ---------------------------------------------------------------------------

export type ReleaseRow = {
  id: string;
  slug: string;
  title: string;
  type: ReleaseType;
  description: string | null;
  release_date: string | null; // ISO date (YYYY-MM-DD); null = date TBA
  artwork_path: string | null;
  artwork_url: string | null;
  covnant_cbt_code: string | null;
  covnant_url: string | null;
  dsp_links: Json;
  meta: Json;
  published: boolean;
  featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type TrackRow = {
  id: string;
  release_id: string;
  position: number;
  title: string;
  duration_seconds: number | null;
  audio_path: string;
  audio_url: string | null;
  isrc: string | null;
  credits: string | null;
};

export type DropAlertRow = {
  id: string;
  email: string;
  source: string;
  unsubscribe_token: string;
  created_at: string;
};

type Insertable<Row, Optional extends keyof Row> = Omit<Row, Optional> &
  Partial<Pick<Row, Optional>>;

/** supabase-js `Database` generic — hand-written to match 0001_init.sql. */
export interface Database {
  public: {
    Tables: {
      releases: {
        Row: ReleaseRow;
        Insert: Insertable<
          ReleaseRow,
          | "id"
          | "type"
          | "description"
          | "release_date"
          | "artwork_path"
          | "artwork_url"
          | "covnant_cbt_code"
          | "covnant_url"
          | "dsp_links"
          | "meta"
          | "published"
          | "featured"
          | "sort_order"
          | "created_at"
          | "updated_at"
        >;
        Update: Partial<ReleaseRow>;
        Relationships: [];
      };
      tracks: {
        Row: TrackRow;
        Insert: Insertable<
          TrackRow,
          "id" | "duration_seconds" | "audio_url" | "isrc" | "credits"
        >;
        Update: Partial<TrackRow>;
        Relationships: [
          {
            foreignKeyName: "tracks_release_id_fkey";
            columns: ["release_id"];
            isOneToOne: false;
            referencedRelation: "releases";
            referencedColumns: ["id"];
          },
        ];
      };
      drop_alerts: {
        Row: DropAlertRow;
        Insert: Insertable<
          DropAlertRow,
          "id" | "source" | "unsubscribe_token" | "created_at"
        >;
        Update: Partial<DropAlertRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: { release_type: ReleaseType };
    CompositeTypes: Record<string, never>;
  };
}

/** A release row with its tracks embedded (`select('*, tracks(*)')`). */
export type ReleaseWithTracksRow = ReleaseRow & { tracks: TrackRow[] };

// ---------------------------------------------------------------------------
// Models — what the pages render.
// ---------------------------------------------------------------------------

export interface Track {
  id: string;
  position: number;
  title: string;
  durationSeconds: number | null;
  /** Resolved public URL; null only when neither audio_url nor a storage base is known. */
  audioUrl: string | null;
  isrc: string | null;
  credits: string | null;
}

export interface Release {
  id: string;
  slug: string;
  title: string;
  type: ReleaseType;
  description: string | null;
  /** ISO date (YYYY-MM-DD), or null when the date is still TBA. */
  releaseDate: string | null;
  artworkUrl: string | null;
  covnantCbtCode: string | null;
  covnantUrl: string | null;
  /** DSP links after release day; pre-save links before it. Same keys. */
  dspLinks: DspLinks;
  featured: boolean;
  status: ReleaseStatus;
  /** Ordered by position. Empty for an upcoming release. */
  tracks: Track[];
}

// ---------------------------------------------------------------------------
// Pure mappers
// ---------------------------------------------------------------------------

/** Calendar date of `date` in UTC as YYYY-MM-DD — the same clock Vercel runs on. */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * A release is upcoming when it has no date yet or its date is after today.
 * Today or earlier means released. Compared as ISO date strings in UTC.
 */
export function deriveStatus(
  releaseDate: string | null,
  today: Date = new Date(),
): ReleaseStatus {
  if (releaseDate === null) return "upcoming";
  return releaseDate > toIsoDate(today) ? "upcoming" : "released";
}

/** Keep only the DSP keys we render, and only when the value is a non-empty string. */
export function toDspLinks(json: Json): DspLinks {
  if (typeof json !== "object" || json === null || Array.isArray(json)) {
    return {};
  }
  const links: DspLinks = {};
  for (const key of DSP_KEYS) {
    const value = json[key];
    if (typeof value === "string" && value.length > 0) links[key] = value;
  }
  return links;
}

/** Options shared by the row mappers. */
export interface MapOptions {
  today?: Date;
  /**
   * Base of the public storage endpoint, e.g.
   * `https://xyz.supabase.co/storage/v1/object/public`. Null when no Supabase
   * URL is configured; rows then keep whatever explicit URL they carry.
   */
  storagePublicBase?: string | null;
}

export function resolveStorageUrl(
  explicitUrl: string | null,
  bucket: "artwork" | "audio",
  path: string | null,
  storagePublicBase: string | null | undefined,
): string | null {
  if (explicitUrl) return explicitUrl;
  if (!path || !storagePublicBase) return null;
  return `${storagePublicBase}/${bucket}/${path}`;
}

export function toTrack(row: TrackRow, opts: MapOptions = {}): Track {
  return {
    id: row.id,
    position: row.position,
    title: row.title,
    durationSeconds: row.duration_seconds,
    audioUrl: resolveStorageUrl(
      row.audio_url,
      "audio",
      row.audio_path,
      opts.storagePublicBase,
    ),
    isrc: row.isrc,
    credits: row.credits,
  };
}

export function toRelease(
  row: ReleaseWithTracksRow,
  opts: MapOptions = {},
): Release {
  const tracks = [...row.tracks]
    .sort((a, b) => a.position - b.position)
    .map((track) => toTrack(track, opts));
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    type: row.type,
    description: row.description,
    releaseDate: row.release_date,
    artworkUrl: resolveStorageUrl(
      row.artwork_url,
      "artwork",
      row.artwork_path,
      opts.storagePublicBase,
    ),
    covnantCbtCode: row.covnant_cbt_code,
    covnantUrl: row.covnant_url,
    dspLinks: toDspLinks(row.dsp_links),
    featured: row.featured,
    status: deriveStatus(row.release_date, opts.today),
    tracks,
  };
}
