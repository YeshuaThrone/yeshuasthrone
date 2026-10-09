import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PreviewBanner } from "@/components/release/PreviewBanner";
import { ReleaseView } from "@/components/release/ReleaseView";
import { getReleaseBySlug } from "@/lib/db/queries";
import { isPreviewAuthorized, PREVIEW_PARAM } from "@/lib/preview";

/**
 * Preview target of the middleware rewrite (see src/middleware.ts). Always
 * dynamic: reads with the service role and ignores `published`. The secret is
 * checked again here so a direct hit on this path without it is a 404, not a
 * leak — the middleware is a convenience, not the only gate.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preview",
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PreviewReleasePage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  if (!isPreviewAuthorized(query[PREVIEW_PARAM], process.env.PREVIEW_SECRET)) notFound();

  const release = await getReleaseBySlug(slug, { preview: true });
  if (!release) notFound();

  return (
    <>
      <PreviewBanner />
      <ReleaseView release={release} />
    </>
  );
}
