import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import type { Result } from "axe-core";

/** Impacts that fail the spec's accessibility gate. */
const BLOCKING_IMPACTS = new Set<Result["impact"]>(["serious", "critical"]);

/**
 * Serious/critical axe violations on the current page — the spec's gate for
 * every public route. Minor/moderate findings are surfaced by Lighthouse's
 * accessibility score instead of failing a flow test.
 */
export async function blockingViolations(page: Page): Promise<Result[]> {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations.filter((violation) => BLOCKING_IMPACTS.has(violation.impact));
}

/** Compact, readable shape for the assertion message when a sweep fails. */
export function describeViolations(violations: Result[]): string[] {
  return violations.map(
    (v) => `${v.impact}: ${v.id} — ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`,
  );
}
