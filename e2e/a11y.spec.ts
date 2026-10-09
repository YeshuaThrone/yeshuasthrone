import { expect, test } from "@playwright/test";
import { blockingViolations, describeViolations } from "./helpers/axe";

/**
 * Spec gate: axe reports zero serious/critical violations on every public
 * route. Runs against the fixture server, so /music/champion is the
 * launch-day CHAMPION state (no art, no links, no tracks) — the page fans
 * actually see first.
 */
const PUBLIC_ROUTES = ["/", "/music", "/music/champion", "/story", "/archive", "/contact"] as const;

test.describe("accessibility sweep", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} has no serious or critical axe violations`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status(), route).toBe(200);

      const violations = await blockingViolations(page);
      expect(describeViolations(violations), route).toEqual([]);
    });
  }

  test("the 404 page has no serious or critical axe violations", async ({ page }) => {
    const response = await page.goto("/music/no-such-release");
    expect(response?.status()).toBe(404);

    const violations = await blockingViolations(page);
    expect(describeViolations(violations)).toEqual([]);
  });

  test("the player bar, once shown, has no serious or critical axe violations", async ({
    page,
  }) => {
    await page.goto("/music/throne-room");
    await page.getByRole("button", { name: "Play Throne Room" }).click();
    await expect(page.getByRole("region", { name: "Now playing" })).toBeVisible();

    const violations = await blockingViolations(page);
    expect(describeViolations(violations)).toEqual([]);
  });
});
