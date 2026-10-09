import { describe, expect, it } from "vitest";
import { champion, releasedSingle } from "@/test/fixtures";
import { defaultOgCard, releaseOgCard, titleFontSize } from "./og";

describe("releaseOgCard", () => {
  it("released: type and formatted date, artwork passed through", () => {
    expect(releaseOgCard(releasedSingle)).toEqual({
      eyebrow: "Yeshua Throne",
      title: "Throne Room",
      line: "Single · June 12, 2026",
      artworkUrl: "https://example.test/artwork/throne-room.jpg",
    });
  });

  it("upcoming without a date: the studio line and the typographic fallback", () => {
    expect(releaseOgCard(champion)).toEqual({
      eyebrow: "Yeshua Throne",
      title: "CHAMPION",
      line: "In the studio now",
      artworkUrl: null,
    });
  });

  it("upcoming with a date: 'Coming …'", () => {
    expect(releaseOgCard({ ...champion, releaseDate: "2027-03-14" }).line).toBe(
      "Album · Coming March 14, 2027",
    );
  });

  it("default card is the site, not a release", () => {
    expect(defaultOgCard()).toMatchObject({ title: "Yeshua Throne", artworkUrl: null });
  });
});

describe("titleFontSize", () => {
  it("steps down as the title grows", () => {
    const sizes = ["CHAMPION", "Austin Nights II", "A title of twenty-four", "x".repeat(40)].map(
      titleFontSize,
    );
    expect(sizes).toEqual([96, 80, 60, 44]);
  });
});
