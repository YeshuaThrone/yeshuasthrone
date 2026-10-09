import type { Metadata } from "next";
import { YouTubeFacade } from "@/components/media/YouTubeFacade";
import { archive, type ArchiveEntry } from "@/content/archive";
import { site } from "@/content/site";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Archive",
  description: `The origin — work from before the ${site.name} name.`,
  path: "/archive",
});

function ArchiveItem({ entry }: { entry: ArchiveEntry }) {
  return (
    <li className="flex flex-col gap-4">
      <YouTubeFacade videoId={entry.youtubeId} title={entry.title} />
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight">{entry.title}</h2>
        <p className="text-sm text-muted">
          <span className="text-text">{entry.alias}</span> · {entry.year}
          {entry.credit ? <> · {entry.credit}</> : null}
        </p>
      </div>
    </li>
  );
}

export default function ArchivePage() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16">
      <header className="flex max-w-2xl flex-col gap-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">The origin</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">Archive</h1>
        <p className="text-lg leading-relaxed text-muted">
          Before {site.name} there was Josué Thé Truth. This is the earlier chapter, kept
          here as it was made. Everything new drops under the {site.name} name, and it
          drops here first.
        </p>
      </header>

      <ul className="grid gap-10 sm:grid-cols-2" aria-label="Archive entries">
        {archive.map((entry) => (
          <ArchiveItem key={entry.id} entry={entry} />
        ))}
      </ul>
    </section>
  );
}
