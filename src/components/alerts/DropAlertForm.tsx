"use client";

import { useId, useState, type FormEvent } from "react";
import type { SubscribeResult } from "@/components/types";

type FormState =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "created" }
  | { phase: "already_subscribed" }
  | { phase: "rate_limited" }
  | { phase: "error" };

interface DropAlertFormProps {
  /** e.g. "Get the alert when CHAMPION drops" */
  caption: string;
  /** Where the signup came from: 'home' | 'release:<slug>' | 'story'. */
  source: string;
  /** The `subscribe()` server action, or a stub in tests and the dev page. */
  onSubmit: (formData: FormData) => Promise<SubscribeResult>;
}

/** Maps the action's result to the UI state. Pure so it can be unit-tested. */
export function stateFromResult(result: SubscribeResult): FormState {
  if (result.ok) return { phase: result.state };
  if (result.code === "rate_limited") return { phase: "rate_limited" };
  return { phase: "error" };
}

const MESSAGE: Record<Exclude<FormState["phase"], "idle" | "submitting">, string> = {
  created: "You're on the list. You'll hear it here first.",
  already_subscribed: "You're already on the list.",
  rate_limited: "Too many tries. Give it a few minutes and try again.",
  error: "Something went wrong on our side. Try again.",
};

export function DropAlertForm({ caption, source, onSubmit }: DropAlertFormProps) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>({ phase: "idle" });
  const emailId = useId();
  const statusId = useId();

  const done = state.phase === "created" || state.phase === "already_subscribed";
  const busy = state.phase === "submitting";
  const failed = state.phase === "rate_limited" || state.phase === "error";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setState({ phase: "submitting" });
    try {
      setState(stateFromResult(await onSubmit(formData)));
    } catch {
      // A thrown action is a failed submit, not a crash: keep the email, let them retry.
      setState({ phase: "error" });
    }
  }

  if (done) {
    return (
      <p role="status" className="text-base text-text" data-state={state.phase}>
        <span className="mr-2 font-mono text-xs uppercase tracking-[0.3em] text-gold">
          Locked in
        </span>
        {MESSAGE[state.phase]}
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex w-full max-w-md flex-col gap-3"
      aria-describedby={failed ? statusId : undefined}
      data-state={state.phase}
    >
      <label htmlFor={emailId} className="text-sm text-muted">
        {caption}
      </label>
      <input type="hidden" name="source" value={source} />
      {/* Honeypot: hidden from people and assistive tech; bots fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${emailId}-website`}>Website</label>
        <input
          id={`${emailId}-website`}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>
      <div className="flex gap-2">
        <input
          id={emailId}
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
          aria-invalid={failed || undefined}
          className="min-w-0 flex-1 rounded-full border border-text/15 bg-ink px-4 py-2.5 text-base text-text placeholder:text-muted/60 transition-colors hover:border-text/30 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-full bg-electric px-5 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-electric-2 hover:text-onyx disabled:opacity-60"
        >
          {busy ? "Joining…" : "Join the list"}
        </button>
      </div>
      {failed ? (
        <p id={statusId} role="alert" className="text-sm text-muted">
          {MESSAGE[state.phase]}
        </p>
      ) : null}
    </form>
  );
}
