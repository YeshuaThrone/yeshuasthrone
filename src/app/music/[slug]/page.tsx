import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReleaseView } from "@/components/release/ReleaseView";
import { JsonLd } from "@/components/seo/JsonLd";
import { getPublishedReleases, getReleaseBySlug } from "@/lib/db/queries";
import { releaseJsonLd, releaseMetadata } from "@/lib/releases/seo";

/**
 * Release page. Static per slug with ISR; slugs not known at build time are
 * rendered on first request (`dynamicParams`). Unpublished and unknown slugs
 * are indistinguishable: both `notFound()`. Preview mode never reaches this
 * page — middleware rewrites `?preview=<secret>` to `/preview/music/[slug]`
 * so this one never reads search params and stays fully static.
 */
export const revalidate = 60;
export const dynamicParams = true;

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const releases = await getPublishedReleases();
  return releases.map((release) => ({ slug: release.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const release = await getReleaseBySlug(slug);
  if (!release) return { title: "Not found" };
  return releaseMetadata(release);
}

export default async function ReleasePage({ params }: Params) {
  const { slug } = await params;
  const release = await getReleaseBySlug(slug);
  if (!release) notFound();
  return (
    <>
      <JsonLd data={releaseJsonLd(release)} />
      <ReleaseView release={release} />
    </>
  );
}
