import "vitest";
import type { AxeMatchers } from "vitest-axe/matchers";

// vitest-axe ships augmentations for the legacy `Vi` namespace only; this
// mirrors jest-dom's Vitest augmentation. The type parameter must match
// Vitest's own `Assertion<T = any>` exactly or the interfaces do not merge.
declare module "vitest" {
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-object-type */
  interface Assertion<T = any> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-object-type */
}
