/**
 * Rate limiting behind a small interface so the store can change without
 * touching callers. v1 ships an in-memory sliding log; a shared store
 * (Upstash, Postgres) can implement the same `RateLimiter` later.
 *
 * Limitation of the in-memory implementation: the log lives in one Node
 * process. On a serverless host each instance keeps its own counts, so the
 * effective limit is per-instance, not global. Good enough to blunt a naive
 * form-spammer; not a security boundary.
 */

export interface RateLimitPolicy {
  /** Hits allowed per window. */
  max: number;
  windowMs: number;
}

export interface RateLimitVerdict {
  allowed: boolean;
  /** Hits left in the window after this one (0 when blocked). */
  remaining: number;
  /** Seconds until the oldest counted hit leaves the window; 0 when allowed. */
  retryAfterSec: number;
}

export interface RateLimiter {
  /** Records a hit for `key` if allowed and reports the verdict. */
  hit(key: string): RateLimitVerdict;
}

/** Keys with no live hits are swept once the map grows past this size. */
const SWEEP_THRESHOLD = 1_000;

/**
 * Sliding-log limiter: keeps the timestamps of allowed hits per key and
 * counts those inside the trailing window. Blocked hits are not recorded,
 * so a client that keeps retrying is not pushed further out.
 */
export function createMemoryRateLimiter(
  policy: RateLimitPolicy,
  now: () => number = Date.now,
): RateLimiter {
  const log = new Map<string, number[]>();

  function liveHits(key: string, at: number): number[] {
    const cutoff = at - policy.windowMs;
    const hits = (log.get(key) ?? []).filter((t) => t > cutoff);
    return hits;
  }

  function sweep(at: number) {
    for (const key of log.keys()) {
      if (liveHits(key, at).length === 0) log.delete(key);
    }
  }

  return {
    hit(key) {
      const at = now();
      const hits = liveHits(key, at);
      if (hits.length >= policy.max) {
        const oldest = hits[0];
        return {
          allowed: false,
          remaining: 0,
          retryAfterSec: Math.max(1, Math.ceil((oldest + policy.windowMs - at) / 1000)),
        };
      }
      hits.push(at);
      log.set(key, hits);
      if (log.size > SWEEP_THRESHOLD) sweep(at);
      return { allowed: true, remaining: policy.max - hits.length, retryAfterSec: 0 };
    },
  };
}

/**
 * Best-effort client address from proxy headers. `x-forwarded-for` lists
 * hops client-first; Vercel and most proxies append, so the first hop is the
 * client. Falls back to `x-real-ip`, then a shared "unknown" bucket so an
 * unproxied deploy still has *some* limit rather than none.
 */
export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const firstHop = forwarded?.split(",")[0]?.trim();
  if (firstHop) return firstHop;
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}
