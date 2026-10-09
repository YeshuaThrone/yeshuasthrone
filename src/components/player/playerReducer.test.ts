import { describe, expect, it } from "vitest";
import {
  LOAD_ERROR_MESSAGE,
  currentTrack,
  initialPlayerState,
  playerReducer,
  type PlayerAction,
  type PlayerState,
  type PlayerTrack,
} from "./playerReducer";

function track(id: string): PlayerTrack {
  return {
    id,
    title: `Track ${id}`,
    releaseTitle: "Release",
    releaseSlug: "release",
    artworkUrl: null,
    audioUrl: `/audio/${id}.wav`,
    durationSeconds: 180,
  };
}

const A = track("a");
const B = track("b");
const C = track("c");

function run(actions: PlayerAction[], from: PlayerState = initialPlayerState): PlayerState {
  return actions.reduce(playerReducer, from);
}

describe("playerReducer", () => {
  it("play(track) starts loading that track as a one-item queue", () => {
    const s = run([{ type: "play", track: A }]);
    expect(currentTrack(s)).toEqual(A);
    expect(s.queue).toEqual([A]);
    expect(s.status).toBe("loading");
    expect(s.loadNonce).toBe(1);
    expect(s.duration).toBe(180);
  });

  it("play(B) while A is playing makes B current and reloads", () => {
    const playingA = run([{ type: "play", track: A }, { type: "media/playing" }]);
    expect(playingA.status).toBe("playing");

    const s = playerReducer(playingA, { type: "play", track: B });
    expect(currentTrack(s)).toEqual(B);
    expect(["loading", "playing"]).toContain(s.status);
    expect(s.loadNonce).toBe(playingA.loadNonce + 1);
    expect(s.currentTime).toBe(0);
  });

  it("play(track, queue) adopts the queue and positions on the track", () => {
    const s = run([{ type: "play", track: B, queue: [A, B, C] }]);
    expect(s.queue).toEqual([A, B, C]);
    expect(s.currentIndex).toBe(1);
  });

  it("play on the already-current track resumes when paused and is a no-op while playing", () => {
    const playing = run([{ type: "play", track: A }, { type: "media/playing" }]);
    expect(playerReducer(playing, { type: "play", track: A })).toBe(playing);

    const paused = playerReducer(playing, { type: "toggle" });
    const resumed = playerReducer(paused, { type: "play", track: A });
    expect(resumed.status).toBe("loading");
    expect(resumed.loadNonce).toBe(paused.loadNonce);
  });

  it("media/error sets the message and keeps the queue and position", () => {
    const s = run([{ type: "play", track: B, queue: [A, B, C] }, { type: "media/error" }]);
    expect(s.status).toBe("error");
    expect(s.error).toBe(LOAD_ERROR_MESSAGE);
    expect(s.queue).toEqual([A, B, C]);
    expect(s.currentIndex).toBe(1);
  });

  it("retry after an error reloads the same track", () => {
    const errored = run([{ type: "play", track: A }, { type: "media/error" }]);
    const s = playerReducer(errored, { type: "retry" });
    expect(s.status).toBe("loading");
    expect(s.error).toBeNull();
    expect(currentTrack(s)).toEqual(A);
    expect(s.loadNonce).toBe(errored.loadNonce + 1);
  });

  it("retry is a no-op unless in error", () => {
    const playing = run([{ type: "play", track: A }, { type: "media/playing" }]);
    expect(playerReducer(playing, { type: "retry" })).toBe(playing);
  });

  it("toggle flips playing -> paused -> loading(resume)", () => {
    const playing = run([{ type: "play", track: A }, { type: "media/playing" }]);
    const paused = playerReducer(playing, { type: "toggle" });
    expect(paused.status).toBe("paused");
    const resumed = playerReducer(paused, { type: "toggle" });
    expect(resumed.status).toBe("loading");
    expect(playerReducer(resumed, { type: "media/playing" }).status).toBe("playing");
  });

  it("toggle is a no-op while idle or in error", () => {
    expect(playerReducer(initialPlayerState, { type: "toggle" })).toBe(initialPlayerState);
    const errored = run([{ type: "play", track: A }, { type: "media/error" }]);
    expect(playerReducer(errored, { type: "toggle" })).toBe(errored);
  });

  it("next advances through the queue and stays put at the end", () => {
    const atB = run([{ type: "play", track: B, queue: [A, B, C] }]);
    const atC = playerReducer(atB, { type: "next" });
    expect(currentTrack(atC)).toEqual(C);
    expect(atC.status).toBe("loading");

    const stillC = playerReducer(atC, { type: "next" });
    expect(stillC).toBe(atC);
  });

  it("prev goes back through the queue and rewinds on the first track", () => {
    const atB = run([
      { type: "play", track: B, queue: [A, B, C] },
      { type: "media/time", currentTime: 42, duration: 180 },
    ]);
    const atA = playerReducer(atB, { type: "prev" });
    expect(currentTrack(atA)).toEqual(A);

    const rewound = playerReducer(
      { ...atA, currentTime: 30 },
      { type: "prev" },
    );
    expect(currentTrack(rewound)).toEqual(A);
    expect(rewound.currentTime).toBe(0);
  });

  it("media/ended advances, or pauses at the end of the queue", () => {
    const atB = run([{ type: "play", track: B, queue: [A, B] }, { type: "media/playing" }]);
    const ended = playerReducer(atB, { type: "media/ended" });
    expect(ended.status).toBe("paused");
    expect(currentTrack(ended)).toEqual(B);

    const atA = run([{ type: "play", track: A, queue: [A, B] }, { type: "media/playing" }]);
    expect(currentTrack(playerReducer(atA, { type: "media/ended" }))).toEqual(B);
  });

  it("seek clamps to [0, duration]", () => {
    const s = run([{ type: "play", track: A }]);
    expect(playerReducer(s, { type: "seek", seconds: -5 }).currentTime).toBe(0);
    expect(playerReducer(s, { type: "seek", seconds: 999 }).currentTime).toBe(180);
    expect(playerReducer(s, { type: "seek", seconds: 60 }).currentTime).toBe(60);
  });

  it("media/time keeps the last finite duration", () => {
    const s = run([
      { type: "play", track: A },
      { type: "media/time", currentTime: 1, duration: 200 },
      { type: "media/time", currentTime: 2, duration: Number.NaN },
    ]);
    expect(s.currentTime).toBe(2);
    expect(s.duration).toBe(200);
  });

  it("media/paused only pauses a genuinely playing track (not a source swap)", () => {
    const loading = run([{ type: "play", track: A }]);
    expect(playerReducer(loading, { type: "media/paused" }).status).toBe("loading");
    const playing = playerReducer(loading, { type: "media/playing" });
    expect(playerReducer(playing, { type: "media/paused" }).status).toBe("paused");
  });

  it("media events are ignored while idle", () => {
    for (const action of [
      { type: "media/playing" },
      { type: "media/error" },
      { type: "media/ended" },
      { type: "media/time", currentTime: 1, duration: 1 },
    ] satisfies PlayerAction[]) {
      expect(playerReducer(initialPlayerState, action)).toBe(initialPlayerState);
    }
  });
});
