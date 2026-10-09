/**
 * Static site content: identity, navigation, socials.
 * Open inputs (other handles, booking email, domain) land here when the
 * user supplies them — no component change required.
 */

export const site = {
  name: "Yeshua Throne",
  wordmark: "YESHUA THRONE",
  tagline: "Drops here first.",
  description:
    "Yeshua Throne — Austin, TX. Every record premieres here before it reaches streaming.",
  location: "Austin, TX",
} as const;

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
    href: "https://instagram.com/yeshuasthrone",
  },
];
