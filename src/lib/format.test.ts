import { describe, expect, it } from "vitest";
import { formatCbtCode, formatDuration, formatReleaseDate, releaseTypeLabel } from "./format";

describe("formatReleaseDate", () => {
  it("formats an ISO date as a US long date without timezone drift", () => {
    expect(formatReleaseDate("2027-03-14")).toBe("March 14, 2027");
    expect(formatReleaseDate("2026-01-01")).toBe("January 1, 2026");
    expect(formatReleaseDate("2026-12-31")).toBe("December 31, 2026");
  });

  it("returns non-ISO input untouched instead of throwing", () => {
    expect(formatReleaseDate("soon")).toBe("soon");
    expect(formatReleaseDate("")).toBe("");
  });
});

describe("formatDuration", () => {
  it.each([
    [0, "0:00"],
    [5, "0:05"],
    [65, "1:05"],
    [245, "4:05"],
    [3725, "1:02:05"],
    [59.9, "0:59"],
    [null, "–:––"],
    [-1, "–:––"],
    [Number.NaN, "–:––"],
  ])("%s → %s", (input, expected) => {
    expect(formatDuration(input)).toBe(expected);
  });
});

describe("releaseTypeLabel", () => {
  it("labels every release type", () => {
    expect(releaseTypeLabel("single")).toBe("Single");
    expect(releaseTypeLabel("ep")).toBe("EP");
    expect(releaseTypeLabel("album")).toBe("Album");
  });
});

describe("formatCbtCode", () => {
  it.each([
    ["7F3A9", "CBT-7F3A9"],
    ["CBT-7F3A9", "CBT-7F3A9"],
    ["cbt7F3A9", "CBT-7F3A9"],
    ["  CBT-7F3A9  ", "CBT-7F3A9"],
  ])("%s → %s", (input, expected) => {
    expect(formatCbtCode(input)).toBe(expected);
  });
});
