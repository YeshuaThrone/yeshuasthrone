import { describe, expect, it } from "vitest";
import {
  deriveStatus,
  resolveStorageUrl,
  toDspLinks,
  toRelease,
  type ReleaseWithTracksRow,
  type TrackRow,
} from "./types";

// Fixed "now" so the today/tomorrow/yesterday cases never drift across midnight.
const TODAY = new Date("2026-10-09T15:30:00Z");

describe("deriveStatus", () => {
  it("null date is upcoming (date TBA)", () => {
    expect(deriveStatus(null, TODAY)).toBe("upcoming");
  });

  it("tomorrow is upcoming", () => {
    expect(deriveStatus("2026-10-10", TODAY)).toBe("upcoming");
  });

  it("today is released", () => {
    expect(deriveStatus("2026-10-09", TODAY)).toBe("released");
  });

  it("yesterday is released", () => {
    expect(deriveStatus("2026-10-08", TODAY)).toBe("released");
  });

  it("compares on the UTC calendar date, not local time", () => {
    // 23:59 UTC on the 9th is still the 9th: a release dated the 9th is out.
    expect(deriveStatus("2026-10-09", new Date("2026-10-09T23:59:59Z"))).toBe(
      "released",
    );
    // 00:00 UTC on the 10th: the 10th has arrived.
    expect(deriveStatus("2026-10-10", new Date("2026-10-10T00:00:00Z"))).toBe(
      "released",
    );
  });
});

describe("toDspLinks", () => {
  it("keeps only known keys with non-empty string values", () => {
    expect(
      toDspLinks({
        spotify: "https://open.spotify.com/x",
        apple: "",
        tidal: 42,
        bandcamp: "https://bandcamp.com/x",
        youtube: null,
      }),
    ).toEqual({ spotify: "https://open.spotify.com/x" });
  });

  it("returns an empty map for non-object json", () => {
    expect(toDspLinks(null)).toEqual({});
    expect(toDspLinks("spotify")).toEqual({});
    expect(toDspLinks(["spotify"])).toEqual({});
  });
});

describe("resolveStorageUrl", () => {
  const base = "https://x.supabase.co/storage/v1/object/public";

  it("prefers the explicit url", () => {
    expect(resolveStorageUrl("https://cdn/a.jpg", "artwork", "a.jpg", base)).toBe(
      "https://cdn/a.jpg",
    );
  });

  it("builds a public url from the path when a base is known", () => {
    expect(resolveStorageUrl(null, "audio", "champion/01.mp3", base)).toBe(
      `${base}/audio/champion/01.mp3`,
    );
  });

  it("is null without a path or without a base", () => {
    expect(resolveStorageUrl(null, "audio", null, base)).toBeNull();
    expect(resolveStorageUrl(null, "audio", "champion/01.mp3", null)).toBeNull();
  });
});

describe("toRelease", () => {
  const track = (position: number, overrides: Partial<TrackRow> = {}): TrackRow => ({
    id: `t${position}`,
    release_id: "r1",
    position,
    title: `Track ${position}`,
    duration_seconds: 180,
    audio_path: `champion/0${position}.mp3`,
    audio_url: null,
    isrc: null,
    credits: null,
    ...overrides,
  });

  const champion: ReleaseWithTracksRow = {
    id: "r1",
    slug: "champion",
    title: "CHAMPION",
    type: "album",
    description: "Recorded in Austin. Drops here first.",
    release_date: null,
    artwork_path: null,
    artwork_url: null,
    covnant_cbt_code: null,
    covnant_url: null,
    dsp_links: {},
    meta: {},
    published: true,
    featured: true,
    sort_order: 0,
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
    tracks: [],
  };

  it("maps the CHAMPION seed to an upcoming release with no tracks", () => {
    expect(toRelease(champion, { today: TODAY })).toEqual({
      id: "r1",
      slug: "champion",
      title: "CHAMPION",
      type: "album",
      description: "Recorded in Austin. Drops here first.",
      releaseDate: null,
      artworkUrl: null,
      covnantCbtCode: null,
      covnantUrl: null,
      dspLinks: {},
      featured: true,
      status: "upcoming",
      tracks: [],
    });
  });

  it("orders tracks by position and resolves storage urls", () => {
    const base = "https://x.supabase.co/storage/v1/object/public";
    const released = toRelease(
      {
        ...champion,
        release_date: "2026-10-01",
        artwork_path: "champion.jpg",
        tracks: [track(2), track(1, { audio_url: "https://cdn/one.mp3" })],
      },
      { today: TODAY, storagePublicBase: base },
    );
    expect(released.status).toBe("released");
    expect(released.artworkUrl).toBe(`${base}/artwork/champion.jpg`);
    expect(released.tracks.map((t) => [t.position, t.audioUrl])).toEqual([
      [1, "https://cdn/one.mp3"],
      [2, `${base}/audio/champion/02.mp3`],
    ]);
  });
});
