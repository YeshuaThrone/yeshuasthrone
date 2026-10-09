import { expect, test } from "@playwright/test";

test.describe("site chrome", () => {
  test("home renders the wordmark, the flagship, and the drop-list line", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    await expect(page.getByRole("link", { name: /yeshua throne — home/i })).toHaveText(
      "YESHUA THRONE",
    );
    // The fixture flagship (see e2e/release-pages.spec.ts for the full hero contract).
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("CHAMPION");
    await expect(page.getByText(/join the list to hear first/i)).toBeVisible();

    const nav = page.getByRole("navigation", { name: "Primary" });
    for (const label of ["Music", "Story", "Archive", "Contact"]) {
      await expect(nav.getByRole("link", { name: label })).toBeVisible();
    }

    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: /instagram/i }),
    ).toHaveAttribute("href", "https://instagram.com/yeshuasthrone");
  });

  test("unknown route returns 404 inside the site chrome", async ({ page }) => {
    const response = await page.goto("/does-not-exist");
    expect(response?.status()).toBe(404);

    await expect(page.getByRole("link", { name: /yeshua throne — home/i })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Nothing here.");
    await expect(page.getByRole("link", { name: "Go to the music" })).toHaveAttribute(
      "href",
      "/music",
    );
  });

  test("reserved shows slot is present but renders nothing", async ({ page }) => {
    await page.goto("/");
    const shows = page.locator("section#shows");
    await expect(shows).toHaveCount(1);
    await expect(shows).toBeHidden();
    await expect(shows).toBeEmpty();
  });
});
