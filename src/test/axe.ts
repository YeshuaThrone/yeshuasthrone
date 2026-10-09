import { configureAxe } from "vitest-axe";

/**
 * jsdom has no layout or canvas, so the color-contrast rule cannot run and
 * only logs "Not implemented: getContext"; it also cannot message into
 * iframes, so cross-frame scanning is off. Contrast and embeds are covered
 * by the Playwright + axe run against real pages; unit tests check structure.
 */
export const axe = configureAxe({
  iframes: false,
  rules: { "color-contrast": { enabled: false } },
});
