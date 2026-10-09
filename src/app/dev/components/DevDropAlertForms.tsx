"use client";

import { DropAlertForm } from "@/components/alerts/DropAlertForm";
import type { SubscribeResult } from "@/components/types";

const OUTCOMES: Array<{ label: string; result: SubscribeResult | "throw" }> = [
  { label: "created", result: { ok: true, state: "created" } },
  { label: "already_subscribed", result: { ok: true, state: "already_subscribed" } },
  { label: "rate_limited", result: { ok: false, code: "rate_limited" } },
  { label: "server_error", result: { ok: false, code: "server_error" } },
  { label: "action throws", result: "throw" },
];

function stubSubmit(result: SubscribeResult | "throw") {
  return async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    if (result === "throw") throw new Error("dev: simulated network failure");
    return result;
  };
}

/** One form per outcome so every state is reachable by submitting any email. */
export function DevDropAlertForms() {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      {OUTCOMES.map(({ label, result }) => (
        <div key={label} className="flex flex-col gap-2">
          <p className="font-mono text-xs text-muted">submit → {label}</p>
          <DropAlertForm
            caption="Get the alert when CHAMPION drops"
            source="release:champion"
            onSubmit={stubSubmit(result)}
          />
        </div>
      ))}
    </div>
  );
}
