import { expect, test, type Page } from "@playwright/test";

/**
 * Runs against the no-env server: the in-memory shim stores drop_alerts
 * emails per process, so a first signup is `created` and the same address
 * again is a `23505` → "already on the list" (see src/lib/db/server.ts).
 */
const CAPTION = "Get the alert when CHAMPION drops";

async function join(page: Page, email: string) {
  await page.goto("/dev/alerts");
  await page.getByLabel(CAPTION).fill(email);
  await page.getByRole("button", { name: "Join the list" }).click();
  return page.getByRole("status");
}

test.describe("drop alerts", () => {
  test("a new email is created, the same email again is already subscribed", async ({
    page,
  }) => {
    // Unique per run: the shim's memory survives across tests in one server.
    const email = `fan-${Date.now()}@example.com`;

    const first = await join(page, email);
    await expect(first).toHaveAttribute("data-state", "created");
    await expect(first).toContainText(/you're on the list/i);
    await expect(page.getByRole("textbox")).toHaveCount(0);

    const second = await join(page, email.toUpperCase());
    await expect(second).toHaveAttribute("data-state", "already_subscribed");
    await expect(second).toContainText(/already on the list/i);
  });

  test("the dev page is not indexable", async ({ page }) => {
    await page.goto("/dev/alerts");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
});
