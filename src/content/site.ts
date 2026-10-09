/**
 * Static site content: identity, navigation, socials, contact.
 * Open inputs (other handles, booking email, hero image, domain) land here
 * when the user supplies them — no component change required.
 */

export interface HeroImage {
  src: string;
  alt: string;
}

export interface SiteConfig {
  name: string;
  wordmark: string;
  tagline: string;
  description: string;
  location: string;
  instagram: string;
  /** Booking / press address. `null` until Yeshua supplies one (spec: open questions). */
  bookingEmail: string | null;
  /** Story-page hero. `null` renders the typographic treatment on onyx. */
  storyHeroImage: HeroImage | null;
}

export const site: SiteConfig = {
  name: "Yeshua Throne",
  wordmark: "YESHUA THRONE",
  tagline: "Drops here first.",
  description:
    "Yeshua Throne — Austin, TX. Every record premieres here before it reaches streaming.",
  location: "Austin, TX",
  instagram: "https://instagram.com/yeshuasthrone",
  bookingEmail: null,
  storyHeroImage: null,
};

export interface NavItem {
  label: string;
  href: string;
}

export const nav: readonly NavItem[] = [
  { label: "Music", href: "/music" },
  { label: "Story", href: "/story" },
  { label: "Archive", href: "/archive" },
  { label: "Contact", href: "/contact" },
];

export type SocialPlatform = "instagram" | "tiktok" | "x" | "youtube";

export interface SocialLink {
  platform: SocialPlatform;
  label: string;
  handle: string;
  href: string;
}

// Instagram is the only confirmed handle (spec: open questions).
export const socials: readonly SocialLink[] = [
  {
    platform: "instagram",
    label: "Instagram",
    handle: "@yeshuasthrone",
    href: site.instagram,
  },
];

/** How the contact page should route booking and press enquiries. */
export type BookingContact =
  | { kind: "email"; email: string; href: string }
  | { kind: "instagram"; href: string };

/**
 * Prefer the booking address; until one exists, point at Instagram DMs.
 * A blank or whitespace-only address counts as missing so a half-filled
 * config never renders a dead `mailto:`.
 */
export function getBookingContact(config: SiteConfig = site): BookingContact {
  const email = config.bookingEmail?.trim();
  if (email) {
    return { kind: "email", email, href: `mailto:${email}` };
  }
  return { kind: "instagram", href: config.instagram };
}
