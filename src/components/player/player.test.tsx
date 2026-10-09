import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlayButton } from "./PlayButton";
import { PlayerBar } from "./PlayerBar";
import { PlayerProvider } from "./PlayerProvider";
import { formatTime } from "./formatTime";
import type { PlayerTrack } from "./playerReducer";

const A: PlayerTrack = {
  id: "a",
  title: "Alpha",
  releaseTitle: "First Release",
  releaseSlug: "first-release",
  artworkUrl: null,
  audioUrl: "/audio/a.wav",
  durationSeconds: 90,
};
const B: PlayerTrack = { ...A, id: "b", title: "Beta", audioUrl: "/audio/b.wav" };

// jsdom has no media pipeline: stub the element methods and drive events by hand.
beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (this: HTMLMediaElement) {
    Object.defineProperty(this, "paused", { value: false, configurable: true });
    return Promise.resolve();
  });
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(function (this: HTMLMediaElement) {
    Object.defineProperty(this, "paused", { value: true, configurable: true });
  });
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

function audioEl(): HTMLAudioElement {
  return screen.getByTestId("site-audio") as HTMLAudioElement;
}

function Harness() {
  return (
    <PlayerProvider>
      <PlayButton track={A} queue={[A, B]} />
      <PlayButton track={B} queue={[A, B]} />
      <PlayerBar />
    </PlayerProvider>
  );
}

describe("PlayerProvider + PlayButton + PlayerBar", () => {
  it("renders one audio element and no bar before the first play", () => {
    render(<Harness />);
    expect(document.querySelectorAll("audio")).toHaveLength(1);
    expect(screen.queryByRole("region", { name: "Now playing" })).toBeNull();
    expect(screen.getByRole("button", { name: "Play Alpha" })).toHaveAttribute(
      "data-status",
      "inactive",
    );
  });

  it("play loads the track into the single audio element and shows the bar", async () => {
    render(<Harness />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Play Alpha" }));
    });

    expect(audioEl().getAttribute("src")).toBe(A.audioUrl);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Pause Alpha" })).toHaveAttribute(
      "data-status",
      "loading",
    );

    const bar = screen.getByRole("region", { name: "Now playing" });
    expect(bar).toHaveTextContent("Alpha");
    expect(screen.getByRole("link", { name: "First Release" })).toHaveAttribute(
      "href",
      "/music/first-release",
    );

    await act(async () => {
      fireEvent(audioEl(), new Event("playing"));
    });
    expect(screen.getByRole("button", { name: "Pause Alpha" })).toHaveAttribute(
      "data-status",
      "playing",
    );
    // Beta is untouched by Alpha's state.
    expect(screen.getByRole("button", { name: "Play Beta" })).toHaveAttribute(
      "data-status",
      "inactive",
    );
  });

  it("playing a second track replaces the source; only one audio element exists", async () => {
    render(<Harness />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Play Alpha" }));
      fireEvent(audioEl(), new Event("playing"));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Play Beta" }));
    });

    expect(document.querySelectorAll("audio")).toHaveLength(1);
    expect(audioEl().getAttribute("src")).toBe(B.audioUrl);
    expect(screen.getByRole("button", { name: "Play Alpha" })).toHaveAttribute(
      "data-status",
      "inactive",
    );
    expect(screen.getByRole("button", { name: "Pause Beta" })).toBeInTheDocument();
  });

  it("clicking the active track's button pauses it", async () => {
    render(<Harness />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Play Alpha" }));
      fireEvent(audioEl(), new Event("playing"));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Pause Alpha" }));
    });
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Play Alpha" })).toHaveAttribute(
      "data-status",
      "paused",
    );
  });

  it("an audio error shows the message and Retry reloads the same track", async () => {
    render(<Harness />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Play Alpha" }));
    });
    await act(async () => {
      fireEvent(audioEl(), new Event("error"));
    });

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Couldn't load this track");
    expect(screen.getByRole("region", { name: "Now playing" })).toHaveAttribute(
      "data-status",
      "error",
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(HTMLMediaElement.prototype.load).toHaveBeenCalledTimes(2);
    expect(audioEl().getAttribute("src")).toBe(A.audioUrl);
  });

  it("the seek slider exposes mm:ss and seeking moves the element", async () => {
    render(<Harness />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Play Alpha" }));
      fireEvent(audioEl(), new Event("playing"));
    });

    const slider = screen.getByRole("slider", { name: "Seek" });
    expect(slider).toHaveAttribute("aria-valuetext", "0:00 of 1:30");

    await act(async () => {
      fireEvent.change(slider, { target: { value: "65" } });
    });
    expect(audioEl().currentTime).toBe(65);
    expect(slider).toHaveAttribute("aria-valuetext", "1:05 of 1:30");
  });

  it("next moves through the queue and is disabled at the end", async () => {
    render(<Harness />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Play Alpha" }));
    });
    const next = screen.getByRole("button", { name: "Next track" });
    expect(next).toBeEnabled();
    await act(async () => {
      fireEvent.click(next);
    });
    expect(audioEl().getAttribute("src")).toBe(B.audioUrl);
    expect(screen.getByRole("button", { name: "Next track" })).toBeDisabled();
  });
});

describe("formatTime", () => {
  it("formats seconds as m:ss and h:mm:ss", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(65.9)).toBe("1:05");
    expect(formatTime(3725)).toBe("1:02:05");
    expect(formatTime(Number.NaN)).toBe("0:00");
    expect(formatTime(-3)).toBe("0:00");
  });
});
