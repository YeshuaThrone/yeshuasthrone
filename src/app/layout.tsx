import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PlayerBar, PlayerProvider } from "@/components/player";
import { site } from "@/content/site";
import { siteUrl } from "@/lib/seo";
import "./globals.css";

/**
 * `metadataBase` is what turns every page's relative canonical, og:url and
 * OG image path into an absolute URL. Page-level metadata is built with
 * `buildMetadata()` (src/lib/seo.ts); this only holds the template and the
 * site-wide defaults.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        {/* One provider, one <audio>: playback survives App Router navigation. */}
        <PlayerProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          {/* Reserved for the ATXLive show feed (phase 2). Renders nothing in v1. */}
          <section id="shows" hidden />
          <SiteFooter />
          <PlayerBar />
        </PlayerProvider>
      </body>
    </html>
  );
}
