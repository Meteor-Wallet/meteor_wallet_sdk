import { describe, expect, it } from "bun:test";
import { MobileBridgeSession } from "./MobileBridgeSession";

function createSession(
  pushWallet?: unknown,
  disconnectBridge = async () => {},
): MobileBridgeSession {
  return new MobileBridgeSession({
    token: "test-session",
    client: { disconnect_bridge: disconnectBridge },
    prepared: {},
    meteorAppId: "meteor_wallet_mobile_dev",
    pushWallet,
    buildConnection: () => ({}),
    isCurrent: () => true,
    assertIdentityGeneration: async () => {},
    acquireFirstPairingLease: async () => ({}),
    registerLiveSession: async () => ({ stop: async () => {} }),
  } as any);
}

describe("MobileBridgeSession push presentation state", () => {
  it("starts in sending state when a paired wallet will receive a push", () => {
    expect(createSession({ walletVerifyPublicKey: {} }).getSnapshot().push).toBe("sending");
  });

  it("does not claim to be sending a push during first-time QR pairing", () => {
    expect(createSession().getSnapshot().push).toBe("not_attempted");
  });

  it("settles an abandoned result and disposes the bridge only once", async () => {
    let disconnectCalls = 0;
    const session = createSession(undefined, async () => {
      disconnectCalls += 1;
    });
    const result = session.awaitResult().then(
      () => undefined,
      (error) => error,
    );

    await Promise.all([session.dispose(), session.dispose()]);

    expect((await result)?.message).toBe("mobile_bridge_session_disposed");
    expect(disconnectCalls).toBe(1);
  });
});
