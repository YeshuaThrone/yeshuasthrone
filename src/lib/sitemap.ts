import type { MetadataRoute } from "next";
import type { Release } from "@/lib/db/types";
import { releasePath } from "@/lib/releases/seo";
import { absoluteUrl, type SeoEnvSource } from "@/lib/seo";

/**
 * Pure sitemap / robots builders. `app/sitemap.ts` and `app/robots.ts` are
 * thin wrappers so the "drafts never appear" rule is testable in Vitest
 * without rendering the route.
 */

/** Static routes with their crawl hints; release pages are added per published row. */
const STATIC_ROUTES: ReadonlyArray<{
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/music", changeFrequency: "weekly", priority: 0.9 },
  { path: "/story", changeFrequency: "monthly", priority: 0.6 },
  { path: "/archive", changeFrequency: "yearly", priority: 0.4 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.4 },
];

/** Paths crawlers must stay out of: dev galleries, preview renders, API routes. */
export const DISALLOWED_PATHS = ["/dev", "/dev/", "/preview/", "/api/"] as const;

type SitemapRelease = Pick<Release, "slug" | "releaseDate" | "status">;

/**
 * The callers pass only published rows (`getPublishedReleases()` filters on
 * `published = true`), so there is no draft check here to drift out of sync
 * with the query layer. `lastModified` is the release date when known;
 * upcoming rows with no date omit it rather than invent one.
 */
export function buildSitemap(
  releases: readonly SitemapRelease[],
  env: SeoEnvSource = process.env,
): MetadataRoute.Sitemap {
  const statics: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path, env),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const releaseEntries: MetadataRoute.Sitemap = releases.map((release) => ({
    url: absoluteUrl(releasePath(release.slug), env),
    ...(release.releaseDate ? { lastModified: release.releaseDate } : {}),
    changeFrequency: release.status === "upcoming" ? "weekly" : "monthly",
    priority: release.status === "upcoming" ? 0.9 : 0.8,
  }));

  return [...statics, ...releaseEntries];
}

export function buildRobots(env: SeoEnvSource = process.env): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: [...DISALLOWED_PATHS] }],
    sitemap: absoluteUrl("/sitemap.xml", env),
  };
}
