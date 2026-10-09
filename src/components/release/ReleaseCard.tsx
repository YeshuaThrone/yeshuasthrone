import Link from "next/link";
import type { ReactNode } from "react";
import type { Release } from "@/components/types";
import { formatReleaseDate, releaseTypeLabel } from "@/lib/format";
import { Artwork } from "./Artwork";

interface ReleaseCardProps {
  release: Pick<
    Release,
    "slug" | "title" | "type" | "releaseDate" | "artworkUrl" | "status"
  >;
  /**
   * The player's PlayButton for this release's first track. Rendered only when
   * the release is out — an upcoming release has nothing to play.
   */
  playButton?: ReactNode;
}

export function ReleaseCard({ release, playButton }: ReleaseCardProps) {
  const showPlay = release.status === "released" && playButton !== undefined;

  return (
    <article className="group relative flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-2xl border border-text/8">
        <Artwork
          title={release.title}
          artworkUrl={release.artworkUrl}
          className="transition-transform duration-500 group-hover:scale-[1.02]"
        />
        {showPlay ? (
          // z-10 keeps the button above the title's stretched-link overlay.
          <div className="absolute right-3 bottom-3 z-10">{playButton}</div>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold leading-tight tracking-tight">
          <Link
            href={`/music/${release.slug}`}
            className="after:absolute after:inset-0 after:rounded-2xl hover:text-electric-2"
          >
            {release.title}
          </Link>
        </h3>
        <p className="flex items-center gap-2 font-mono text-xs text-muted">
          <span className="rounded-full border border-text/12 px-2 py-0.5 uppercase tracking-[0.2em]">
            {releaseTypeLabel(release.type)}
          </span>
          <span>
            {release.releaseDate ? formatReleaseDate(release.releaseDate) : "Coming soon"}
          </span>
        </p>
      </div>
    </article>
  );
}
