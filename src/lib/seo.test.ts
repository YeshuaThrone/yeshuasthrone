import { describe, expect, it } from "vitest";
import {
  absoluteUrl,
  buildMetadata,
  musicGroupJsonLd,
  ogImagePath,
  serializeJsonLd,
  siteUrl,
} from "./seo";

describe("siteUrl", () => {
  it("prefers NEXT_PUBLIC_SITE_URL, then VERCEL_URL, then localhost", () => {
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: "https://yeshuathrone.com/", VERCEL_URL: "x.vercel.app" }))
      .toBe("https://yeshuathrone.com");
    expect(siteUrl({ VERCEL_URL: "site-abc.vercel.app" })).toBe("https://site-abc.vercel.app");
    expect(siteUrl({})).toBe("http://localhost:3000");
  });

  it("ignores blank values", () => {
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: "  ", VERCEL_URL: "" })).toBe("http://localhost:3000");
  });

  it("builds absolute urls from paths", () => {
    expect(absoluteUrl("/music/champion", { VERCEL_URL: "a.vercel.app" })).toBe(
      "https://a.vercel.app/music/champion",
    );
    expect(ogImagePath()).toBe("/api/og/default");
    expect(ogImagePath("throne-room")).toBe("/api/og/throne-room");
  });
});

describe("buildMetadata", () => {
  it("matches the snapshot for a templated page", () => {
    expect(
      buildMetadata({ title: "Music", description: "Every release.", path: "/music" }),
    ).toMatchSnapshot();
  });

  it("uses an absolute title and the release card for the home page", () => {
    const meta = buildMetadata({
      title: "Yeshua Throne — Drops here first.",
      absoluteTitle: true,
      description: "d",
      path: "/",
      ogSlug: "champion",
    });
    expect(meta.title).toEqual({ absolute: "Yeshua Throne — Drops here first." });
    expect(meta.openGraph?.title).toBe("Yeshua Throne — Drops here first.");
    expect(meta.openGraph?.images).toEqual([
      expect.objectContaining({ url: "/api/og/champion", width: 1200, height: 630 }),
    ]);
    expect(meta.twitter).toMatchObject({ card: "summary_large_image", images: ["/api/og/champion"] });
    expect(meta.alternates?.canonical).toBe("/");
  });
});

describe("JSON-LD helpers", () => {
  it("MusicGroup snapshot", () => {
    expect(musicGroupJsonLd({ NEXT_PUBLIC_SITE_URL: "https://yeshuathrone.com" })).toMatchSnapshot();
  });

  it("escapes < so page copy cannot close the script tag", () => {
    expect(serializeJsonLd({ a: "</script><b>" })).toBe('{"a":"\\u003c/script>\\u003cb>"}');
  });
});
