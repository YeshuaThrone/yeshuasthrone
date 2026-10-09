import { upcomingStatusLine } from "@/components/release/ReleaseHero";
import { site } from "@/content/site";
import type { Release } from "@/lib/db/types";
import { formatReleaseDate, releaseTypeLabel } from "@/lib/format";

/**
 * What one share image says. Pure: the route turns this into pixels, the
 * unit tests check the words. Keeping copy out of the JSX means the card
 * reads the same as the hero it mirrors (type · date line, studio line).
 */
export interface OgCard {
  /** Small mono line above the title. */
  eyebrow: string;
  title: string;
  /** "Album · Coming March 14, 2027", "Single · June 12, 2026", "In the studio now". */
  line: string;
  /** Remote artwork for the left panel; null renders the typographic lockup. */
  artworkUrl: string | null;
}

export function releaseOgCard(release: Release): OgCard {
  const type = releaseTypeLabel(release.type);
  const line =
    release.status === "released" && release.releaseDate
      ? `${type} · ${formatReleaseDate(release.releaseDate)}`
      : release.releaseDate
        ? `${type} · ${upcomingStatusLine(release.releaseDate)}`
        : upcomingStatusLine(null);
  return {
    eyebrow: site.name,
    title: release.title,
    line,
    artworkUrl: release.artworkUrl,
  };
}

/** The site-wide card used by every non-release page. */
export function defaultOgCard(): OgCard {
  return {
    eyebrow: site.location,
    title: site.name,
    line: "Every record premieres here before it reaches streaming.",
    artworkUrl: null,
  };
}

/**
 * Title size that keeps long titles inside the right-hand column at
 * 1200x630. Tuned by eye against CHAMPION (8), Throne Room (11) and a
 * 24-character worst case.
 */
export function titleFontSize(title: string): number {
  const length = title.length;
  if (length <= 10) return 96;
  if (length <= 16) return 80;
  if (length <= 24) return 60;
  return 44;
}
