import type { PlayerTrack } from "@/components/player";
import type { Release, Track } from "@/lib/db/types";

/**
 * Bridges the data model and the player: a `Track` knows nothing about its
 * release, but the player bar shows the release title and artwork. Tracks
 * with no resolvable audio URL are not playable and are left out.
 */

export function toPlayerTrack(release: Release, track: Track): PlayerTrack | null {
  if (!track.audioUrl) return null;
  return {
    id: track.id,
    title: track.title,
    releaseTitle: release.title,
    releaseSlug: release.slug,
    artworkUrl: release.artworkUrl,
    audioUrl: track.audioUrl,
    durationSeconds: track.durationSeconds,
  };
}

/** The whole release as a play queue, in position order, playable tracks only. */
export function releaseQueue(release: Release): PlayerTrack[] {
  return [...release.tracks]
    .sort((a, b) => a.position - b.position)
    .flatMap((track) => {
      const playable = toPlayerTrack(release, track);
      return playable ? [playable] : [];
    });
}

/** Drop-alert caption for a release ("Get the alert when CHAMPION drops"). */
export function dropAlertCaption(title: string): string {
  return `Get the alert when ${title} drops`;
}

export function dropAlertSource(slug: string): string {
  return `release:${slug}`;
}
