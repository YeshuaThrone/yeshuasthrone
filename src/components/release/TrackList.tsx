import type { ReactNode } from "react";
import type { Track } from "@/components/types";
import { formatDuration } from "@/lib/format";

interface TrackListProps {
  tracks: Track[];
  /** The player PR supplies this; without it rows render with no play control. */
  renderPlay?: (track: Track) => ReactNode;
}

export function TrackList({ tracks, renderPlay }: TrackListProps) {
  if (tracks.length === 0) return null;

  const ordered = [...tracks].sort((a, b) => a.position - b.position);

  return (
    <ol className="divide-y divide-text/8 border-y border-text/8" aria-label="Tracklist">
      {ordered.map((track) => (
        <li key={track.id} className="flex items-center gap-4 py-3">
          <span className="w-6 shrink-0 text-right font-mono text-xs text-muted">
            {track.position}
          </span>
          {renderPlay ? <span className="shrink-0">{renderPlay(track)}</span> : null}
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-medium">{track.title}</span>
            {track.credits ? (
              <span className="truncate text-xs text-muted">{track.credits}</span>
            ) : null}
          </span>
          <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
            {formatDuration(track.durationSeconds)}
          </span>
        </li>
      ))}
    </ol>
  );
}
