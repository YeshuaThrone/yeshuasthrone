import { describe, expect, it, vi } from "vitest";
import { handleRevalidate, isRevalidateAuthorized, parseSlug, pathsFor } from "./handler";

const deps = () => ({ secret: "s3cret", revalidatePath: vi.fn() });

describe("isRevalidateAuthorized", () => {
  it("requires a configured, exact secret", () => {
    expect(isRevalidateAuthorized("s3cret", "s3cret")).toBe(true);
    expect(isRevalidateAuthorized("nope", "s3cret")).toBe(false);
    expect(isRevalidateAuthorized(null, "s3cret")).toBe(false);
    expect(isRevalidateAuthorized("", "")).toBe(false);
    expect(isRevalidateAuthorized("x", undefined)).toBe(false);
  });
});

describe("parseSlug / pathsFor", () => {
  it("accepts a missing body, an empty object, and a kebab slug", () => {
    expect(parseSlug(undefined)).toEqual({ ok: true });
    expect(parseSlug({})).toEqual({ ok: true });
    expect(parseSlug({ slug: "champion" })).toEqual({ ok: true, slug: "champion" });
  });
  it("rejects non-object bodies and bad slugs", () => {
    expect(parseSlug("champion")).toEqual({ ok: false });
    expect(parseSlug({ slug: 42 })).toEqual({ ok: false });
    expect(parseSlug({ slug: "../etc" })).toEqual({ ok: false });
  });
  it("always touches home, the index and the sitemap", () => {
    expect(pathsFor(undefined)).toEqual(["/", "/music", "/sitemap.xml"]);
    expect(pathsFor("champion")).toEqual(["/", "/music", "/sitemap.xml", "/music/champion"]);
  });
});

describe("handleRevalidate", () => {
  it("401s without touching the cache", () => {
    const d = deps();
    const result = handleRevalidate(null, {}, d);
    expect(result).toEqual({
      status: 401,
      body: { error: "Invalid or missing secret.", code: "unauthorized" },
    });
    expect(d.revalidatePath).not.toHaveBeenCalled();
  });

  it("400s on a malformed body", () => {
    const d = deps();
    expect(handleRevalidate("s3cret", { slug: 1 }, d).status).toBe(400);
    expect(d.revalidatePath).not.toHaveBeenCalled();
  });

  it("revalidates every path and reports them", () => {
    const d = deps();
    const result = handleRevalidate("s3cret", { slug: "champion" }, d);
    expect(result).toEqual({
      status: 200,
      body: { revalidated: true, paths: ["/", "/music", "/sitemap.xml", "/music/champion"] },
    });
    expect(d.revalidatePath.mock.calls.map((c) => c[0])).toEqual([
      "/",
      "/music",
      "/sitemap.xml",
      "/music/champion",
    ]);
  });
});
