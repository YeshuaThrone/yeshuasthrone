"use client";

import Image from "next/image";
import Link from "next/link";
import { usePlayer } from "./PlayerProvider";
import { formatTime } from "./formatTime";
import { NextIcon, PauseIcon, PlayIcon, PrevIcon, SpinnerIcon } from "./icons";

/** Height reserved in the page flow so content never hides behind the bar. */
const BAR_HEIGHT_CLASS = "h-20";

/**
 * Persistent bottom player. Renders nothing until the first play; after that it
 * stays mounted (the provider keeps playing across route changes).
 */
export function PlayerBar() {
  const { state, currentTrack, toggle, seek, next, prev, retry } = usePlayer();

  if (state.status === "idle" || !currentTrack) return null;

  const { status, currentTime, duration, error, queue, currentIndex } = state;
  const isPlaying = status === "playing" || status === "loading";
  const hasPrev = currentIndex > 0 || currentTime > 0;
  const hasNext = currentIndex < queue.length - 1;
  const max = duration > 0 ? duration : 0;

  return (
    <>
      {/* In-flow spacer: pushes the footer above the fixed bar. */}
      <div aria-hidden className={`${BAR_HEIGHT_CLASS} shrink-0`} />
      <div
        role="region"
        aria-label="Now playing"
        data-testid="player-bar"
        data-status={status}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-text/10 bg-ink/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
      >
        <div className={`mx-auto flex ${BAR_HEIGHT_CLASS} max-w-6xl items-center gap-4 px-4 sm:px-6`}>
          <Artwork src={currentTrack.artworkUrl} alt={`${currentTrack.releaseTitle} artwork`} />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text">{currentTrack.title}</p>
            <Link
              href={`/music/${currentTrack.releaseSlug}`}
              className="block truncate text-xs text-muted hover:text-electric-2"
            >
              {currentTrack.releaseTitle}
            </Link>
          </div>

          {status === "error" ? (
            <div role="alert" className="flex items-center gap-3 text-sm">
              <span className="text-gold">{error}</span>
              <button
                type="button"
                onClick={retry}
                className="rounded-full border border-text/15 px-3 py-1 text-xs text-text hover:border-electric-2 hover:text-electric-2"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="hidden flex-1 items-center gap-3 font-mono text-xs text-muted sm:flex">
              <span className="tabular-nums" data-testid="player-time">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                aria-label="Seek"
                min={0}
                max={max}
                step={0.1}
                value={Math.min(currentTime, max)}
                aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
                disabled={max === 0}
                onChange={(e) => seek(Number(e.currentTarget.value))}
                className="h-1 w-full cursor-pointer accent-electric-2 disabled:cursor-default"
              />
              <span className="tabular-nums">{formatTime(duration)}</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <ControlButton label="Previous track" onClick={prev} disabled={!hasPrev}>
              <PrevIcon />
            </ControlButton>
            <ControlButton
              label={isPlaying ? "Pause" : "Play"}
              onClick={toggle}
              disabled={status === "error"}
              primary
            >
              {status === "loading" ? (
                <SpinnerIcon width={22} height={22} />
              ) : isPlaying ? (
                <PauseIcon width={22} height={22} />
              ) : (
                <PlayIcon width={22} height={22} />
              )}
            </ControlButton>
            <ControlButton label="Next track" onClick={next} disabled={!hasNext}>
              <NextIcon />
            </ControlButton>
          </div>
        </div>
      </div>
    </>
  );
}

function Artwork({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <div
        aria-hidden
        className="size-12 shrink-0 rounded-md bg-onyx font-mono text-[10px] leading-[3rem] text-center tracking-widest text-gold"
      >
        YT
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={48}
      height={48}
      unoptimized
      className="size-12 shrink-0 rounded-md object-cover"
    />
  );
}

function ControlButton({
  label,
  onClick,
  disabled,
  primary,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center rounded-full transition-colors disabled:opacity-30",
        primary
          ? "size-11 bg-electric text-text hover:bg-electric-2"
          : "size-9 text-muted hover:text-text",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
