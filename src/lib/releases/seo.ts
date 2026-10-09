import type { Metadata } from "next";
import { site } from "@/content/site";
import type { Release, ReleaseType, Track } from "@/lib/db/types";
import { releaseTypeLabel } from "@/lib/format";
import { absoluteUrl, buildMetadata, type SeoEnvSource } from "@/lib/seo";

/** Meta description: the release's own copy, else a generated line. */
export function releaseDescription(
  release: Pick<Release, "title" | "type" | "description">,
): string {
  return (
    release.description ??
    `${release.title} — ${releaseTypeLabel(release.type)} by ${site.name}. ${site.tagline}`
  );
}

export function releasePath(slug: string): string {
  return `/music/${slug}`;
}

/** Page metadata for `/music/[slug]`; the share image is the release's own OG render. */
export function releaseMetadata(release: Release): Metadata {
  return buildMetadata({
    title: release.title,
    description: releaseDescription(release),
    path: releasePath(release.slug),
    ogSlug: release.slug,
    ogType: release.type === "single" ? "music.song" : "music.album",
  });
}

// ---------------------------------------------------------------------------
// JSON-LD
// ---------------------------------------------------------------------------

const ALBUM_RELEASE_TYPE: Record<ReleaseType, string> = {
  single: "SingleRelease",
  ep: "EPRelease",
  album: "AlbumRelease",
};

const BY_ARTIST = { "@type": "MusicGroup", name: site.name } as const;

interface MusicRecordingLd {
  "@type": "MusicRecording";
  "@id": string;
  name: string;
  url: string;
  byArtist: typeof BY_ARTIST;
  inAlbum: { "@type": "MusicAlbum"; name: string; url: string };
  position: number;
  datePublished: string;
  duration?: string;
  isrcCode?: string;
  image?: string;
}

/** 245 → "PT4M5S" (ISO 8601 duration, what schema.org expects). */
export function isoDuration(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const secs = whole % 60;
  return `PT${hours ? `${hours}H` : ""}${minutes ? `${minutes}M` : ""}${secs}S`;
}

function recordingLd(
  release: Release,
  track: Track,
  url: string,
  datePublished: string,
): MusicRecordingLd {
  return {
    "@type": "MusicRecording",
    "@id": `${url}#track-${track.position}`,
    name: track.title,
    url,
    byArtist: BY_ARTIST,
    inAlbum: { "@type": "MusicAlbum", name: release.title, url },
    position: track.position,
    datePublished,
    ...(track.durationSeconds !== null ? { duration: isoDuration(track.durationSeconds) } : {}),
    ...(track.isrc ? { isrcCode: track.isrc } : {}),
    ...(release.artworkUrl ? { image: release.artworkUrl } : {}),
  };
}

/**
 * Structured data for a release page.
 *
 * Released: one `MusicRecording` per track (name, byArtist, inAlbum,
 * datePublished, isrc when present), wrapped in the album so search engines
 * see the whole record. Upcoming: a bare `MusicAlbum` — no tracks, because
 * there are none yet and a pre-save page must not claim recordings exist.
 */
export function releaseJsonLd(release: Release, env: SeoEnvSource = process.env) {
  const url = absoluteUrl(releasePath(release.slug), env);
  const album = {
    "@context": "https://schema.org",
    "@type": "MusicAlbum",
    "@id": url,
    name: release.title,
    url,
    byArtist: BY_ARTIST,
    albumReleaseType: ALBUM_RELEASE_TYPE[release.type],
    ...(release.description ? { description: release.description } : {}),
    ...(release.artworkUrl ? { image: release.artworkUrl } : {}),
  };

  if (release.status === "upcoming") {
    return {
      ...album,
      albumProductionType: "StudioAlbum",
      ...(release.releaseDate ? { datePublished: release.releaseDate } : {}),
    };
  }

  // Released rows always carry a date; the guard keeps the type honest.
  const datePublished = release.releaseDate ?? "";
  const tracks = [...release.tracks]
    .sort((a, b) => a.position - b.position)
    .map((track) => recordingLd(release, track, url, datePublished));

  return {
    ...album,
    datePublished,
    numTracks: tracks.length,
    track: tracks,
  };
}
