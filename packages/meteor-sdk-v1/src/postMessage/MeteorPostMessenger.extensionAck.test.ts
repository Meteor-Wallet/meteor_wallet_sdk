import { afterEach, beforeEach, describe, expect, it, jest } from "bun:test";
import { EDappActionErrorTag } from "../ported_common/dapp/dapp.errors";
import { EDappActionConnectionStatus, EExternalActionType } from "../ported_common/dapp/dapp.enums";
import { MeteorActionError } from "../ported_common/dapp/dapp.types";
import { ENearNetwork } from "../ported_common/near/near_basic_types";
import {
  EXTENSION_ACK_TIMEOUT_MS,
  EXTENSION_LEGACY_ACK_TIMEOUT_MS,
  MeteorPostMessenger,
} from "./MeteorPostMessenger";

const REFRESH_MESSAGE = "Meteor extension didn't respond. If you just updated it, refresh this page.";

// bun:test implements advanceTimersByTime, but its jest typings omit it.
const advance = (ms: number) =>
  (jest as unknown as { advanceTimersByTime(ms: number): void }).advanceTimersByTime(ms);

type Listener = (data?: any) => void;

function installFakeExtension(opts: { sendThrows?: Error; ack?: boolean } = {}) {
  const state: { listener?: Listener; sent: any[] } = { sent: [] };
  (globalThis as any).window = {
    location: { href: "https://dapp.example/" },
    meteorCom: {
      ...(opts.ack ? { capabilities: { ack: true } } : {}),
      addMessageDataListener: (l: Listener) => {
        state.listener = l;
      },
      sendMessageData: (d: any) => {
        if (opts.sendThrows) throw opts.sendThrows;
        state.sent.push(d);
      },
    },
  };
  return state;
}

function start(messenger: MeteorPostMessenger, forceExecutionTargetConfig?: any) {
  return messenger.connectAndWaitForResponse({
    actionType: EExternalActionType.login,
    network: ENearNetwork.mainnet,
    inputs: {},
    forceExecutionTargetConfig,
  });
}

describe("MeteorPostMessenger extension acknowledgement", () => {
  const hadWindow = "window" in globalThis;
  const originalWindow = (globalThis as any).window;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    if (hadWindow) (globalThis as any).window = originalWindow;
    else delete (globalThis as any).window;
  });

  it("rejects with a refresh-the-page error when an ack-capable extension never acknowledges", async () => {
    installFakeExtension({ ack: true });
    const messenger = new MeteorPostMessenger();
    const promise = start(messenger);
    let settled: unknown;
    promise.catch((e) => {
      settled = e;
    });

    advance(EXTENSION_ACK_TIMEOUT_MS - 1);
    await Promise.resolve();
    expect(settled).toBeUndefined();

    advance(1);
    const err = await promise.catch((e) => e);
    expect(err).toBeInstanceOf(MeteorActionError);
    expect(err.message).toBe(REFRESH_MESSAGE);
    expect(err._reason.endTags).toContain(EDappActionErrorTag.EXTENSION_NO_RESPONSE);
    expect(messenger.connections).toHaveLength(0);
  });

  it("does not time out once the extension has acknowledged (user approval can take long)", async () => {
    const ext = installFakeExtension();
    const messenger = new MeteorPostMessenger();
    const promise = start(messenger);
    let settled = false;
    promise.then(
      () => (settled = true),
      () => (settled = true),
    );

    const uid = ext.sent[0].uid;
    ext.listener!({ uid, status: EDappActionConnectionStatus.connected, endTags: [] });

    advance(60_000);
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(messenger.connections).toHaveLength(1);

    ext.listener!({ uid, status: EDappActionConnectionStatus.closed_success, endTags: [], payload: 1 });
    advance(300);
    expect(await promise).toEqual({ success: true, endTags: [], payload: 1 });
  });

  it("rejects immediately on an explicit EXTENSION_RELOADED reply", async () => {
    const ext = installFakeExtension();
    const messenger = new MeteorPostMessenger();
    const promise = start(messenger);

    ext.listener!({ uid: ext.sent[0].uid, code: "EXTENSION_RELOADED" } as any);
    const err = await promise.catch((e) => e);
    expect(err.message).toBe(REFRESH_MESSAGE);
    expect(err._reason.endTags).toEqual([EDappActionErrorTag.EXTENSION_RELOADED]);
  });

  it("rejects pending extension requests on an EXTENSION_RELOADED reply without a uid", async () => {
    const ext = installFakeExtension();
    const messenger = new MeteorPostMessenger();
    const promise = start(messenger);

    ext.listener!({ status: EDappActionConnectionStatus.closed_fail, endTags: ["EXTENSION_RELOADED"] });
    const err = await promise.catch((e) => e);
    expect(err.message).toBe(REFRESH_MESSAGE);
  });

  it("rejects when the stale content script throws 'Extension context invalidated'", async () => {
    installFakeExtension({ sendThrows: new Error("Extension context invalidated.") });
    const messenger = new MeteorPostMessenger();
    const err = await start(messenger).catch((e) => e);
    expect(err.message).toBe(REFRESH_MESSAGE);
    expect(err._reason.endTags).toEqual([EDappActionErrorTag.EXTENSION_RELOADED]);
  });
  async function settleAfter(promise: Promise<unknown>, ms: number) {
    let settled: unknown = "pending";
    promise.then(
      (v) => (settled = v),
      (e) => (settled = e),
    );
    advance(ms);
    await Promise.resolve();
    await Promise.resolve();
    return settled;
  }

  it("accepts a late ack at 2.5s when the extension advertises the ack capability", async () => {
    const ext = installFakeExtension({ ack: true });
    const messenger = new MeteorPostMessenger();
    const promise = start(messenger);
    advance(2500);
    ext.listener!({ uid: ext.sent[0].uid, status: EDappActionConnectionStatus.connected, endTags: [] });
    expect(await settleAfter(promise, 60_000)).toBe("pending");
    expect(messenger.connections).toHaveLength(1);
  });

  it("uses the 20s legacy timeout for extensions without the ack capability (ack at 4s passes)", async () => {
    const ext = installFakeExtension();
    const messenger = new MeteorPostMessenger();
    const promise = start(messenger);
    advance(4000);
    ext.listener!({ uid: ext.sent[0].uid, status: EDappActionConnectionStatus.connected, endTags: [] });
    expect(await settleAfter(promise, 60_000)).toBe("pending");
  });

  it("legacy extension with no message at all fails at 20s, not 3s", async () => {
    installFakeExtension();
    const messenger = new MeteorPostMessenger();
    const promise = start(messenger);
    expect(await settleAfter(promise, EXTENSION_ACK_TIMEOUT_MS + 1000)).toBe("pending");
    const err: any = await settleAfter(promise, EXTENSION_LEGACY_ACK_TIMEOUT_MS);
    expect(err).toBeInstanceOf(MeteorActionError);
    expect(err._reason.endTags).toContain(EDappActionErrorTag.EXTENSION_NO_RESPONSE);
  });

  it("handles the exact extension reloaded payload and uses its message", async () => {
    const ext = installFakeExtension({ ack: true });
    const messenger = new MeteorPostMessenger();
    const promise = start(messenger);
    ext.listener!({
      uid: ext.sent[0].uid,
      status: "closed_fail",
      endTags: ["EXTENSION_RELOADED"],
      message: "Meteor was updated. Refresh this page to continue.",
    });
    const err = await promise.catch((e) => e);
    expect(err.message).toBe("Meteor was updated. Refresh this page to continue.");
    expect(err._reason.endTags).toEqual([EDappActionErrorTag.EXTENSION_RELOADED]);
  });

  it("treats an empty-string uid on a reloaded reply as absent", async () => {
    const ext = installFakeExtension({ ack: true });
    const messenger = new MeteorPostMessenger();
    const promise = start(messenger);
    ext.listener!({ uid: "", status: "closed_fail", endTags: ["EXTENSION_RELOADED"] });
    const err = await promise.catch((e) => e);
    expect(err.message).toBe(REFRESH_MESSAGE);
    expect(messenger.connections).toHaveLength(0);
  });

  it("rejects on any sendMessageData error, not only invalidation", async () => {
    installFakeExtension({ sendThrows: new Error("Could not establish connection. Receiving end does not exist.") });
    const messenger = new MeteorPostMessenger();
    const err = await start(messenger).catch((e) => e);
    expect(err).toBeInstanceOf(MeteorActionError);
    expect(err._reason.endTags).toEqual([EDappActionErrorTag.EXTENSION_NO_RESPONSE]);
  });

  it("rejects the direct (meteorComV2) path when the call throws", async () => {
    installFakeExtension({ ack: true });
    (globalThis as any).window.meteorComV2 = {
      version: "v2",
      featureFlags: [],
      sendMessageDataAndRespond: async () => {
        throw new Error("Receiving end does not exist.");
      },
    };
    const messenger = new MeteorPostMessenger();
    const err = await start(messenger, { executionTarget: "v1_ext" }).catch((e) => e);
    expect(err).toBeInstanceOf(MeteorActionError);
    expect(err._reason.endTags).toEqual([EDappActionErrorTag.EXTENSION_NO_RESPONSE]);
  });
});
