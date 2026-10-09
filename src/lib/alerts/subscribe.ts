import "server-only";

import { z } from "zod";
import type { SubscribeResult } from "@/components/types";
import type { DbClient } from "@/lib/db/server";
import type { RateLimiter } from "@/lib/rate-limit";

/**
 * Drop-alert signup, with every side effect injected so the whole decision
 * tree is unit-testable. `src/app/actions/subscribe.ts` is the `'use server'`
 * wrapper that supplies the real headers, limiter and service client.
 *
 * Order matters:
 *   1. honeypot  — bots get a fake success and no row, no rate-limit hit
 *   2. validate  — a bad address is the fan's to fix, so it never counts
 *   3. rate limit — 5 attempts per IP per 10 minutes
 *   4. insert    — service role; the anon role cannot touch drop_alerts
 */

export const SUBSCRIBE_RATE_LIMIT = { max: 5, windowMs: 10 * 60_000 } as const;

/** Postgres unique_violation: the email is already on the list. */
const UNIQUE_VIOLATION = "23505";

const Email = z.string().trim().toLowerCase().pipe(z.email().max(254));
/** Hidden field set by the form; a malformed one is not the fan's fault. */
const Source = z.string().trim().min(1).max(64).catch("site");

export interface SubscribeDeps {
  /** Resolves the caller's address; the rate-limit key. */
  clientIp: () => Promise<string>;
  limiter: RateLimiter;
  /** Lazy so a half-configured deploy fails inside the try, not at import. */
  db: () => DbClient;
}

export interface SubscribeInput {
  email: string;
  source: string;
  /** Honeypot; anything non-empty means a bot filled the hidden field. */
  website: string;
}

export function readSubscribeInput(formData: FormData): SubscribeInput {
  const text = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };
  return { email: text("email"), source: text("source"), website: text("website") };
}

export async function subscribeWithDeps(
  formData: FormData,
  deps: SubscribeDeps,
): Promise<SubscribeResult> {
  const input = readSubscribeInput(formData);

  // Bots fill every field. Pretend it worked so they move on; keep the list clean.
  if (input.website.length > 0) return { ok: true, state: "created" };

  const email = Email.safeParse(input.email);
  if (!email.success) return { ok: false, code: "invalid_email" };
  const source = Source.parse(input.source);

  try {
    const verdict = deps.limiter.hit(`subscribe:${await deps.clientIp()}`);
    if (!verdict.allowed) return { ok: false, code: "rate_limited" };

    const { error } = await deps
      .db()
      .from("drop_alerts")
      .insert({ email: email.data, source });

    if (error?.code === UNIQUE_VIOLATION) return { ok: true, state: "already_subscribed" };
    if (error) {
      console.error(`[alerts] subscribe insert failed: ${error.code ?? "?"} ${error.message}`);
      return { ok: false, code: "server_error" };
    }
    return { ok: true, state: "created" };
  } catch (cause) {
    // A thrown client factory or network failure must never reach the fan as a 500.
    console.error("[alerts] subscribe failed:", cause);
    return { ok: false, code: "server_error" };
  }
}
