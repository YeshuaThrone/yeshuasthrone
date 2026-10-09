import { site } from "@/content/site";

/**
 * Placeholder home: the no-releases state from the spec.
 * The real home (CHAMPION flagship, drop-alert form, release strip) ships in a later PR.
 */
export default function HomePage() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-24">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-gold">
        {site.tagline}
      </p>
      <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight sm:text-7xl">
        {site.name}
      </h1>
      <div className="gold-rule max-w-md" />
      <p className="max-w-xl text-lg text-muted">
        Nothing public yet. First drop coming — Austin hears it first. Join the
        list to hear first.
      </p>
    </section>
  );
}
