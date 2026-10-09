/**
 * Preview-mode authorization: `/music/<slug>?preview=<PREVIEW_SECRET>`.
 * Pure so the page and its tests share one rule.
 */

export const PREVIEW_PARAM = "preview";

/** True only when a secret is configured, non-blank, and matches exactly. */
export function isPreviewAuthorized(
  supplied: string | string[] | null | undefined,
  secret: string | undefined,
): boolean {
  if (typeof supplied !== "string" || supplied.length === 0) return false;
  if (typeof secret !== "string" || secret.trim().length === 0) return false;
  return supplied === secret;
}
