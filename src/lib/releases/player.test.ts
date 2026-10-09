import { describe, expect, it } from "vitest";
import { champion, releasedSingle, tracks } from "@/test/fixtures";
import { dropAlertCaption, dropAlertSource, releaseQueue, toPlayerTrack } from "./player";

describe("toPlayerTrack", () => {
  it("carries release title, slug and artwork onto the track", () => {
    expect(toPlayerTrack(releasedSingle, tracks[0])).toEqual({
      id: "t1",
      title: "Throne Room",
      releaseTitle: "Throne Room",
      releaseSlug: "throne-room",
      artworkUrl: "https://example.test/artwork/throne-room.jpg",
      audioUrl: "https://example.test/audio/01.mp3",
      durationSeconds: 245,
    });
  });

  it("is null when the track has no audio url", () => {
    expect(toPlayerTrack(releasedSingle, { ...tracks[0], audioUrl: null })).toBeNull();
  });
});

describe("releaseQueue", () => {
  it("orders by position and drops unplayable tracks", () => {
    const release = {
      ...releasedSingle,
      tracks: [tracks[1], { ...tracks[0], audioUrl: null }],
    };
    expect(releaseQueue(release).map((t) => t.id)).toEqual(["t2"]);
    expect(releaseQueue({ ...releasedSingle, tracks: [tracks[1], tracks[0]] }).map((t) => t.id)).toEqual([
      "t1",
      "t2",
    ]);
    expect(releaseQueue(champion)).toEqual([]);
  });
});

describe("drop-alert wiring", () => {
  it("captions and sources from the release", () => {
    expect(dropAlertCaption("CHAMPION")).toBe("Get the alert when CHAMPION drops");
    expect(dropAlertSource("champion")).toBe("release:champion");
  });
});
