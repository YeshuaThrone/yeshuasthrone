import { NextResponse, type NextRequest } from "next/server";
import { PREVIEW_PARAM, isPreviewAuthorized } from "@/lib/preview";

/**
 * Preview mode: `/music/<slug>?preview=<PREVIEW_SECRET>` is rewritten to the
 * dynamic `/preview/music/<slug>` route. Doing it here keeps `/music/[slug]`
 * fully static (it never reads search params, so ISR stays intact) and is
 * the one place that can set the `X-Robots-Tag` response header. A wrong or
 * empty secret is ignored: the static page serves as if the param were absent,
 * so a draft is still a 404 and reveals nothing.
 */
export const config = { matcher: ["/music/:slug"] };

export function middleware(request: NextRequest) {
  const supplied = request.nextUrl.searchParams.getAll(PREVIEW_PARAM);
  if (supplied.length === 0) return NextResponse.next();

  const candidate = supplied.length === 1 ? supplied[0] : supplied;
  if (!isPreviewAuthorized(candidate, process.env.PREVIEW_SECRET)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/preview${url.pathname}`;
  const response = NextResponse.rewrite(url);
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
