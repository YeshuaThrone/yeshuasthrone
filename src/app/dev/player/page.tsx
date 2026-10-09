import type { Metadata } from "next";
import Link from "next/link";
import { PlayButton } from "@/components/player";
import { devTracks } from "./tracks";

export const metadata: Metadata = {
  title: "Player harness",
  robots: { index: false, follow: false },
};

/**
 * Dev-only harness for the persistent player: two playable fixtures, one
 * broken one, and a link to a second page so navigation can be exercised
 * while audio is playing. Not linked from site chrome.
 */
export default function DevPlayerPage() {
  const playable = devTracks.filter((t) => t.durationSeconds !== null);

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">dev</p>
      <h1 className="text-3xl font-semibold tracking-tight">Player harness</h1>

      <ul className="flex flex-col gap-3">
        {devTracks.map((track) => (
          <li key={track.id} className="glass-card flex items-center gap-4 p-4">
            <PlayButton track={track} queue={playable.includes(track) ? playable : undefined} />
            <div>
              <p className="font-medium">{track.title}</p>
              <p className="font-mono text-xs text-muted">{track.audioUrl}</p>
            </div>
          </li>
        ))}
      </ul>

      <p>
        <Link
          href="/dev/player/other"
          className="text-electric-2 underline underline-offset-4 hover:text-text"
        >
          Go to the other page
        </Link>
      </p>
    </section>
  );
}
