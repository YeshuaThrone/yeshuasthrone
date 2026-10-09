"use server";

import { headers } from "next/headers";
import type { SubscribeResult } from "@/components/types";
import { SUBSCRIBE_RATE_LIMIT, subscribeWithDeps } from "@/lib/alerts/subscribe";
import { createServiceClient } from "@/lib/db/server";
import { clientIpFromHeaders, createMemoryRateLimiter } from "@/lib/rate-limit";

export type { SubscribeResult };

/** One limiter per server process; see rate-limit.ts for the per-instance caveat. */
const limiter = createMemoryRateLimiter(SUBSCRIBE_RATE_LIMIT);

/**
 * Drop-alert signup. Pass directly as `<DropAlertForm onSubmit={subscribe} />`.
 * Never throws to the client: every failure is a typed `SubscribeResult`.
 */
export async function subscribe(formData: FormData): Promise<SubscribeResult> {
  return subscribeWithDeps(formData, {
    clientIp: async () => clientIpFromHeaders(await headers()),
    limiter,
    db: createServiceClient,
  });
}
