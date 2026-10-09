import type { ReleaseWithTracksRow, TrackRow } from "./types";

/**
 * Fixture rows served by the in-memory shim when TEST_FIXTURES=1 (and no
 * Supabase URL is set). Mirrors supabase/seed.sql plus two rows the e2e
 * suite needs: a released single with playable tracks and an upcoming EP
 * with exactly one pre-save link. Audio points at the committed test WAV.
 */

const CREATED = "2026-10-01T00:00:00Z";

function release(
  overrides: Partial<ReleaseWithTracksRow> &
    Pick<ReleaseWithTracksRow, "id" | "slug" | "title">,
): ReleaseWithTracksRow {
  return {
    type: "single",
    description: null,
    release_date: null,
    artwork_path: null,
    artwork_url: null,
    covnant_cbt_code: null,
    covnant_url: null,
    dsp_links: {},
    meta: {},
    published: true,
    featured: false,
    sort_order: 0,
    created_at: CREATED,
    updated_at: CREATED,
    tracks: [],
    ...overrides,
  };
}

function track(
  releaseId: string,
  position: number,
  title: string,
  overrides: Partial<TrackRow> = {},
): TrackRow {
  return {
    id: `${releaseId}-t${position}`,
    release_id: releaseId,
    position,
    title,
    duration_seconds: 3,
    audio_path: `${releaseId}/${String(position).padStart(2, "0")}.wav`,
    audio_url: `/test-audio/tone.wav?track=${releaseId}-${position}`,
    isrc: null,
    credits: null,
    ...overrides,
  };
}

export const FIXTURE_IDS = {
  champion: "00000000-0000-4000-8000-000000000001",
  throneRoom: "00000000-0000-4000-8000-000000000002",
  presave: "00000000-0000-4000-8000-000000000003",
  draft: "00000000-0000-4000-8000-000000000004",
} as const;

export const releaseFixtures: readonly ReleaseWithTracksRow[] = [
  // The launch-day seed: flagship, no date, no art, no links, no tracks.
  release({
    id: FIXTURE_IDS.champion,
    slug: "champion",
    title: "CHAMPION",
    type: "album",
    description: "Recorded in Austin. Drops here first.",
    featured: true,
  }),
  // A release that is out: playable, registered on Covnant, one listen link.
  release({
    id: FIXTURE_IDS.throneRoom,
    slug: "throne-room",
    title: "Throne Room",
    description: "The first one out the door.",
    release_date: "2026-06-12",
    covnant_cbt_code: "CBT-7F3A9",
    covnant_url: "https://covnant-eta.vercel.app/assets/7f3a9",
    dsp_links: { spotify: "https://open.spotify.com/track/x" },
    tracks: [
      track(FIXTURE_IDS.throneRoom, 1, "Throne Room", {
        duration_seconds: 245,
        credits: "Prod. Yeshua Throne",
      }),
      track(FIXTURE_IDS.throneRoom, 2, "Austin Nights"),
    ],
  }),
  // Upcoming with a date and exactly one pre-save link (the "one anchor" case).
  release({
    id: FIXTURE_IDS.presave,
    slug: "presave-fixture",
    title: "Presave Fixture",
    type: "ep",
    release_date: "2027-03-14",
    dsp_links: { apple: "https://music.apple.com/pre-add/x" },
  }),
  // Unpublished draft: must 404 without the preview secret.
  release({
    id: FIXTURE_IDS.draft,
    slug: "draft-fixture",
    title: "Draft Fixture",
    description: "Unpublished test row. Not fan-visible.",
    release_date: "2020-01-01",
    published: false,
    tracks: [track(FIXTURE_IDS.draft, 1, "Draft Track")],
  }),
];
