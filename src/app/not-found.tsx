import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-24">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">404</p>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        Nothing here.
      </h1>
      <p className="max-w-xl text-lg text-muted">
        That page does not exist, or it is not public yet.
      </p>
      <p>
        <Link
          href="/music"
          className="text-electric-2 underline underline-offset-4 hover:text-text"
        >
          Go to the music
        </Link>
      </p>
    </section>
  );
}
