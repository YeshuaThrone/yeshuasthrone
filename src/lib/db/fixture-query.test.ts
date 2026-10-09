import { describe, expect, it } from "vitest";
import { emptyPlan, runQuery } from "./fixture-query";

const rows = [
  { slug: "a", published: true, release_date: "2026-06-12", sort_order: 0 },
  { slug: "b", published: false, release_date: "2020-01-01", sort_order: 0 },
  { slug: "c", published: true, release_date: null, sort_order: 0 },
  { slug: "d", published: true, release_date: "2027-03-14", sort_order: 0 },
];

describe("runQuery", () => {
  it("applies every eq filter", () => {
    const out = runQuery(rows, { ...emptyPlan, filters: [{ column: "published", value: true }] });
    expect(out.map((r) => r.slug)).toEqual(["a", "c", "d"]);
    expect(
      runQuery(rows, {
        ...emptyPlan,
        filters: [
          { column: "published", value: true },
          { column: "slug", value: "d" },
        ],
      }).map((r) => r.slug),
    ).toEqual(["d"]);
  });

  it("orders descending with nulls first, then applies the limit", () => {
    const out = runQuery(rows, {
      ...emptyPlan,
      orders: [{ column: "release_date", ascending: false, nullsFirst: true }],
    });
    expect(out.map((r) => r.slug)).toEqual(["c", "d", "a", "b"]);

    const limited = runQuery(rows, {
      ...emptyPlan,
      orders: [{ column: "release_date", ascending: true, nullsFirst: false }],
      limit: 2,
    });
    expect(limited.map((r) => r.slug)).toEqual(["b", "a"]);
  });

  it("breaks ties on later order columns", () => {
    const tied = [
      { slug: "x", release_date: null, sort_order: 1 },
      { slug: "y", release_date: null, sort_order: 5 },
    ];
    const out = runQuery(tied, {
      ...emptyPlan,
      orders: [
        { column: "release_date", ascending: false, nullsFirst: true },
        { column: "sort_order", ascending: false, nullsFirst: false },
      ],
    });
    expect(out.map((r) => r.slug)).toEqual(["y", "x"]);
  });
});
