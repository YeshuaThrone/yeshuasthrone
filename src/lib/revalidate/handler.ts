/**
 * Pure core of POST /api/revalidate so it can be unit-tested without Next's
 * cache runtime: the route injects `revalidatePath`.
 */

export const REVALIDATE_HEADER = "x-revalidate-secret";

export type RevalidateResult =
  | { status: 200; body: { revalidated: true; paths: string[] } }
  | { status: 400 | 401; body: { error: string; code: "unauthorized" | "invalid_body" } };

export interface RevalidateDeps {
  secret: string | undefined;
  revalidatePath: (path: string) => void;
}

/** A secret must be configured, non-blank, and match exactly. */
export function isRevalidateAuthorized(
  supplied: string | null,
  secret: string | undefined,
): boolean {
  if (typeof secret !== "string" || secret.trim().length === 0) return false;
  return supplied === secret;
}

/** The paths one revalidation touches: home, the index, and the release when named. */
export function pathsFor(slug: string | undefined): string[] {
  const paths = ["/", "/music"];
  if (slug) paths.push(`/music/${slug}`);
  return paths;
}

/** Only `{ slug?: string }` is accepted; an empty or missing body means "no slug". */
export function parseSlug(body: unknown): { ok: true; slug?: string } | { ok: false } {
  if (body === null || body === undefined) return { ok: true };
  if (typeof body !== "object") return { ok: false };
  const slug = (body as { slug?: unknown }).slug;
  if (slug === undefined || slug === null) return { ok: true };
  if (typeof slug !== "string" || !/^[a-z0-9-]{1,128}$/.test(slug)) return { ok: false };
  return { ok: true, slug };
}

export function handleRevalidate(
  suppliedSecret: string | null,
  body: unknown,
  deps: RevalidateDeps,
): RevalidateResult {
  if (!isRevalidateAuthorized(suppliedSecret, deps.secret)) {
    return { status: 401, body: { error: "Invalid or missing secret.", code: "unauthorized" } };
  }
  const parsed = parseSlug(body);
  if (!parsed.ok) {
    return {
      status: 400,
      body: { error: "Body must be JSON with an optional kebab-case slug.", code: "invalid_body" },
    };
  }
  const paths = pathsFor(parsed.slug);
  for (const path of paths) deps.revalidatePath(path);
  return { status: 200, body: { revalidated: true, paths } };
}
