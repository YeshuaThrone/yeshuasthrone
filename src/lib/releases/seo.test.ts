import { describe, expect, it } from "vitest";
import { champion, releasedSingle, tracks } from "@/test/fixtures";
import { isoDuration, releaseJsonLd, releaseMetadata } from "./seo";

const env = { NEXT_PUBLIC_SITE_URL: "https://yeshuathrone.com" };

describe("releaseMetadata", () => {
  it("released single snapshot", () => {
    expect(releaseMetadata(releasedSingle)).toMatchSnapshot();
  });

  it("upcoming album snapshot", () => {
    expect(releaseMetadata(champion)).toMatchSnapshot();
  });

  it("points the share image at the release's own OG render, never the raw artwork", () => {
    const meta = releaseMetadata(releasedSingle);
    expect(meta.openGraph?.images).toEqual([expect.objectContaining({ url: "/api/og/throne-room" })]);
    expect(meta.openGraph).toMatchObject({ type: "music.song" });
    expect(releaseMetadata(champion).openGraph).toMatchObject({ type: "music.album" });
  });
});

describe("releaseJsonLd", () => {
  it("released: MusicAlbum with one MusicRecording per track", () => {
    const ld = releaseJsonLd(
      { ...releasedSingle, tracks: [{ ...tracks[1], isrc: "USABC2600002" }, tracks[0]] },
      env,
    );
    expect(ld).toMatchSnapshot();
    expect(ld).toMatchObject({ "@type": "MusicAlbum", numTracks: 2 });
    if (!("track" in ld)) throw new Error("released JSON-LD must carry tracks");
    const recordings = ld.track;
    // Sorted by position regardless of input order; isrc only when present.
    expect(recordings.map((t) => t.position)).toEqual([1, 2]);
    expect(recordings[0]).toMatchObject({
      "@type": "MusicRecording",
      name: "Throne Room",
      byArtist: { "@type": "MusicGroup", name: "Yeshua Throne" },
      inAlbum: { "@type": "MusicAlbum", name: "Throne Room" },
      datePublished: "2026-06-12",
      duration: "PT4M5S",
    });
    expect(recordings[0]).not.toHaveProperty("isrcCode");
    expect(recordings[1]).toMatchObject({ isrcCode: "USABC2600002" });
    expect(recordings[1]).not.toHaveProperty("duration");
  });

  it("upcoming: MusicAlbum with no tracks and no invented date", () => {
    const ld = releaseJsonLd(champion, env);
    expect(ld).toMatchSnapshot();
    expect(ld).toMatchObject({
      "@type": "MusicAlbum",
      name: "CHAMPION",
      albumReleaseType: "AlbumRelease",
      url: "https://yeshuathrone.com/music/champion",
    });
    expect(ld).not.toHaveProperty("track");
    expect(ld).not.toHaveProperty("datePublished");
    expect(JSON.stringify(ld)).not.toContain("MusicRecording");
  });

  it("upcoming with a date carries datePublished", () => {
    expect(releaseJsonLd({ ...champion, releaseDate: "2027-03-14" }, env)).toMatchObject({
      datePublished: "2027-03-14",
    });
  });
});

describe("isoDuration", () => {
  it("formats seconds as ISO 8601", () => {
    expect(isoDuration(245)).toBe("PT4M5S");
    expect(isoDuration(59)).toBe("PT59S");
    expect(isoDuration(3661)).toBe("PT1H1M1S");
    expect(isoDuration(0)).toBe("PT0S");
  });
});
