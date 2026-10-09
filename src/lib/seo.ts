import type { Metadata } from "next";
import { site, socials } from "@/content/site";

/**
 * Site-wide SEO primitives: the canonical origin, OG image paths, and the
 * one metadata builder every route uses so title template, canonical,
 * Open Graph and Twitter cards are never assembled by hand twice.
 *
 * Pure: no Next runtime, no database. Pages pass data in.
 */

export const DEFAULT_OG_SLUG = "default";
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/** process.env or any string map; tests pass plain objects. */
export type SeoEnvSource = Record<string, string | undefined>;

/**
 * The public origin, no trailing slash. Explicit `NEXT_PUBLIC_SITE_URL` wins
 * (the real domain once one exists); Vercel's own hostname (`VERCEL_URL`,
 * no scheme) is the preview/production fallback; localhost for dev and the
 * no-env build.
 */
export function siteUrl(env: SeoEnvSource = process.env): string {
  const explicit = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return withScheme(explicit);
  const vercel = env.VERCEL_URL?.trim();
  if (vercel) return withScheme(vercel);
  return "http://localhost:3000";
}

function withScheme(host: string): string {
  const trimmed = host.replace(/\/+$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** `/music/champion` → `https://host/music/champion`. */
export function absoluteUrl(path: string, env: SeoEnvSource = process.env): string {
  return new URL(path, `${siteUrl(env)}/`).toString();
}

/** Where a page's share image lives: one per release, plus the site default. */
export function ogImagePath(slug: string = DEFAULT_OG_SLUG): string {
  return `/api/og/${encodeURIComponent(slug)}`;
}

export interface PageMeta {
  /** Page title; the layout template appends " · Yeshua Throne". */
  title: string;
  /** Use the title verbatim with no template — the home page only. */
  absoluteTitle?: boolean;
  description: string;
  /** Route path, e.g. "/music". Canonical and og:url derive from it. */
  path: string;
  /** Slug of the OG image route to use; the site default when omitted. */
  ogSlug?: string;
  /** Open Graph object type. Releases pass a music type; everything else is a website. */
  ogType?: "website" | "music.album" | "music.song";
}

/**
 * Metadata for one route. Paths stay relative: the root layout sets
 * `metadataBase`, so Next resolves canonical, og:url and image URLs against
 * the real origin at render time. Open Graph is not deep-merged by Next, so
 * every field a card needs is spelled out here rather than inherited.
 */
export function buildMetadata(meta: PageMeta): Metadata {
  const image = {
    url: ogImagePath(meta.ogSlug),
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    alt: `${meta.title} — ${site.name}`,
  };
  const ogTitle = meta.absoluteTitle ? meta.title : `${meta.title} · ${site.name}`;

  return {
    title: meta.absoluteTitle ? { absolute: meta.title } : meta.title,
    description: meta.description,
    alternates: { canonical: meta.path },
    openGraph: {
      type: meta.ogType ?? "website",
      siteName: site.name,
      locale: "en_US",
      url: meta.path,
      title: ogTitle,
      description: meta.description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: meta.description,
      images: [image.url],
    },
  };
}

/** The artist entity: schema.org MusicGroup, rendered on /story. */
export function musicGroupJsonLd(env: SeoEnvSource = process.env) {
  return {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: site.name,
    url: siteUrl(env),
    description: site.description,
    foundingLocation: { "@type": "Place", name: site.location },
    sameAs: socials.map((social) => social.href),
  } as const;
}

/**
 * JSON for a `<script type="application/ld+json">` body. `<` is escaped so a
 * description containing `</script>` can never break out of the tag.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
