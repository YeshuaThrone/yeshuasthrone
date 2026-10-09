import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/content/site";
import { getReleaseBySlug } from "@/lib/db/queries";
import { defaultOgCard, releaseOgCard, titleFontSize, type OgCard } from "@/lib/releases/og";
import { DEFAULT_OG_SLUG, OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from "@/lib/seo";

/**
 * Share image per release (`/api/og/<slug>`) plus the site card
 * (`/api/og/default`). Reads through the same published-only query as the
 * pages, so a draft slug is a 404 here too and never leaks via a card.
 *
 * Fonts are the static Geist cuts vendored under src/assets/fonts (OFL);
 * satori cannot use the variable fonts next/font serves to the browser.
 */
export const revalidate = 3600;

const CACHE_CONTROL = "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400";

// Design tokens, mirrored from globals.css — satori has no CSS variables.
const COLORS = {
  onyx: "#0D0F12",
  ink: "#15181E",
  text: "#F2F4F7",
  muted: "#9AA3B2",
  gold: "#D4AF37",
} as const;

const FONT_DIR = join(process.cwd(), "src/assets/fonts");

async function loadFonts() {
  const [sans, mono] = await Promise.all([
    readFile(join(FONT_DIR, "Geist-SemiBold.ttf")),
    readFile(join(FONT_DIR, "GeistMono-Regular.ttf")),
  ]);
  return [
    { name: "Geist", data: sans, weight: 600 as const, style: "normal" as const },
    { name: "Geist Mono", data: mono, weight: 400 as const, style: "normal" as const },
  ];
}

const ARTWORK_TIMEOUT_MS = 4000;
const ARTWORK_MAX_BYTES = 5 * 1024 * 1024;

/**
 * Inline the artwork as a data URL so the renderer never performs its own
 * network fetch mid-stream. Any failure (timeout, non-image, oversize) logs
 * and falls back to the lockup: a card must never 500 because a JPEG moved.
 */
async function fetchArtworkDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(ARTWORK_TIMEOUT_MS) });
    const type = response.headers.get("content-type") ?? "";
    if (!response.ok || !type.startsWith("image/")) {
      console.error(`[og] artwork ${url} rejected: ${response.status} ${type}`);
      return null;
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.byteLength > ARTWORK_MAX_BYTES) {
      console.error(`[og] artwork ${url} too large (${bytes.byteLength} bytes)`);
      return null;
    }
    return `data:${type};base64,${bytes.toString("base64")}`;
  } catch (error) {
    console.error(`[og] artwork ${url} fetch failed:`, error);
    return null;
  }
}

const PANEL = 470;

/** Left panel: the cover art, or the same typographic lockup the site's Artwork slot uses. */
function LeftPanel({ card, artwork }: { card: OgCard; artwork: string | null }) {
  if (artwork) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- satori JSX, not the DOM
      <img
        src={artwork}
        alt=""
        width={PANEL}
        height={PANEL}
        style={{ width: PANEL, height: PANEL, objectFit: "cover", borderRadius: 24 }}
      />
    );
  }
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: PANEL,
        height: PANEL,
        padding: 40,
        borderRadius: 24,
        background: COLORS.ink,
        border: `1px solid rgba(242,244,247,0.08)`,
      }}
    >
      <span
        style={{
          fontFamily: "Geist Mono",
          fontSize: 16,
          letterSpacing: 5,
          textTransform: "uppercase",
          color: COLORS.muted,
        }}
      >
        {site.wordmark}
      </span>
      <span
        style={{
          fontFamily: "Geist",
          fontSize: card.title.length <= 10 ? 64 : 44,
          lineHeight: 1,
          textTransform: "uppercase",
          letterSpacing: -2,
          color: COLORS.text,
          wordBreak: "break-word",
        }}
      >
        {card.title}
      </span>
    </div>
  );
}

function Card({ card, artwork }: { card: OgCard; artwork: string | null }) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        alignItems: "center",
        gap: 64,
        padding: 80,
        background: `radial-gradient(circle at 100% 0%, rgba(0,102,255,0.22), ${COLORS.onyx} 55%)`,
        color: COLORS.text,
      }}
    >
      <LeftPanel card={card} artwork={artwork} />
      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 22 }}>
        <span
          style={{
            fontFamily: "Geist Mono",
            fontSize: 20,
            letterSpacing: 5,
            textTransform: "uppercase",
            color: COLORS.muted,
          }}
        >
          {card.eyebrow}
        </span>
        <span
          style={{
            fontFamily: "Geist",
            fontSize: titleFontSize(card.title),
            lineHeight: 1,
            letterSpacing: -3,
            color: COLORS.text,
          }}
        >
          {card.title}
        </span>
        <span style={{ fontFamily: "Geist Mono", fontSize: 22, color: COLORS.muted }}>
          {card.line}
        </span>
        <div
          style={{
            width: 160,
            height: 2,
            marginTop: 8,
            background: `linear-gradient(90deg, ${COLORS.gold}, rgba(212,175,55,0))`,
          }}
        />
        <span
          style={{
            fontFamily: "Geist Mono",
            fontSize: 20,
            letterSpacing: 5,
            textTransform: "uppercase",
            color: COLORS.gold,
          }}
        >
          {site.tagline}
        </span>
      </div>
    </div>
  );
}

interface Params {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;

  let card: OgCard;
  if (slug === DEFAULT_OG_SLUG) {
    card = defaultOgCard();
  } else {
    const release = await getReleaseBySlug(slug);
    if (!release) {
      return Response.json({ error: "Not found", code: "not_found" }, { status: 404 });
    }
    card = releaseOgCard(release);
  }

  const [fonts, artwork] = await Promise.all([
    loadFonts(),
    card.artworkUrl ? fetchArtworkDataUrl(card.artworkUrl) : null,
  ]);

  return new ImageResponse(<Card card={card} artwork={artwork} />, {
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    fonts,
    headers: { "Cache-Control": CACHE_CONTROL },
  });
}
