import { site } from "@/content/site";
import type { Release } from "@/lib/db/types";
import { releaseTypeLabel } from "@/lib/format";

/** Meta description: the release's own copy, else a generated line. */
export function releaseDescription(
  release: Pick<Release, "title" | "type" | "description">,
): string {
  return (
    release.description ??
    `${release.title} — ${releaseTypeLabel(release.type)} by ${site.name}. ${site.tagline}`
  );
}
