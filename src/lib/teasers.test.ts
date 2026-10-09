import { describe, expect, it } from "vitest";
import { story } from "@/content/story";
import { storyTeaser } from "./teasers";

describe("storyTeaser", () => {
  it("takes the first two sentences across paragraphs", () => {
    expect(storyTeaser(["One. Two.", "Three."])).toBe("One. Two.");
    expect(storyTeaser(["Only one here.", "Second para!"])).toBe("Only one here. Second para!");
  });

  it("falls back to the first paragraph when there is no sentence punctuation", () => {
    expect(storyTeaser(["no punctuation"])).toBe("no punctuation");
    expect(storyTeaser([])).toBe("");
  });

  it("opens with the real bio's first sentence", () => {
    expect(storyTeaser(story)).toMatch(/^Yeshua Throne is an Austin artist\./);
  });
});
