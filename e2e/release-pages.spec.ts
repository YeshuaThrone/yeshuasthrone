import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { E2E_ENV } from "../playwright.config";

/**
 * Runs against the fixture-backed server (TEST_FIXTURES=1, see
 * playwright.config.ts): CHAMPION (featured, undated, no links, no tracks),
 * throne-room (released, two tracks), presave-fixture (upcoming, one apple
 * link), draft-fixture (unpublished).
 */

async function blockingViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical",
  );
}

test.describe("/ — CHAMPION flagship", () => {
  test("shows the lockup, the studio line, an empty pre-save row, and the CHAMPION form", async ({
    page,
  }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    const hero = page.getByRole("region", { name: /champion — upcoming release/i });
    await expect(hero.getByRole("heading", { level: 1 })).toHaveText("CHAMPION");
    await expect(hero.getByText("Drops here first.", { exact: true })).toBeVisible();
    await expect(hero.getByText("In the studio now")).toBeVisible();

    // Spec: every link empty -> the row collapses to the one-line promise, zero anchors.
    const presave = page.getByTestId("presave-row");
    await expect(presave).toBeVisible();
    await expect(presave.locator("a")).toHaveCount(0);
    await expect(presave).toContainText(/pre-save links land here the moment they exist/i);

    const form = hero.locator("form");
    await expect(form.getByLabel("Get the alert when CHAMPION drops")).toBeVisible();
    await expect(form.locator('input[name="source"]')).toHaveValue("release:champion");

    // Below the hero: latest released music (not the flagship), teasers, socials.
    const latest = page.getByRole("region", { name: "Latest" });
    await expect(latest.locator("[data-slug]")).toHaveCount(1);
    await expect(latest.locator('[data-slug="throne-room"]')).toHaveAttribute(
      "data-status",
      "released",
    );
    await expect(latest.getByRole("button", { name: "Play Throne Room" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Read the story" })).toHaveAttribute(
      "href",
      "/story",
    );
    await expect(page.getByRole("link", { name: "Open the archive" })).toHaveAttribute(
      "href",
      "/archive",
    );

    expect(await blockingViolations(page)).toEqual([]);
  });
});

test.describe("/music", () => {
  test("lists upcoming first then released, with play only on released cards", async ({
    page,
  }) => {
    const response = await page.goto("/music");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/^Music · Yeshua Throne$/);

    const cards = page.getByTestId("release-grid").locator("[data-slug]");
    await expect(cards).toHaveCount(3);
    await expect(cards.nth(0)).toHaveAttribute("data-slug", "champion");
    await expect(cards.nth(1)).toHaveAttribute("data-slug", "presave-fixture");
    await expect(cards.nth(2)).toHaveAttribute("data-slug", "throne-room");

    await expect(page.getByRole("button", { name: /^play /i })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Play Throne Room" })).toBeVisible();
    // The draft is never listed.
    await expect(page.locator('[data-slug="draft-fixture"]')).toHaveCount(0);

    expect(await blockingViolations(page)).toEqual([]);
  });
});

test.describe("/music/[slug]", () => {
  test("a released slug renders the tracklist, player controls, Covnant badge and share", async ({
    page,
  }) => {
    const response = await page.goto("/music/throne-room");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/^Throne Room · Yeshua Throne$/);

    const tracklist = page.getByRole("list", { name: "Tracklist" });
    await expect(tracklist.getByRole("listitem")).toHaveCount(2);
    await expect(tracklist.getByRole("button", { name: "Play Throne Room" })).toBeVisible();
    await expect(tracklist.getByRole("button", { name: "Play Austin Nights" })).toBeVisible();
    await expect(tracklist.getByText("Prod. Yeshua Throne")).toBeVisible();

    await expect(page.getByText(/CBT-7F3A9/)).toBeVisible();
    await expect(page.getByRole("link", { name: /listen on.*spotify/i })).toHaveAttribute(
      "href",
      "https://open.spotify.com/track/x",
    );
    await expect(page.getByRole("group", { name: "Share" }).getByRole("button")).toHaveCount(3);
    await expect(page.locator('input[name="source"]')).toHaveValue("release:throne-room");

    // Pressing play on a track queues the release and shows the player bar.
    await tracklist.getByRole("button", { name: "Play Austin Nights" }).click();
    const bar = page.getByRole("region", { name: "Now playing" });
    await expect(bar).toBeVisible();
    await expect(bar).toHaveAttribute("data-status", "playing");

    expect(await blockingViolations(page)).toEqual([]);
  });

  test("an upcoming slug with one pre-save link renders exactly one enabled anchor", async ({
    page,
  }) => {
    const response = await page.goto("/music/presave-fixture");
    expect(response?.status()).toBe(200);

    await expect(page.getByText("Coming March 14, 2027")).toBeVisible();
    const presave = page.getByTestId("presave-row");
    const anchors = presave.locator("a");
    await expect(anchors).toHaveCount(1);
    await expect(anchors).toHaveAttribute("href", "https://music.apple.com/pre-add/x");
    await expect(presave.locator('[aria-disabled="true"]')).toHaveCount(4);

    await expect(page.getByRole("list", { name: "Tracklist" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^play /i })).toHaveCount(0);
  });

  test("unknown and unpublished slugs are real 404s", async ({ page }) => {
    const unknown = await page.goto("/music/unknown");
    expect(unknown?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Nothing here.");

    const draft = await page.goto("/music/draft-fixture");
    expect(draft?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Nothing here.");

    const wrongSecret = await page.goto("/music/draft-fixture?preview=wrong");
    expect(wrongSecret?.status()).toBe(404);
  });

  test("the preview secret renders the draft with the banner and noindex", async ({ page }) => {
    const response = await page.goto(
      `/music/draft-fixture?preview=${E2E_ENV.PREVIEW_SECRET}`,
    );
    expect(response?.status()).toBe(200);
    expect(response?.headers()["x-robots-tag"]).toMatch(/noindex/);

    await expect(page.getByTestId("preview-banner")).toHaveText(/preview — not published/i);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Draft Fixture");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

    // The preview route is not reachable without the secret either.
    const direct = await page.goto("/preview/music/draft-fixture");
    expect(direct?.status()).toBe(404);
  });
});

test.describe("POST /api/revalidate", () => {
  test("401 without the secret, 200 with it", async ({ request }) => {
    const denied = await request.post("/api/revalidate", { data: { slug: "champion" } });
    expect(denied.status()).toBe(401);
    expect(await denied.json()).toEqual({
      error: "Invalid or missing secret.",
      code: "unauthorized",
    });

    const ok = await request.post("/api/revalidate", {
      headers: { "x-revalidate-secret": E2E_ENV.REVALIDATE_SECRET },
      data: { slug: "champion" },
    });
    expect(ok.status()).toBe(200);
    expect(await ok.json()).toEqual({
      revalidated: true,
      paths: ["/", "/music", "/music/champion"],
    });
  });
});
