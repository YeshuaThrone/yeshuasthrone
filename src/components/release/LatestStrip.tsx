import Link from "next/link";
import { PlayButton } from "@/components/player";
import type { Release } from "@/lib/db/types";
import { releaseQueue } from "@/lib/releases/player";
import { ReleaseCard } from "./ReleaseCard";

interface LatestStripProps {
  releases: Release[];
  heading?: string;
}

/**
 * Grid of release cards with the player's play control on each released
 * card's first track (the queue is the whole release). Upcoming releases get
 * no play affordance — ReleaseCard enforces that too.
 */
export function LatestStrip({ releases, heading = "Latest" }: LatestStripProps) {
  if (releases.length === 0) return null;

  return (
    <section aria-labelledby="latest-heading" className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12">
      <div className="flex items-baseline justify-between">
        <h2 id="latest-heading" className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
          {heading}
        </h2>
        <Link href="/music" className="text-sm text-electric-2 underline-offset-4 hover:underline">
          All music
        </Link>
      </div>
      <ReleaseGrid releases={releases} />
    </section>
  );
}

export function ReleaseGrid({ releases }: { releases: Release[] }) {
  return (
    <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3" data-testid="release-grid">
      {releases.map((release) => {
        const queue = releaseQueue(release);
        const first = queue[0];
        return (
          <li key={release.id} data-slug={release.slug} data-status={release.status}>
            <ReleaseCard
              release={release}
              playButton={
                release.status === "released" && first ? (
                  <PlayButton track={first} queue={queue} />
                ) : undefined
              }
            />
          </li>
        );
      })}
    </ul>
  );
}
