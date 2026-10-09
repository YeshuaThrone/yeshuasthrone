import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReleaseWithTracksRow } from "./types";

/**
 * Drives queries.ts against a scripted fake client: each call records the
 * filter chain it received and resolves the next queued response. Proves
 * the published filter, the preview -> service-client switch, the featured
 * fallback, and the "errors become empty" contract without a network.
 */

type Call = { filters: Record<string, unknown>; orders: string[]; single: boolean };
type Response = { data: unknown; error: { message: string; code?: string } | null };

function fakeClient(responses: Response[]) {
  const calls: Call[] = [];
  const builder = () => {
    const call: Call = { filters: {}, orders: [], single: false };
    calls.push(call);
    const q = {
      select: () => q,
      eq: (col: string, val: unknown) => ((call.filters[col] = val), q),
      order: (col: string) => (call.orders.push(col), q),
      limit: () => q,
      maybeSingle: () => ((call.single = true), q),
      then: (resolve: (r: Response) => unknown) =>
        Promise.resolve(responses.shift() ?? { data: null, error: null }).then(resolve),
    };
    return q;
  };
  return { client: { from: () => builder() }, calls };
}

const mocks = vi.hoisted(() => ({
  anon: vi.fn(),
  service: vi.fn(),
}));

vi.mock("./server", () => ({
  createAnonClient: mocks.anon,
  createServiceClient: mocks.service,
  readDbEnv: () => ({ url: null, anonKey: null, serviceRoleKey: null }),
  storagePublicBase: () => null,
}));

const row = (overrides: Partial<ReleaseWithTracksRow>): ReleaseWithTracksRow => ({
  id: "r1",
  slug: "champion",
  title: "CHAMPION",
  type: "album",
  description: null,
  release_date: null,
  artwork_path: null,
  artwork_url: null,
  covnant_cbt_code: null,
  covnant_url: null,
  dsp_links: {},
  meta: {},
  published: true,
  featured: true,
  sort_order: 0,
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
  tracks: [],
  ...overrides,
});

describe("queries", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    mocks.anon.mockReset();
    mocks.service.mockReset();
  });

  it("getPublishedReleases filters on published and orders newest first", async () => {
    const { client, calls } = fakeClient([{ data: [row({})], error: null }]);
    mocks.anon.mockReturnValue(client);
    const { getPublishedReleases } = await import("./queries");

    const releases = await getPublishedReleases();
    expect(releases.map((r) => [r.slug, r.status])).toEqual([["champion", "upcoming"]]);
    expect(calls[0].filters).toEqual({ published: true });
    expect(calls[0].orders).toEqual(["release_date", "sort_order", "created_at"]);
  });

  it("getPublishedReleases returns [] on a database error", async () => {
    const { client } = fakeClient([{ data: null, error: { message: "boom", code: "500" } }]);
    mocks.anon.mockReturnValue(client);
    const { getPublishedReleases } = await import("./queries");
    expect(await getPublishedReleases()).toEqual([]);
    expect(console.error).toHaveBeenCalledOnce();
  });

  it("getReleaseBySlug uses anon + published filter by default", async () => {
    const { client, calls } = fakeClient([{ data: null, error: null }]);
    mocks.anon.mockReturnValue(client);
    const { getReleaseBySlug } = await import("./queries");

    expect(await getReleaseBySlug("draft-fixture")).toBeNull();
    expect(mocks.service).not.toHaveBeenCalled();
    expect(calls[0]).toMatchObject({ filters: { slug: "draft-fixture", published: true }, single: true });
  });

  it("getReleaseBySlug preview uses the service client and ignores published", async () => {
    const { client, calls } = fakeClient([
      { data: row({ slug: "draft-fixture", published: false, release_date: "2020-01-01" }), error: null },
    ]);
    mocks.service.mockReturnValue(client);
    const { getReleaseBySlug } = await import("./queries");

    const release = await getReleaseBySlug("draft-fixture", { preview: true });
    expect(release?.status).toBe("released");
    expect(mocks.anon).not.toHaveBeenCalled();
    expect(calls[0].filters).toEqual({ slug: "draft-fixture" });
  });

  it("getFeaturedRelease prefers featured, then falls back to newest published", async () => {
    const { client, calls } = fakeClient([
      { data: null, error: null }, // no featured row
      { data: row({ slug: "dreams-ii", featured: false, release_date: "2026-01-01" }), error: null },
    ]);
    mocks.anon.mockReturnValue(client);
    const { getFeaturedRelease } = await import("./queries");

    const release = await getFeaturedRelease();
    expect(release?.slug).toBe("dreams-ii");
    expect(calls[0].filters).toEqual({ published: true, featured: true });
    expect(calls[1].filters).toEqual({ published: true });
  });
});
