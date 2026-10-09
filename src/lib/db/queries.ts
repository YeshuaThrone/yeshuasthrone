import "server-only";

import { cache } from "react";
import {
  createAnonClient,
  createServiceClient,
  readDbEnv,
  storagePublicBase,
  type DbClient,
} from "./server";
import {
  toRelease,
  type Release,
  type ReleaseWithTracksRow,
} from "./types";

/**
 * Server-only read layer. Pages call these; nothing else talks to Supabase
 * for reads. Every function is wrapped in React `cache()` so a page that
 * needs the same release in metadata and body hits the database once.
 *
 * Reads never throw to a fan: a database error is logged and surfaces as
 * "no releases" (spec: never a 500 for a read). ISR keeps the last good HTML.
 */

const RELEASE_WITH_TRACKS = "*, tracks(*)";

function mapOptions() {
  return { storagePublicBase: storagePublicBase(readDbEnv()) };
}

function logReadError(where: string, error: { message: string; code?: string }) {
  console.error(`[db] ${where} failed: ${error.code ?? "?"} ${error.message}`);
}

/**
 * Newest first. Null dates sort first: an undated release is upcoming and
 * belongs ahead of everything already out. Ties break on sort_order, then
 * creation time. Must be the last modifier (PostgREST filters precede order).
 */
function newestFirst<Q extends NewestFirstOrderable<Q>>(query: Q): Q {
  return query
    .order("release_date", { ascending: false, nullsFirst: true })
    .order("sort_order", { ascending: false })
    .order("created_at", { ascending: false });
}

interface NewestFirstOrderable<Q> {
  order(
    column: "release_date" | "sort_order" | "created_at",
    opts: { ascending: boolean; nullsFirst?: boolean },
  ): Q;
}

function selectPublished(client: DbClient) {
  return client.from("releases").select(RELEASE_WITH_TRACKS).eq("published", true);
}

/** All published releases, newest first, tracks ordered by position. */
export const getPublishedReleases = cache(async (): Promise<Release[]> => {
  const { data, error } = await newestFirst(selectPublished(createAnonClient()));
  if (error) {
    logReadError("getPublishedReleases", error);
    return [];
  }
  const opts = mapOptions();
  return (data as ReleaseWithTracksRow[]).map((row) => toRelease(row, opts));
});

export interface GetReleaseOptions {
  /**
   * Preview mode: read with the service role and ignore `published`. The
   * caller is responsible for having verified PREVIEW_SECRET first — this
   * layer trusts the flag.
   */
  preview?: boolean;
}

/**
 * One release by slug, or null. Unpublished releases are null unless
 * `preview` is set, so a draft is indistinguishable from a nonexistent slug.
 */
export const getReleaseBySlug = cache(
  async (slug: string, opts: GetReleaseOptions = {}): Promise<Release | null> => {
    const client = opts.preview ? createServiceClient() : createAnonClient();
    let query = client.from("releases").select(RELEASE_WITH_TRACKS).eq("slug", slug);
    if (!opts.preview) query = query.eq("published", true);
    const { data, error } = await query.maybeSingle();
    if (error) {
      logReadError(`getReleaseBySlug(${slug})`, error);
      return null;
    }
    if (!data) return null;
    return toRelease(data as ReleaseWithTracksRow, mapOptions());
  },
);

/**
 * The home-page flagship: the newest published release flagged `featured`,
 * falling back to the newest published release when nothing is flagged.
 * Null only when nothing is published at all (launch-day state).
 */
export const getFeaturedRelease = cache(async (): Promise<Release | null> => {
  const client = createAnonClient();
  const featured = await newestFirst(selectPublished(client).eq("featured", true))
    .limit(1)
    .maybeSingle();
  if (featured.error) {
    logReadError("getFeaturedRelease", featured.error);
    return null;
  }
  if (featured.data) {
    return toRelease(featured.data as ReleaseWithTracksRow, mapOptions());
  }

  const newest = await newestFirst(selectPublished(client)).limit(1).maybeSingle();
  if (newest.error) {
    logReadError("getFeaturedRelease(fallback)", newest.error);
    return null;
  }
  return newest.data
    ? toRelease(newest.data as ReleaseWithTracksRow, mapOptions())
    : null;
});
