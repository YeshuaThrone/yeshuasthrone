/**
 * A tiny, pure evaluator for the slice of PostgREST that `queries.ts` uses:
 * `eq` filters, multi-column `order` with nulls placement, `limit`, and
 * single-row shaping. The in-memory shim runs fixture rows through it when
 * TEST_FIXTURES=1 so the pages can be exercised end-to-end with no database.
 */

export interface EqFilter {
  column: string;
  value: unknown;
}

export interface OrderSpec {
  column: string;
  ascending: boolean;
  nullsFirst: boolean;
}

export interface QueryPlan {
  filters: EqFilter[];
  orders: OrderSpec[];
  limit: number | null;
}

export const emptyPlan: QueryPlan = { filters: [], orders: [], limit: null };

type Row = Record<string, unknown>;

function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  return String(a) < String(b) ? -1 : 1;
}

/** Postgres semantics: nulls are placed, not compared. */
function compareBy(order: OrderSpec, a: Row, b: Row): number {
  const av = a[order.column];
  const bv = b[order.column];
  const aNull = av === null || av === undefined;
  const bNull = bv === null || bv === undefined;
  if (aNull && bNull) return 0;
  if (aNull) return order.nullsFirst ? -1 : 1;
  if (bNull) return order.nullsFirst ? 1 : -1;
  const cmp = compareValues(av, bv);
  return order.ascending ? cmp : -cmp;
}

export function runQuery<R extends Row>(rows: readonly R[], plan: QueryPlan): R[] {
  let out = rows.filter((row) =>
    plan.filters.every((filter) => row[filter.column] === filter.value),
  );
  if (plan.orders.length > 0) {
    out = [...out].sort((a, b) => {
      for (const order of plan.orders) {
        const cmp = compareBy(order, a, b);
        if (cmp !== 0) return cmp;
      }
      return 0;
    });
  }
  if (plan.limit !== null) out = out.slice(0, plan.limit);
  return out;
}
