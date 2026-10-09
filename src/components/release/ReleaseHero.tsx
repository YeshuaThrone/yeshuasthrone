import type { ReactNode } from "react";
import type { Release } from "@/components/types";
import { site } from "@/content/site";
import { formatReleaseDate, releaseTypeLabel } from "@/lib/format";
import { Artwork } from "./Artwork";
import { CovnantBadge } from "./CovnantBadge";
import { DspLinks, PreSaveRow } from "./PreSaveRow";

type HeroRelease = Pick<
  Release,
  | "title"
  | "type"
  | "description"
  | "releaseDate"
  | "artworkUrl"
  | "covnantCbtCode"
  | "covnantUrl"
  | "dspLinks"
  | "status"
>;

interface ReleaseHeroProps {
  release: HeroRelease;
  /**
   * Upcoming: the drop-alert form ("Get the alert when … drops").
   * Released: the tracklist (with the player's play controls).
   */
  children?: ReactNode;
}

export const IN_STUDIO_LINE = "In the studio now";

/** "Coming March 14, 2027" when a date is set, otherwise the studio line. */
export function upcomingStatusLine(releaseDate: string | null): string {
  return releaseDate ? `Coming ${formatReleaseDate(releaseDate)}` : IN_STUDIO_LINE;
}

/**
 * The home flagship and the top of every release page.
 * One layout for both states; what changes is the status line and the slot.
 */
export function ReleaseHero({ release, children }: ReleaseHeroProps) {
  const upcoming = release.status === "upcoming";

  return (
    <section
      aria-label={`${release.title} — ${upcoming ? "upcoming release" : "release"}`}
      className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-center md:py-24"
    >
      <div className="overflow-hidden rounded-3xl border border-text/8 shadow-[0_40px_120px_-40px_rgba(0,102,255,0.35)]">
        <Artwork title={release.title} artworkUrl={release.artworkUrl} priority />
      </div>

      <div className="flex flex-col gap-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-gold">{site.tagline}</p>

        <div className="flex flex-col gap-3">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            {releaseTypeLabel(release.type)} · {site.name}
          </p>
          <h1
            className="text-5xl font-semibold uppercase leading-[0.95] tracking-tight sm:text-7xl"
          >
            {release.title}
          </h1>
          <p className="text-lg text-muted">
            {upcoming
              ? upcomingStatusLine(release.releaseDate)
              : release.releaseDate
                ? `Released ${formatReleaseDate(release.releaseDate)}`
                : null}
          </p>
        </div>

        <div className="gold-rule max-w-xs" />

        {release.description ? (
          <p className="max-w-xl text-base leading-relaxed text-muted">{release.description}</p>
        ) : null}

        {upcoming ? (
          <PreSaveRow dspLinks={release.dspLinks} mode="pre-save" />
        ) : (
          <DspLinks dspLinks={release.dspLinks} />
        )}

        <CovnantBadge covnantCbtCode={release.covnantCbtCode} covnantUrl={release.covnantUrl} />

        {children ? <div className="mt-2">{children}</div> : null}
      </div>
    </section>
  );
}
