import { describe, expect, it } from "bun:test";
import type { IMobileBridgeSnapshot } from "../target_clients/mobile_bridge/MobileBridgeSession";
import { ExecutableAction } from "./ExecutableAction";

const SIGNED_IN = {
  identifier: { blockchain: "near", network: "testnet", accountId: "alice.testnet" },
  publicKeys: [],
  connection: { executionTarget: "v2_bridge_mobile" },
};

/**
 * A session that only does what the action observes: emits snapshots, carries a turn, and settles
 * its result independently of the action — exactly as `MobileBridgeSession.collectResult` does.
 */
function createSessionDouble(sdkRequest: { id: string; expandedInput: unknown }) {
  const listeners = new Set<(snapshot: IMobileBridgeSnapshot) => void>();
  let snapshot: IMobileBridgeSnapshot = {
    phase: "waiting_for_wallet",
    push: "not_attempted",
    linkPhase: "live",
    linkRedialAttempt: 0,
    pinAttemptsUsed: 0,
  };
  let receipt: unknown;
  let settle!: { resolve: (value: unknown) => void; reject: (error: unknown) => void };
  const result = new Promise((resolve, reject) => {
    settle = { resolve, reject };
  });
  void result.catch(() => {});
  return {
    prepared: { sdkRequest },
    subscribe(listener: (next: IMobileBridgeSnapshot) => void) {
      listeners.add(listener);
      listener({ ...snapshot });
      return () => listeners.delete(listener);
    },
    getResultReceipt: () => receipt,
    awaitResult: () => result,
    emit(phase: IMobileBridgeSnapshot["phase"]) {
      snapshot = { ...snapshot, phase };
      for (const listener of listeners) listener({ ...snapshot });
    },
    completeWith(output: unknown) {
      this.emit("completed");
      settle.resolve(output);
    },
    declineWith(error: Error) {
      receipt = { bridgeId: "b1" };
      this.emit("failed");
      settle.reject(error);
    },
    failUnanswered(error: Error) {
      this.emit("failed");
      settle.reject(error);
    },
  };
}

function createHarness(options: { staleTurn?: boolean } = {}) {
  let session!: ReturnType<typeof createSessionDouble>;
  let newRequestsPrepared = 0;
  const signedIn: unknown[] = [];
  const mobileBridgeClient = {
    prepareRequest: async (request: { id: string; expandedInput: unknown }) => {
      session = createSessionDouble(
        options.staleTurn
          ? { id: "meteor_wallet_core::transfer_accounts", expandedInput: {} }
          : request,
      );
      return session;
    },
    getCurrentSession: () => session,
    releaseSession: async () => {},
    // Mirrors the real client: only the current session carrying this exact request is adopted;
    // anything else prepares (and would send) a brand-new request.
    makeRequest: async (request: { id: string; expandedInput: unknown }) => {
      const turn = session.prepared.sdkRequest;
      if (turn.id !== request.id || turn.expandedInput !== request.expandedInput) {
        newRequestsPrepared += 1;
        throw new Error("would prepare a new request");
      }
      return session.awaitResult();
    },
  };
  const meteorConnect = {
    mobileBridgeClient,
    getClientByExecutionTargetId: () => mobileBridgeClient,
    addSignedInAccount: async (account: unknown) => {
      signedIn.push(account);
    },
  };
  const target = { blockchain: "near", network: "testnet" };
  const action = new ExecutableAction(
    { id: "near::sign_in", input: { target } } as any,
    { target },
    meteorConnect as any,
    { allExecutionTargets: [{ executionTarget: "v2_bridge_mobile" } as any] },
  );
  const outcome = action.waitForExecutionOutput().then(
    (value) => ({ value }),
    (error: Error) => ({ error }),
  );
  return {
    action,
    outcome,
    signedIn,
    get session() {
      return session;
    },
    get newRequestsPrepared() {
      return newRequestsPrepared;
    },
  };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 10));

describe("ExecutableAction adopting a wallet answer it never saw being made", () => {
  it("resolves when the tab reconnects straight into a completed turn", async () => {
    const harness = createHarness();
    await harness.action.prepareMobileBridge();

    // The backgrounded tab missed `wallet_action` entirely; the session settled on its own.
    harness.session.completeWith(SIGNED_IN);

    expect(await harness.outcome).toEqual({ value: SIGNED_IN });
    expect(harness.signedIn).toEqual([SIGNED_IN]);
  });

  it("delivers a decline the wallet signed while the tab was in the background", async () => {
    const harness = createHarness();
    await harness.action.prepareMobileBridge();

    harness.session.declineWith(new Error("mobile_bridge_wallet_declined: user_rejected"));

    const outcome = (await harness.outcome) as { error?: Error };
    expect(outcome.error?.message).toBe("mobile_bridge_wallet_declined: user_rejected");
  });

  it("does not adopt a failure the wallet never answered", async () => {
    const harness = createHarness();
    await harness.action.prepareMobileBridge();

    harness.session.failUnanswered(new Error("mobile_bridge_expired"));
    await flush();

    // Unanswered failures stay on the panel's failure card; nothing executed for them.
    expect(harness.action.getExecutionState().isExecuting).toBe(false);
  });

  it("never executes from another request's turn on the same session", async () => {
    const harness = createHarness({ staleTurn: true });
    await harness.action.prepareMobileBridge();

    harness.session.emit("external_work");
    harness.session.emit("completed");
    await flush();

    expect(harness.newRequestsPrepared).toBe(0);
    expect(harness.action.getExecutionState().isExecuting).toBe(false);
  });
});
