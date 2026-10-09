import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const baseURL = `http://127.0.0.1:${PORT}`;

/**
 * The e2e server runs with no Supabase: TEST_FIXTURES=1 makes the in-memory
 * shim serve src/lib/db/fixtures.ts (CHAMPION, a released single, an
 * upcoming EP with one pre-save link, an unpublished draft). The secrets are
 * test-only values the specs send back.
 */
export const E2E_ENV = {
  TEST_FIXTURES: "1",
  PREVIEW_SECRET: "e2e-preview-secret",
  REVALIDATE_SECRET: "e2e-revalidate-secret",
} as const;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // The player suite calls audio.play() from a click, but headless
        // Chromium still gates autoplay; lift it so playback is observable.
        launchOptions: { args: ["--autoplay-policy=no-user-gesture-required"] },
      },
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { ...process.env, ...E2E_ENV },
  },
});
