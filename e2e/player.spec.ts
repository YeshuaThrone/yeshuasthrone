import { expect, test, type Page } from "@playwright/test";

/** Snapshot of the one site-wide <audio> element. */
function audioState(page: Page) {
  return page.evaluate(() => {
    const audios = document.querySelectorAll("audio");
    const audio = audios[0] as HTMLAudioElement | undefined;
    return {
      count: audios.length,
      paused: audio?.paused ?? null,
      currentSrc: audio?.currentSrc ?? null,
      currentTime: audio?.currentTime ?? null,
    };
  });
}

test.describe("persistent audio player", () => {
  test("keeps playing across client navigation", async ({ page }) => {
    await page.goto("/dev/player");
    const bar = page.getByRole("region", { name: "Now playing" });
    await expect(bar).toHaveCount(0);

    await page.getByRole("button", { name: "Play Tone One" }).click();
    await expect(bar).toBeVisible();
    await expect(bar).toHaveAttribute("data-status", "playing");
    await expect(page.getByRole("button", { name: "Pause Tone One" })).toBeVisible();

    const before = await audioState(page);
    expect(before.count).toBe(1);
    expect(before.paused).toBe(false);
    expect(before.currentSrc).toContain("/test-audio/tone.wav?track=1");

    await page.getByRole("link", { name: "Go to the other page" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Other page");

    const after = await audioState(page);
    expect(after.count).toBe(1);
    expect(after.paused).toBe(false);
    expect(after.currentSrc).toBe(before.currentSrc);
    await expect(bar).toBeVisible();
    await expect(bar).toHaveAttribute("data-status", "playing");
  });

  test("playing a second track replaces the first in the single audio element", async ({
    page,
  }) => {
    await page.goto("/dev/player");
    await page.getByRole("button", { name: "Play Tone One" }).click();
    await expect(page.getByRole("button", { name: "Pause Tone One" })).toBeVisible();

    await page.getByRole("button", { name: "Play Tone Two" }).click();
    await expect(page.getByRole("button", { name: "Pause Tone Two" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Play Tone One" })).toBeVisible();

    await expect
      .poll(async () => (await audioState(page)).currentSrc)
      .toMatch(/\/test-audio\/tone\.wav\?track=2$/);
    const state = await audioState(page);
    expect(state.count).toBe(1);
    expect(state.paused).toBe(false);
  });

  test("a track that fails to load shows the error and Retry keeps the queue", async ({
    page,
  }) => {
    await page.goto("/dev/player");
    await page.getByRole("button", { name: "Play Missing Track" }).click();

    const bar = page.getByRole("region", { name: "Now playing" });
    await expect(bar).toHaveAttribute("data-status", "error");
    await expect(bar.getByRole("alert")).toContainText("Couldn't load this track");
    await expect(bar).toContainText("Missing Track");

    await bar.getByRole("button", { name: "Retry" }).click();
    // Still 404: lands back in error, still on the same track.
    await expect(bar).toHaveAttribute("data-status", "error");
    await expect(bar).toContainText("Missing Track");
  });

  test("pause and resume from the bar", async ({ page }) => {
    await page.goto("/dev/player");
    await page.getByRole("button", { name: "Play Tone One" }).click();
    const bar = page.getByRole("region", { name: "Now playing" });
    await expect(bar).toHaveAttribute("data-status", "playing");

    await bar.getByRole("button", { name: "Pause" }).click();
    await expect(bar).toHaveAttribute("data-status", "paused");
    expect((await audioState(page)).paused).toBe(true);

    await bar.getByRole("button", { name: "Play" }).click();
    await expect(bar).toHaveAttribute("data-status", "playing");
    expect((await audioState(page)).paused).toBe(false);
  });
});
