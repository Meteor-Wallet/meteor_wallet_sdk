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
  it("still sends the phase-safe close for a committed bridge, then disposes once", async () => {
    const action = createAction();
    let disposeCalls = 0;
    let abandonCalls = 0;
    (action as any).preparedMobileSession = {
      // A wallet-held request is no longer walked away from: `abandon` sends the one close verb
      // §5.7 permits for its phase, so nothing is left parked holding a signed result.
      abandon: async () => {
        abandonCalls += 1;
      },
      getExternalWorkHold: () => undefined,
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

    expect(abandonCalls).toBe(1);
    expect(disposeCalls).toBe(1);
  });

  it("rejects locally without waiting for a slow remote bridge close", async () => {
    const action = createAction();
    let finishRemoteClose!: () => void;
    const remoteClose = new Promise<void>((resolve) => {
      finishRemoteClose = () => resolve();
    });
    (action as any).preparedMobileSession = {
      abandon: () => remoteClose,
      getExternalWorkHold: () => undefined,
      dispose: async () => {},
    };
    const localResult = action.waitForExecutionOutput().then(
      () => undefined,
      (error) => error,
    );

    const cancellation = action.cancelAction();
    expect((await localResult)?.message).toBe("Action was cancelled");
    finishRemoteClose();
    await cancellation;
  });

  it("hands a held external-work session to the AddKey window instead of disconnecting it", async () => {
    const action = createAction();
    let disposeCalls = 0;
    let uiObserversReleased = 0;
    action.setTransferTarget({ platform: "web", retainSessionForExternalWork: true });
    (action as any).preparedMobileSession = {
      getExternalWorkHold: () => ({ bridgeId: "b1" }),
      releaseUiObservers: () => {
        uiObserversReleased += 1;
      },
      dispose: async () => {
        disposeCalls += 1;
      },
    };

    await action.disposePreparedMobileSession();

    expect(uiObserversReleased).toBe(1);
    expect(disposeCalls).toBe(0);
  });
});
