// Vitest resolves `server-only` to its default (throwing) entry because it
// does not run under the `react-server` export condition. Tests of server
// modules are server code by definition, so alias the marker to a no-op.
export {};
