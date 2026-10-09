import type { MetadataRoute } from "next";
import { getPublishedReleases } from "@/lib/db/queries";
import { buildSitemap } from "@/lib/sitemap";

/** Re-generated on the same ISR window as the pages it lists. */
export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Published rows only; drafts never reach this list (see src/lib/sitemap.ts).
  return buildSitemap(await getPublishedReleases());
}
