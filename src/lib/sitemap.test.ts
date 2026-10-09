import { describe, expect, it } from "vitest";
import { champion, releasedSingle } from "@/test/fixtures";
import { buildRobots, buildSitemap } from "./sitemap";

const env = { NEXT_PUBLIC_SITE_URL: "https://yeshuathrone.com" };

describe("buildSitemap", () => {
  it("lists the static routes and one entry per release it is given", () => {
    const entries = buildSitemap([champion, releasedSingle], env);
    expect(entries.map((e) => e.url)).toEqual([
      "https://yeshuathrone.com/",
      "https://yeshuathrone.com/music",
      "https://yeshuathrone.com/story",
      "https://yeshuathrone.com/archive",
      "https://yeshuathrone.com/contact",
      "https://yeshuathrone.com/music/champion",
      "https://yeshuathrone.com/music/throne-room",
    ]);
  });

  it("dates released entries and leaves undated upcoming ones without lastModified", () => {
    const [, , , , , upcoming, released] = buildSitemap([champion, releasedSingle], env);
    expect(upcoming).not.toHaveProperty("lastModified");
    expect(upcoming).toMatchObject({ changeFrequency: "weekly", priority: 0.9 });
    expect(released).toMatchObject({ lastModified: "2026-06-12", changeFrequency: "monthly" });
  });

  it("never lists /dev, /preview or /api", () => {
    for (const entry of buildSitemap([releasedSingle], env)) {
      expect(entry.url).not.toMatch(/\/(dev|preview|api)\b/);
    }
  });

  it("with no releases still lists the static routes", () => {
    expect(buildSitemap([], env)).toHaveLength(5);
  });
});

describe("buildRobots", () => {
  it("allows everything except dev, preview and api, and names the sitemap", () => {
    expect(buildRobots(env)).toEqual({
      rules: [{ userAgent: "*", allow: "/", disallow: ["/dev", "/dev/", "/preview/", "/api/"] }],
      sitemap: "https://yeshuathrone.com/sitemap.xml",
    });
  });
});
