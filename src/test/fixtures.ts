import type { Release, Track } from "@/components/types";

/** The launch-day seed: CHAMPION with no date, no art, no links, no tracks. */
export const champion: Release = {
  id: "00000000-0000-0000-0000-000000000001",
  slug: "champion",
  title: "CHAMPION",
  type: "album",
  description: null,
  releaseDate: null,
  artworkUrl: null,
  covnantCbtCode: null,
  covnantUrl: null,
  dspLinks: {},
  status: "upcoming",
  tracks: [],
};

export const tracks: Track[] = [
  {
    id: "t1",
    position: 1,
    title: "Throne Room",
    durationSeconds: 245,
    audioUrl: "https://example.test/audio/01.mp3",
    isrc: null,
    credits: "Prod. Yeshua Throne",
  },
  {
    id: "t2",
    position: 2,
    title: "Austin Nights",
    durationSeconds: null,
    audioUrl: "https://example.test/audio/02.mp3",
    isrc: null,
    credits: null,
  },
];

export const releasedSingle: Release = {
  id: "00000000-0000-0000-0000-000000000002",
  slug: "throne-room",
  title: "Throne Room",
  type: "single",
  description: "The first one out the door.",
  releaseDate: "2026-06-12",
  artworkUrl: "https://example.test/artwork/throne-room.jpg",
  covnantCbtCode: "CBT-7F3A9",
  covnantUrl: "https://covnant-eta.vercel.app/assets/7f3a9",
  dspLinks: { spotify: "https://open.spotify.com/track/x" },
  status: "released",
  tracks: [tracks[0]],
};
