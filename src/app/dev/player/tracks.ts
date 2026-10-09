import type { PlayerTrack } from "@/components/player";

/**
 * Fixture tracks for the /dev/player harness. Both playable tracks point at the
 * same WAV with different ids so "second play replaces the first" is observable;
 * the third points at a 404 to exercise the error state.
 */
export const devTracks: readonly PlayerTrack[] = [
  {
    id: "dev-1",
    title: "Tone One",
    releaseTitle: "Dev Fixtures",
    releaseSlug: "dev-fixtures",
    artworkUrl: null,
    audioUrl: "/test-audio/tone.wav?track=1",
    durationSeconds: 3,
  },
  {
    id: "dev-2",
    title: "Tone Two",
    releaseTitle: "Dev Fixtures",
    releaseSlug: "dev-fixtures",
    artworkUrl: null,
    audioUrl: "/test-audio/tone.wav?track=2",
    durationSeconds: 3,
  },
  {
    id: "dev-404",
    title: "Missing Track",
    releaseTitle: "Dev Fixtures",
    releaseSlug: "dev-fixtures",
    artworkUrl: null,
    audioUrl: "/test-audio/does-not-exist.wav",
    durationSeconds: null,
  },
];
