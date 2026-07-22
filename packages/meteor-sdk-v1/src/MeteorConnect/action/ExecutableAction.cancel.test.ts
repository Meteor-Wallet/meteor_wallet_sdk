import { describe, expect, it } from "bun:test";
import { ExecutableAction } from "./ExecutableAction";

function createAction(): ExecutableAction<any> {
  const meteorConnect = {
    mobileBridgeClient: {
      releaseSession: async (session: { dispose(): Promise<void> }) => session.dispose(),
    },
  };
  return new ExecutableAction(
    {
      id: "near::sign_in",
      input: { target: { blockchain: "near", network: "testnet" } },
    },
    { target: { blockchain: "near", network: "testnet" } },
    meteorConnect as any,
    { allExecutionTargets: [{ executionTarget: "test" }] },
  );
}

describe("ExecutableAction cancellation", () => {
  it("rejects the local request when a committed mobile bridge can no longer be cancelled", async () => {
    const action = createAction();
    let disposeCalls = 0;
    (action as any).preparedMobileSession = {
      isCommitted: () => true,
      dispose: async () => {
        disposeCalls += 1;
      },
    };
    const localResult = action.waitForExecutionOutput().then(
      () => undefined,
      (error) => error,
    );

    await action.cancelAction();
    expect((await localResult)?.message).toBe("Action was cancelled");
    await action.disposePreparedMobileSession();

    expect(disposeCalls).toBe(1);
  });

  it("rejects locally without waiting for a slow remote bridge cancellation", async () => {
    const action = createAction();
    let finishRemoteCancellation!: () => void;
    const remoteCancellation = new Promise<"cancelled_before_commit">((resolve) => {
      finishRemoteCancellation = () => resolve("cancelled_before_commit");
    });
    (action as any).preparedMobileSession = {
      isCommitted: () => false,
      cancel: () => remoteCancellation,
      dispose: async () => {},
    };
    const localResult = action.waitForExecutionOutput().then(
      () => undefined,
      (error) => error,
    );

    const cancellation = action.cancelAction();
    expect((await localResult)?.message).toBe("Action was cancelled");
    finishRemoteCancellation();
    await cancellation;
  });
});
