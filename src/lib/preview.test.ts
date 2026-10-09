import { describe, expect, it } from "vitest";
import { isPreviewAuthorized } from "./preview";

describe("isPreviewAuthorized", () => {
  it("matches only an exact, non-empty secret", () => {
    expect(isPreviewAuthorized("s3cret", "s3cret")).toBe(true);
    expect(isPreviewAuthorized("S3CRET", "s3cret")).toBe(false);
    expect(isPreviewAuthorized("s3cret ", "s3cret")).toBe(false);
    expect(isPreviewAuthorized("", "s3cret")).toBe(false);
    expect(isPreviewAuthorized(null, "s3cret")).toBe(false);
    expect(isPreviewAuthorized(undefined, "s3cret")).toBe(false);
  });

  it("never authorizes when no secret is configured", () => {
    expect(isPreviewAuthorized("", "")).toBe(false);
    expect(isPreviewAuthorized("", undefined)).toBe(false);
    expect(isPreviewAuthorized("   ", "   ")).toBe(false);
  });

  it("rejects repeated params", () => {
    expect(isPreviewAuthorized(["s3cret", "s3cret"], "s3cret")).toBe(false);
  });
});
