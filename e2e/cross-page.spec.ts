import { expect, test, type Page } from "@playwright/test";

/**
 * Flows that cross a route boundary, against the fixture server
 * (TEST_FIXTURES=1): throne-room is the released fixture whose tracks point
 * at the committed test WAV (public/test-audio/tone.wav).
 */

/** Snapshot of the one site-wide <audio> element. */
function audioState(page: Page) {
  return page.evaluate(() => {
    const audios = document.querySelectorAll("audio");
    const audio = audios[0] as HTMLAudioElement | undefined;
    return {
      count: audios.length,
      paused: audio?.paused ?? null,
      currentSrc: audio?.currentSrc ?? null,
    };
  });
}

/** Chrome every page shares: wordmark link, primary nav, footer socials. */
async function expectSiteChrome(page: Page) {
  await expect(page.getByRole("link", { name: /yeshua throne — home/i })).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Primary" });
  for (const label of ["Music", "Story", "Archive", "Contact"]) {
    await expect(nav.getByRole("link", { name: label })).toBeVisible();
  }
  await expect(
    page.getByRole("contentinfo").getByRole("link", { name: /instagram/i }),
  ).toBeVisible();
}

test.describe("audio across pages", () => {
  test("the first track played on /music keeps playing on /story", async ({ page }) => {
    await page.goto("/music");
    const bar = page.getByRole("region", { name: "Now playing" });
    await expect(bar).toHaveCount(0);

    // The only playable card in the fixture set is the released single.
    const grid = page.getByTestId("release-grid");
    await grid.getByRole("button", { name: /^play /i }).first().click();
    await expect(bar).toBeVisible();
    await expect(bar).toHaveAttribute("data-status", "playing");
    await expect(bar).toContainText("Throne Room");

    const before = await audioState(page);
    expect(before.count).toBe(1);
    expect(before.paused).toBe(false);
    expect(before.currentSrc).toContain("/test-audio/tone.wav");

    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Story" }).click();
    await expect(page).toHaveURL(/\/story$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Yeshua Throne");

    const after = await audioState(page);
    expect(after.count).toBe(1);
    expect(after.paused).toBe(false);
    expect(after.currentSrc).toBe(before.currentSrc);
    await expect(bar).toBeVisible();
    await expect(bar).toHaveAttribute("data-status", "playing");
    // The bar still links back to the release that is playing.
    await expect(bar.getByRole("link", { name: "Throne Room" })).toHaveAttribute(
      "href",
      "/music/throne-room",
    );
  });
});

test.describe("drop alerts on the home page", () => {
  // The limiter keys on the first x-forwarded-for hop (5 hits / 10 min per
  // key, in-memory per server process). A private key keeps this flow out of
  // the bucket the other specs and any CI retry share.
  test.use({ extraHTTPHeaders: { "x-forwarded-for": `10.0.0.${Date.now() % 250}` } });

  const CAPTION = "Get the alert when CHAMPION drops";

  async function joinFromHome(page: Page, email: string) {
    await page.goto("/");
    const hero = page.getByRole("region", { name: /champion — upcoming release/i });
    await hero.getByLabel(CAPTION).fill(email);
    await hero.getByRole("button", { name: "Join the list" }).click();
    return hero.getByRole("status");
  }

  test("a second signup with the same email reads as already on the list", async ({ page }) => {
    const email = `home-fan-${Date.now()}@example.com`;

    const first = await joinFromHome(page, email);
    await expect(first).toHaveAttribute("data-state", "created");
    await expect(first).toContainText(/you're on the list/i);

    // Fresh page load: the form is back, the same address (any case) is a duplicate.
    const second = await joinFromHome(page, email.toUpperCase());
    await expect(second).toHaveAttribute("data-state", "already_subscribed");
    await expect(second).toContainText(/already on the list/i);
    // Treated as success: no error, no form left to retry. (Scoped to the
    // hero — Next's route announcer is an empty role="alert" in the body.)
    const hero = page.getByRole("region", { name: /champion — upcoming release/i });
    await expect(hero.getByRole("alert")).toHaveCount(0);
    await expect(hero.getByRole("textbox")).toHaveCount(0);
  });
});

test.describe("404 inside the chrome", () => {
  test("an unknown route and an unknown release both keep the site chrome and route back", async ({
    page,
  }) => {
    for (const path of ["/no-such-page", "/music/no-such-release"]) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(404);

      await expectSiteChrome(page);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Nothing here.");
      await expect(page.getByRole("main")).toContainText(/does not exist, or it is not public yet/i);
    }

    // The escape hatch is a real client navigation into the music index.
    await page.getByRole("link", { name: "Go to the music" }).click();
    await expect(page).toHaveURL(/\/music$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Music");
    await expectSiteChrome(page);
  });

  test("the header nav still works from a 404", async ({ page }) => {
    await page.goto("/no-such-page");
    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Story" }).click();
    await expect(page).toHaveURL(/\/story$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Yeshua Throne");
  });
});
