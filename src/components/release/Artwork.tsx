import { site } from "@/content/site";

interface ArtworkProps {
  title: string;
  artworkUrl: string | null;
  /** Eager-load above-the-fold artwork (the hero). Cards stay lazy. */
  priority?: boolean;
  className?: string;
}

/**
 * Square cover-art slot. Until art exists it renders a typographic lockup on
 * ink so an unfinished release never shows a broken image or a stock photo.
 */
export function Artwork({ title, artworkUrl, priority = false, className = "" }: ArtworkProps) {
  if (artworkUrl) {
    return (
      // Artwork is uploaded to Supabase Storage by hand; the host is not known at
      // build time, so this is a plain <img> rather than next/image.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={artworkUrl}
        alt={`${title} cover art`}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={`aspect-square w-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={`${title} — cover art coming soon`}
      className={`@container flex aspect-square w-full flex-col justify-between bg-ink p-[8%] ${className}`}
    >
      <span className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-muted">
        {site.wordmark}
      </span>
      <span className="text-[clamp(1.25rem,9cqw,3rem)] font-semibold uppercase leading-none tracking-tight break-words text-text">
        {title}
      </span>
    </div>
  );
}
