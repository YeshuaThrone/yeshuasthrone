/**
 * "The origin" — the Josué Thé Truth era, kept distinct from Yeshua Throne
 * releases. Static list; add an entry here to extend the archive.
 */

export interface ArchiveEntry {
  id: string;
  title: string;
  /** Name the work was released under. */
  alias: string;
  /** Free text: a year when known, otherwise an era label. */
  year: string;
  youtubeId: string;
  credit: string | null;
}

export const archive: readonly ArchiveEntry[] = [
  {
    id: "dreams",
    title: "Dreams (Official Video)",
    alias: "Josué Thé Truth",
    year: "earlier era",
    youtubeId: "0vNAxj-xvZs",
    credit: "Dir. Blurry Vision Filmz",
  },
];
