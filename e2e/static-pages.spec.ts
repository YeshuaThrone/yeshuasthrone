import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const INSTAGRAM = "https://instagram.com/yeshuasthrone";

/** Serious/critical axe violations only — the spec's gate for every page. */
async function blockingViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical",
  );
}

test.describe("/story", () => {
  test("renders the bio, the pull line, and the drop-list CTA", async ({ page }) => {
    const response = await page.goto("/story");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/^Story · Yeshua Throne$/);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Yeshua Throne");
    // Typographic hero until a real image is configured.
    await expect(page.getByRole("img", { name: /yeshua throne — austin, tx/i })).toBeVisible();
    await expect(page.getByText(/yeshua throne is an austin artist/i)).toBeVisible();
    await expect(page.getByText(/champion, his album, is being recorded now/i)).toBeVisible();

    const alerts = page.getByRole("complementary", { name: "Drop alerts" });
    await expect(alerts.getByText("Drops here first.")).toBeVisible();
    await expect(alerts.getByRole("link", { name: "Get the drop alert" })).toHaveAttribute(
      "href",
      "/#alerts",
    );

    await expect(page.getByRole("link", { name: /instagram/i }).first()).toHaveAttribute(
      "href",
      INSTAGRAM,
    );
    expect(await blockingViolations(page)).toEqual([]);
  });
});

test.describe("/archive", () => {
  test("loads with no iframe and injects exactly one after clicking the facade", async ({
    page,
  }) => {
    const response = await page.goto("/archive");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/^Archive · Yeshua Throne$/);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Archive");
    await expect(page.getByText(/before yeshua throne there was josué thé truth/i)).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Dreams (Official Video)" }),
    ).toBeVisible();
    await expect(page.getByText(/dir\. blurry vision filmz/i)).toBeVisible();

    await expect(page.locator("iframe")).toHaveCount(0);
    expect(await blockingViolations(page)).toEqual([]);

    await page.getByRole("button", { name: "Play Dreams (Official Video)" }).click();

    const iframe = page.locator("iframe");
    await expect(iframe).toHaveCount(1);
    await expect(iframe).toHaveAttribute(
      "src",
      /^https:\/\/www\.youtube-nocookie\.com\/embed\/0vNAxj-xvZs/,
    );
    await expect(iframe).toHaveAttribute("title", "Dreams (Official Video)");
  });
});

test.describe("/contact", () => {
  test("renders the heading, Instagram DM fallback, and Instagram links", async ({ page }) => {
    const response = await page.goto("/contact");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/^Contact · Yeshua Throne$/);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Get in touch");

    // No booking address yet: no mailto anywhere, DM link routes to Instagram.
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
    await expect(page.getByRole("link", { name: "DM on Instagram" })).toHaveAttribute(
      "href",
      INSTAGRAM,
    );
    // Prominent card link plus the SocialLinks entry — both inside <main>.
    const mainLinks = page.getByRole("main").getByRole("link", { name: "@yeshuasthrone" });
    await expect(mainLinks).toHaveCount(2);
    for (const link of await mainLinks.all()) {
      await expect(link).toHaveAttribute("href", INSTAGRAM);
    }

    expect(await blockingViolations(page)).toEqual([]);
  });
});
