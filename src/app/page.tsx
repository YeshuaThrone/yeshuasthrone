import Link from "next/link";
import { subscribe } from "@/app/actions/subscribe";
import { DropAlertForm } from "@/components/alerts/DropAlertForm";
import { SocialLinks } from "@/components/layout/SocialLinks";
import { LatestStrip } from "@/components/release/LatestStrip";
import { ReleaseHero } from "@/components/release/ReleaseHero";
import { archive } from "@/content/archive";
import { site } from "@/content/site";
import { story } from "@/content/story";
import { getFeaturedRelease, getPublishedReleases } from "@/lib/db/queries";
import { dropAlertCaption, dropAlertSource } from "@/lib/releases/player";
import { storyTeaser } from "@/lib/teasers";

/** ISR: fans see a fresh home within a minute of a Supabase Studio edit. */
export const revalidate = 60;

const LATEST_LIMIT = 6;

function NoReleases() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-24" data-testid="no-releases">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-gold">{site.tagline}</p>
      <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight sm:text-7xl">
        {site.name}
      </h1>
      <div className="gold-rule max-w-md" />
      <p className="max-w-xl text-lg text-muted">
        First drop coming. Austin hears it first. Join the list to hear first.
      </p>
      <div id="alerts">
        <DropAlertForm caption="Get the alert when the first drop lands" source="home" onSubmit={subscribe} />
      </div>
    </section>
  );
}

function Teasers() {
  const origin = archive[0];
  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-2">
      <article className="glass-card flex flex-col gap-4 p-8">
        <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-muted">The story</h2>
        <p className="text-lg leading-relaxed text-text">{storyTeaser(story)}</p>
        <Link href="/story" className="text-sm text-electric-2 underline-offset-4 hover:underline">
          Read the story
        </Link>
      </article>
      <article className="glass-card flex flex-col gap-4 p-8">
        <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-muted">The origin</h2>
        <p className="text-lg leading-relaxed text-text">
          {origin
            ? `Before ${site.name} there was ${origin.alias}. ${origin.title} lives in the archive.`
            : "Where it started, kept on the record."}
        </p>
        <Link href="/archive" className="text-sm text-electric-2 underline-offset-4 hover:underline">
          Open the archive
        </Link>
      </article>
    </section>
  );
}

export default async function HomePage() {
  const [featured, releases] = await Promise.all([getFeaturedRelease(), getPublishedReleases()]);

  if (!featured) {
    return (
      <>
        <NoReleases />
        <Teasers />
        <Socials />
      </>
    );
  }

  const latest = releases
    .filter((release) => release.status === "released" && release.id !== featured.id)
    .slice(0, LATEST_LIMIT);

  return (
    <>
      <ReleaseHero release={featured}>
        <div id="alerts" className="flex flex-col gap-3">
          <DropAlertForm
            caption={dropAlertCaption(featured.title)}
            source={dropAlertSource(featured.slug)}
            onSubmit={subscribe}
          />
          {featured.status === "released" ? (
            <Link
              href={`/music/${featured.slug}`}
              className="text-sm text-electric-2 underline-offset-4 hover:underline"
            >
              Open {featured.title}
            </Link>
          ) : null}
        </div>
      </ReleaseHero>
      <LatestStrip releases={latest} />
      <Teasers />
      <Socials />
    </>
  );
}

function Socials() {
  return (
    <section aria-label="Follow" className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-12">
      <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-muted">Follow</h2>
      <SocialLinks />
    </section>
  );
}
