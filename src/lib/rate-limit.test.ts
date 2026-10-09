import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clientIpFromHeaders, createMemoryRateLimiter } from "./rate-limit";

describe("createMemoryRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-09T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows `max` hits in a window, then blocks until the oldest expires", () => {
    const limiter = createMemoryRateLimiter({ max: 5, windowMs: 10 * 60_000 });

    for (let i = 1; i <= 5; i++) {
      expect(limiter.hit("ip:a")).toEqual({ allowed: true, remaining: 5 - i, retryAfterSec: 0 });
      vi.advanceTimersByTime(1_000);
    }

    const blocked = limiter.hit("ip:a");
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    // First hit was 5 s ago; it leaves the window after 10 min total.
    expect(blocked.retryAfterSec).toBe(595);

    // Just before the first hit expires, still blocked.
    vi.advanceTimersByTime(594_000);
    expect(limiter.hit("ip:a").allowed).toBe(false);

    // Window slides: the first hit ages out and one slot opens.
    vi.advanceTimersByTime(1_001);
    expect(limiter.hit("ip:a")).toMatchObject({ allowed: true, remaining: 0 });
    expect(limiter.hit("ip:a").allowed).toBe(false);
  });

  it("does not count blocked attempts against the window", () => {
    const limiter = createMemoryRateLimiter({ max: 1, windowMs: 1_000 });
    expect(limiter.hit("k").allowed).toBe(true);
    for (let i = 0; i < 20; i++) expect(limiter.hit("k").allowed).toBe(false);
    // Retrying while blocked did not push the reset further out.
    vi.advanceTimersByTime(1_001);
    expect(limiter.hit("k").allowed).toBe(true);
  });

  it("keeps keys independent", () => {
    const limiter = createMemoryRateLimiter({ max: 1, windowMs: 60_000 });
    expect(limiter.hit("a").allowed).toBe(true);
    expect(limiter.hit("a").allowed).toBe(false);
    expect(limiter.hit("b").allowed).toBe(true);
  });

  it("stays correct across a sweep of idle keys", () => {
    const limiter = createMemoryRateLimiter({ max: 1, windowMs: 1_000 });
    for (let i = 0; i < 1_001; i++) limiter.hit(`k${i}`);
    // A live key must survive the sweep that the 1,002nd key triggers.
    vi.advanceTimersByTime(500);
    limiter.hit("live");
    vi.advanceTimersByTime(600);
    limiter.hit("trigger");
    expect(limiter.hit("live").allowed).toBe(false);
    expect(limiter.hit("k0").allowed).toBe(true);
  });
});

describe("clientIpFromHeaders", () => {
  it("takes the first x-forwarded-for hop", () => {
    const h = new Headers({ "x-forwarded-for": " 203.0.113.9 , 10.0.0.1" });
    expect(clientIpFromHeaders(h)).toBe("203.0.113.9");
  });

  it("falls back to x-real-ip, then a shared unknown bucket", () => {
    expect(clientIpFromHeaders(new Headers({ "x-real-ip": "198.51.100.4" }))).toBe(
      "198.51.100.4",
    );
    expect(clientIpFromHeaders(new Headers())).toBe("unknown");
    expect(clientIpFromHeaders(new Headers({ "x-forwarded-for": " , " }))).toBe("unknown");
  });
});
