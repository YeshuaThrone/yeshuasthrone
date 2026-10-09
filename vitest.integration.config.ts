import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Integration suite: runs against a local Supabase (`supabase start`).
 * Node environment (real fetch, no jsdom). Each spec skips itself when
 * SUPABASE_TEST_URL is unset, so `npm run test:integration` is safe anywhere.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(
        new URL("./test/stubs/server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    testTimeout: 20_000,
  },
});
