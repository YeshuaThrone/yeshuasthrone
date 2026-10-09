import type { Metadata } from "next";
import { subscribe } from "@/app/actions/subscribe";
import { DropAlertForm } from "@/components/alerts/DropAlertForm";

/**
 * Dev-only: the drop-alert form wired to the real `subscribe()` action, so
 * the end-to-end path (validation, honeypot, rate limit, insert) can be
 * exercised before the home page lands. Not linked from navigation and
 * excluded from indexing.
 */
export const metadata: Metadata = {
  title: "Drop alerts — dev",
  robots: { index: false, follow: false },
};

export default function DevAlertsPage() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-24">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
        dev · drop alerts · live action
      </p>
      <h1 className="text-4xl font-semibold tracking-tight">CHAMPION drops here first.</h1>
      <DropAlertForm
        caption="Get the alert when CHAMPION drops"
        source="dev:alerts"
        onSubmit={subscribe}
      />
    </section>
  );
}
