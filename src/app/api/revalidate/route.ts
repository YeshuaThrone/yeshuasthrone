import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { REVALIDATE_HEADER, handleRevalidate } from "@/lib/revalidate/handler";

/**
 * On-demand ISR. Called by a Supabase Database Webhook on `releases`
 * INSERT/UPDATE, or by hand:
 *   curl -X POST -H "x-revalidate-secret: $REVALIDATE_SECRET" \
 *        -d '{"slug":"champion"}' https://<host>/api/revalidate
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => undefined);
  const result = handleRevalidate(request.headers.get(REVALIDATE_HEADER), body, {
    secret: process.env.REVALIDATE_SECRET,
    revalidatePath,
  });
  return NextResponse.json(result.body, { status: result.status });
}
