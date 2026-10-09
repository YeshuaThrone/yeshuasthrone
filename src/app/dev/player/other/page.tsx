import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Player harness — other page",
  robots: { index: false, follow: false },
};

/** Second route for the player harness: audio must keep playing after arriving here. */
export default function DevPlayerOtherPage() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">dev</p>
      <h1 className="text-3xl font-semibold tracking-tight">Other page</h1>
      <p className="max-w-xl text-muted">
        If the player is still playing, navigation did not remount the audio element.
      </p>
      <p>
        <Link
          href="/dev/player"
          className="text-electric-2 underline underline-offset-4 hover:text-text"
        >
          Back to the harness
        </Link>
      </p>
    </section>
  );
}
