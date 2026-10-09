/** Pure helpers for the home-page teaser cards. */

/** The first `count` sentences of the bio, so the teaser tracks copy edits with no component change. */
export function storyTeaser(paragraphs: readonly string[], count = 2): string {
  const sentences = paragraphs
    .join(" ")
    .match(/[^.!?]+[.!?]+/g)
    ?.map((sentence) => sentence.trim());
  return sentences ? sentences.slice(0, count).join(" ") : (paragraphs[0] ?? "");
}
