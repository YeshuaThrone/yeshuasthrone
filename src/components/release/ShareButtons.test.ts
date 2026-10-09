import { describe, expect, it } from "vitest";
import { shareIntents } from "./ShareButtons";

describe("shareIntents", () => {
  it("builds X and WhatsApp intent URLs with the text and link encoded", () => {
    const intents = shareIntents("CHAMPION — Yeshua Throne", "https://example.test/music/champion");
    expect(intents.x).toBe(
      "https://twitter.com/intent/tweet?text=CHAMPION%20%E2%80%94%20Yeshua%20Throne&url=https%3A%2F%2Fexample.test%2Fmusic%2Fchampion",
    );
    expect(intents.whatsapp).toBe(
      "https://wa.me/?text=CHAMPION%20%E2%80%94%20Yeshua%20Throne%20https%3A%2F%2Fexample.test%2Fmusic%2Fchampion",
    );
  });
});
