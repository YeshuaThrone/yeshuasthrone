import type { Metadata } from "next";
import Link from "next/link";
import { ReleaseGrid } from "@/components/release/LatestStrip";
import { site } from "@/content/site";
import { getPublishedReleases } from "@/lib/db/queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Music",
  description: `Every ${site.name} release, newest first. ${site.tagline}`,
};

/**
 * All published releases. `getPublishedReleases()` already orders newest
 * first with undated (upcoming) rows at the top, which is the order fans
 * want: what is coming, then what is out.
 */
export default async function MusicPage() {
  const releases = await getPublishedReleases();

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-gold">{site.tagline}</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">Music</h1>
      </header>

      {releases.length === 0 ? (
        <div className="flex max-w-xl flex-col gap-4" data-testid="no-releases">
          <p className="text-lg text-muted">
            First drop coming. Austin hears it first. Join the list to hear first.
          </p>
          <Link href="/#alerts" className="text-electric-2 underline-offset-4 hover:underline">
            Get the drop alert
          </Link>
        </div>
      ) : (
        <ReleaseGrid releases={releases} />
      )}
    </section>
  );
}
