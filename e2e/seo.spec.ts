import { expect, test } from "@playwright/test";

/**
 * SEO surfaces against the fixture server: champion (upcoming, featured),
 * throne-room (released), presave-fixture (upcoming), draft-fixture (unpublished).
 */
test.describe("share images", () => {
  test("GET /api/og/champion returns a 1200x630 PNG with public caching", async ({ request }) => {
    const response = await request.get("/api/og/champion");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");
    expect(response.headers()["cache-control"]).toContain("public");
    expect(response.headers()["cache-control"]).toContain("max-age=3600");

    const png = await response.body();
    // PNG signature + IHDR width/height (big-endian at bytes 16..24).
    expect(png.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });

  test("the default card and a released card also render", async ({ request }) => {
    for (const slug of ["default", "throne-room"]) {
      const response = await request.get(`/api/og/${slug}`);
      expect(response.status(), slug).toBe(200);
      expect(response.headers()["content-type"], slug).toBe("image/png");
    }
  });

  test("drafts and unknown slugs are 404, not an image", async ({ request }) => {
    for (const slug of ["draft-fixture", "no-such-release"]) {
      const response = await request.get(`/api/og/${slug}`);
      expect(response.status(), slug).toBe(404);
      expect(await response.json()).toEqual({ error: "Not found", code: "not_found" });
    }
  });
});

test.describe("sitemap and robots", () => {
  test("/sitemap.xml parses, lists published releases and never a draft", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/xml");

    const xml = await response.text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);

    expect(locs).toEqual(
      expect.arrayContaining(["/", "/music", "/story", "/archive", "/contact", "/music/champion"]),
    );
    expect(locs).toContain("/music/throne-room");
    expect(locs).not.toContain("/music/draft-fixture");
    expect(locs.some((p) => p.startsWith("/dev") || p.startsWith("/preview") || p.startsWith("/api")))
      .toBe(false);
  });

  test("/robots.txt allows the site, blocks dev/preview/api and names the sitemap", async ({
    request,
  }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toMatch(/User-Agent: \*/i);
    expect(body).toMatch(/Allow: \//);
    expect(body).toMatch(/Disallow: \/dev/);
    expect(body).toMatch(/Disallow: \/preview\//);
    expect(body).toMatch(/Disallow: \/api\//);
    expect(body).toMatch(/Sitemap: https?:\/\/[^/]+\/sitemap\.xml/);
  });
});

test.describe("page head", () => {
  test("/music/champion carries canonical, OG/Twitter card and MusicAlbum JSON-LD", async ({
    page,
  }) => {
    await page.goto("/music/champion");

    await expect(page).toHaveTitle("CHAMPION · Yeshua Throne");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /^https?:\/\/[^/]+\/music\/champion$/,
    );
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "music.album");
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      /\/api\/og\/champion$/,
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );

    const ld = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').first().textContent()) ?? "null",
    );
    expect(ld).toMatchObject({ "@type": "MusicAlbum", name: "CHAMPION" });
    expect(ld).not.toHaveProperty("track");
  });

  test("/music/throne-room emits MusicRecording per track", async ({ page }) => {
    await page.goto("/music/throne-room");
    const ld = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').first().textContent()) ?? "null",
    );
    expect(ld["@type"]).toBe("MusicAlbum");
    expect(ld.track.length).toBeGreaterThan(0);
    expect(ld.track.length).toBe(ld.numTracks);
    for (const recording of ld.track) {
      expect(recording).toMatchObject({
        "@type": "MusicRecording",
        byArtist: { name: "Yeshua Throne" },
        inAlbum: { name: "Throne Room" },
      });
    }
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "music.song");
  });

  test("/story emits MusicGroup JSON-LD; every static route has a canonical", async ({ page }) => {
    await page.goto("/story");
    const ld = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').first().textContent()) ?? "null",
    );
    expect(ld).toMatchObject({ "@type": "MusicGroup", name: "Yeshua Throne" });

    for (const path of ["/", "/music", "/archive", "/contact"]) {
      await page.goto(path);
      await expect(page.locator('link[rel="canonical"]'), path).toHaveAttribute(
        "href",
        new RegExp(`^https?://[^/]+${path === "/" ? "/?" : path}$`),
      );
      await expect(page.locator('meta[property="og:image"]'), path).toHaveAttribute(
        "content",
        /\/api\/og\//,
      );
    }
  });
});
