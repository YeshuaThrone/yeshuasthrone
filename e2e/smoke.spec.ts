import { expect, test } from "@playwright/test";

test.describe("site chrome", () => {
  test("home renders the wordmark and the no-releases copy", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    await expect(page.getByRole("link", { name: /yeshua throne — home/i })).toHaveText(
      "YESHUA THRONE",
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Yeshua Throne");
    await expect(page.getByText(/nothing public yet/i)).toBeVisible();
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
