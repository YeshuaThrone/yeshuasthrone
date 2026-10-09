// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import {
  createAnonClient,
  createServiceClient,
  isInMemoryShim,
  resetClientsForTests,
} from "./server";

/**
 * Regression for the Node < 22 case. jsdom exposes a global WebSocket, so the
 * jsdom suite never sees it; under plain Node, supabase-js builds a
 * RealtimeClient eagerly and throws at createClient() without a transport.
 * The query layer runs under Node on the server and in the integration suite,
 * so constructing a configured client there must not throw.
 */
describe("configured clients under the Node environment", () => {
  afterEach(() => resetClientsForTests());

  it("constructs anon and service clients without a native WebSocket", () => {
    const env = {
      url: "https://example.supabase.co",
      anonKey: "anon",
      serviceRoleKey: "service",
    };
    const anon = createAnonClient(env);
    const service = createServiceClient(env);
    expect(isInMemoryShim(anon)).toBe(false);
    expect(isInMemoryShim(service)).toBe(false);
    expect(typeof anon.from).toBe("function");
  });
});
