import { createClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "./types";

/**
 * RLS contract against a real local Supabase (`supabase start` + migration
 * + seed). Skipped unless SUPABASE_TEST_URL is set:
 *
 *   SUPABASE_TEST_URL=http://127.0.0.1:54321 \
 *   SUPABASE_TEST_ANON_KEY=... SUPABASE_TEST_SERVICE_ROLE_KEY=... \
 *   npm run test:integration
 *
 * The anon role is exactly what a fan's browser or the public read path
 * gets. Any assertion here failing means a draft or a subscriber leaked.
 */

const url = process.env.SUPABASE_TEST_URL;
const anonKey = process.env.SUPABASE_TEST_ANON_KEY;
const serviceKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
const configured = Boolean(url && anonKey && serviceKey);

const options = { auth: { persistSession: false, autoRefreshToken: false } };

// Built only when configured: createClient throws on an empty URL, and a
// skipped describe block still evaluates its body.
function clients() {
  if (!url || !anonKey || !serviceKey) throw new Error("SUPABASE_TEST_* unset");
  return {
    anon: createClient<Database>(url, anonKey, options),
    service: createClient<Database>(url, serviceKey, options),
  };
}

describe.skipIf(!configured)("RLS (anon vs service role)", () => {
  const { anon, service } = configured
    ? clients()
    : ({} as ReturnType<typeof clients>);

  beforeAll(async () => {
    // Guard against a database that was started but never seeded.
    const { data, error } = await service
      .from("releases")
      .select("slug")
      .in("slug", ["champion", "draft-fixture"]);
    if (error) throw error;
    const slugs = (data ?? []).map((r) => r.slug).sort();
    if (slugs.join(",") !== "champion,draft-fixture") {
      throw new Error(
        `Seed missing: expected champion + draft-fixture, found [${slugs.join(", ")}]. Run supabase db reset.`,
      );
    }
  });

  it("anon sees CHAMPION (published) with no tracks", async () => {
    const { data, error } = await anon
      .from("releases")
      .select("slug, title, type, release_date, published, featured, dsp_links, tracks(*)")
      .eq("slug", "champion")
      .maybeSingle();
    expect(error).toBeNull();
    expect(data).toMatchObject({
      slug: "champion",
      title: "CHAMPION",
      type: "album",
      release_date: null,
      published: true,
      featured: true,
      dsp_links: {},
      tracks: [],
    });
  });

  it("anon cannot see the unpublished draft-fixture", async () => {
    const { data, error } = await anon
      .from("releases")
      .select("slug")
      .eq("slug", "draft-fixture")
      .maybeSingle();
    expect(error).toBeNull();
    expect(data).toBeNull();

    const all = await anon.from("releases").select("slug, published");
    expect(all.error).toBeNull();
    expect(all.data?.every((r) => r.published)).toBe(true);
    expect(all.data?.map((r) => r.slug)).not.toContain("draft-fixture");
  });

  it("anon cannot see tracks of an unpublished release", async () => {
    const { data, error } = await anon.from("tracks").select("title");
    expect(error).toBeNull();
    expect(data?.map((t) => t.title)).not.toContain("Draft Track");
  });

  it("service role sees the draft and its track (preview path)", async () => {
    const { data, error } = await service
      .from("releases")
      .select("slug, published, tracks(title)")
      .eq("slug", "draft-fixture")
      .single();
    expect(error).toBeNull();
    expect(data).toMatchObject({
      slug: "draft-fixture",
      published: false,
      tracks: [{ title: "Draft Track" }],
    });
  });

  it("anon cannot select drop_alerts (no policy -> empty, never a row)", async () => {
    // Plant a subscriber with the service role, then prove anon cannot read it.
    const email = `rls-${Date.now()}@example.com`;
    const planted = await service.from("drop_alerts").insert({ email, source: "test" });
    expect(planted.error).toBeNull();

    const { data, error } = await anon.from("drop_alerts").select("email");
    // Either RLS returns zero rows or PostgREST denies; both are acceptable.
    // What is never acceptable is a row.
    expect(error === null ? data : []).toEqual([]);

    await service.from("drop_alerts").delete().eq("email", email);
  });

  it("anon cannot insert into releases", async () => {
    const { error } = await anon
      .from("releases")
      .insert({ slug: `anon-${Date.now()}`, title: "Nope" });
    expect(error).not.toBeNull();
    // 42501 = insufficient_privilege (RLS violation).
    expect(error?.code).toBe("42501");
  });

  it("anon cannot insert into drop_alerts", async () => {
    const { error } = await anon
      .from("drop_alerts")
      .insert({ email: `anon-${Date.now()}@example.com` });
    expect(error).not.toBeNull();
    expect(error?.code).toBe("42501");
  });

  it("releases.updated_at advances on update", async () => {
    const before = await service
      .from("releases")
      .select("updated_at")
      .eq("slug", "draft-fixture")
      .single();
    expect(before.error).toBeNull();

    const bumped = await service
      .from("releases")
      .update({ sort_order: Math.floor(Math.random() * 1000) })
      .eq("slug", "draft-fixture")
      .select("updated_at")
      .single();
    expect(bumped.error).toBeNull();
    expect(new Date(bumped.data?.updated_at ?? 0).getTime()).toBeGreaterThan(
      new Date(before.data?.updated_at ?? 0).getTime(),
    );
  });

  it("storage buckets artwork and audio exist and are public", async () => {
    const { data, error } = await service.storage.listBuckets();
    expect(error).toBeNull();
    const byId = Object.fromEntries((data ?? []).map((b) => [b.id, b.public]));
    expect(byId).toMatchObject({ artwork: true, audio: true });
  });
});
