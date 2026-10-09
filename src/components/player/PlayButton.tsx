"use client";

import { usePlayer, useTrackStatus } from "./PlayerProvider";
import { PauseIcon, PlayIcon, SpinnerIcon } from "./icons";
import type { PlayerTrack } from "./playerReducer";

export interface PlayButtonProps {
  track: PlayerTrack;
  /** Queue to adopt when this track starts (must contain `track`). */
  queue?: PlayerTrack[];
  className?: string;
  /** Icon size in px. */
  size?: number;
}

/** Play / pause control that reflects the state of its own track only. */
export function PlayButton({ track, queue, className, size = 20 }: PlayButtonProps) {
  const { play, toggle } = usePlayer();
  const status = useTrackStatus(track.id);
  const isActive = status === "playing" || status === "loading";

  const onClick = () => {
    if (isActive) toggle();
    else play(track, queue);
  };

  const label = isActive ? `Pause ${track.title}` : `Play ${track.title}`;
  const icon =
    status === "loading" ? (
      <SpinnerIcon width={size} height={size} />
    ) : status === "playing" ? (
      <PauseIcon width={size} height={size} />
    ) : (
      <PlayIcon width={size} height={size} />
    );

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={isActive}
      data-track-id={track.id}
      data-status={status ?? "inactive"}
      className={[
        "inline-flex items-center justify-center rounded-full border transition-colors",
        isActive
          ? "border-electric-2 bg-electric text-text"
          : "border-text/15 bg-ink text-text hover:border-electric-2 hover:text-electric-2",
        className ?? "size-11",
      ].join(" ")}
    >
      {icon}
    </button>
  );
}
