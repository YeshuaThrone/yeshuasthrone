import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { site } from "@/content/site";
import { story } from "@/content/story";
import { buildMetadata, musicGroupJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Story",
  description: `Who Yeshua Throne is — ${site.location}, the music, and the rails it runs on.`,
  path: "/story",
});

/**
 * Hero slot: a real image once `site.storyHeroImage` is set, otherwise a
 * typographic lockup on ink so the page never shows a stock photo.
 */
function StoryHero() {
  const image = site.storyHeroImage;
  if (image) {
    return (
      // Hero art is supplied by hand; its host is unknown at build time, so a
      // plain <img> rather than next/image (same call as release artwork).
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image.src}
        alt={image.alt}
        loading="eager"
        decoding="async"
        className="aspect-[16/9] w-full rounded-2xl border border-text/8 object-cover"
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={`${site.name} — ${site.location}`}
      className="flex aspect-[16/9] w-full flex-col justify-between rounded-2xl border border-text/8 bg-ink p-8 sm:p-12"
    >
      <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
        {site.location}
      </span>
      <span className="text-[clamp(2.5rem,10vw,7rem)] font-semibold uppercase leading-none tracking-tight text-text">
        {site.wordmark}
      </span>
    </div>
  );
}

export default function StoryPage() {
  return (
    <article className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16">
      <JsonLd data={musicGroupJsonLd()} />
      <header className="flex flex-col gap-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">The story</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">{site.name}</h1>
        <StoryHero />
      </header>

      <div className="flex max-w-2xl flex-col gap-6 text-lg leading-relaxed text-muted">
        {story.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <aside
        aria-label="Drop alerts"
        className="flex max-w-2xl flex-col gap-6 border-t border-text/8 pt-10"
      >
        <div className="gold-rule max-w-xs" />
        <p className="text-3xl font-semibold tracking-tight text-gold sm:text-4xl">
          {site.tagline}
        </p>
        <p className="text-muted">
          Every record premieres here before it reaches streaming. Join the list and hear
          it the moment it lands.
        </p>
        <p>
          <Link
            href="/#alerts"
            // #0066FF behind 14px text is 4.4:1 — below AA. electric-2 on onyx clears it.
            className="inline-flex items-center rounded-full bg-electric-2 px-6 py-3 text-sm font-semibold text-onyx transition-colors hover:bg-text"
          >
            Get the drop alert
          </Link>
        </p>
      </aside>
    </article>
  );
}
