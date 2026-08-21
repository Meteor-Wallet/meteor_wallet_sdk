import { describe, expect, it } from "bun:test";
import { BridgeSessionTerminalError } from "@meteorwallet/connect";
import {
  act_impl_meteor_wallet_core,
  buildAccountsTransferRequestData,
  EErr_Bridge_Session,
  EWalletProtocolCapability,
  merr_bridge_session,
  REQUIRED_METEOR_WALLET_CAPABILITIES,
  type TAllAccountsTransferDataEncrypted,
} from "@meteorwallet/connect-shared";
import { ExecutableAction } from "../../action/ExecutableAction";
import type { MeteorConnect } from "../../MeteorConnect";
import { mapRejectionToOutcome } from "../../transfer_accounts/MeteorConnectTransferAccounts";
import { MeteorConnectTestClient } from "../test_client/MeteorConnectTestClient";
import { MeteorConnectV1Client } from "../v1_client/MeteorConnectV1Client";
import { MeteorConnectMobileBridgeClient } from "./MeteorConnectMobileBridgeClient";
import type { IMobileBridgeSensitiveTransferSource } from "./MeteorConnectMobileBridgeClient.types";
import { MOBILE_BRIDGE_ENDING, rebaseWalletLinkToLocalDev } from "./MobileBridgeSession";
import { meteorWalletCoreOutputToSdk } from "./mobileBridgeOutputToSdk";
import {
  getActionRequiredWalletCapabilities,
  sdkActionToMobileBridge,
} from "./sdkActionToMobileBridge";

const MNEMONIC_12 =
  "shoot island position soft burden budget tooth cruel issue economy destroy above";

async function buildEncryptedInput(): Promise<TAllAccountsTransferDataEncrypted> {
  const built = await buildAccountsTransferRequestData({
    decrypted: {
      formatVersion: 1,
      accounts: [
        {
          blockchainId: "near",
          networkId: "testnet",
          accountId: "alice.testnet",
          secret: [
            {
              type: "mnemonic",
              encoding: "utf8_base64",
              derivationPath: "m/44'/397'/0'",
              prefixedBase64DataString: `utf8_base64::${Buffer.from(MNEMONIC_12).toString("base64")}`,
            },
          ],
        },
      ],
    },
  });
  return built.actionInput;
}

function makeSensitiveSource(
  actionInput: TAllAccountsTransferDataEncrypted,
): IMobileBridgeSensitiveTransferSource {
  return {
    buildFreshBridgePayload: async () => actionInput,
    bindPendingHandleToSession: () => {},
  };
}

const TRANSFER_REQUEST = async () => {
  const actionInput = await buildEncryptedInput();
  return {
    request: {
      id: "meteor_wallet_core::transfer_accounts" as const,
      expandedInput: actionInput,
    },
    actionInput,
  };
};

describe("transfer action mobile-bridge adapters", () => {
  it("requires the sensitive attachment — the initial expandedInput ciphertext is never sent", async () => {
    const { request } = await TRANSFER_REQUEST();
    await expect(sdkActionToMobileBridge(request as any)).rejects.toThrow(
      "mobile_bridge_transfer_attachment_missing",
    );
  });

  it("serializes via act_impl_meteor_wallet_core from the attachment's fresh payload", async () => {
    const { request, actionInput } = await TRANSFER_REQUEST();
    const prepared = await sdkActionToMobileBridge(
      request as any,
      makeSensitiveSource(actionInput),
    );
    expect(prepared.kind).toEqual({
      domain: "meteor_wallet_core",
      sharedActionId: "transfer_accounts",
    });
    expect(prepared.actionRequest.domain).toBe("meteor_wallet_core");
    expect(prepared.actionRequest.id).toBe("transfer_accounts");
  });

  it("unions transfer_accounts_v1 into the capability set for transfer only", async () => {
    const transferCapabilities = getActionRequiredWalletCapabilities({
      domain: "meteor_wallet_core",
      id: "transfer_accounts",
    });
    expect(transferCapabilities).toContain(EWalletProtocolCapability.transfer_accounts_v1);
    for (const capability of REQUIRED_METEOR_WALLET_CAPABILITIES) {
      expect(transferCapabilities).toContain(capability);
    }
    const nearCapabilities = getActionRequiredWalletCapabilities({
      domain: "near",
      id: "sign_in",
    });
    expect(nearCapabilities).toEqual([...REQUIRED_METEOR_WALLET_CAPABILITIES].sort());
  });

  it("binds the request to the attachment's fresh payload, never the initial expandedInput", async () => {
    // `actionInput` is what the session hands `waitForValidatedResult({ input })`, so it must be
    // the exact value the wire request was built from. For transfer that is always the fresh
    // per-bridge ciphertext, never the initial build sitting on the SDK request.
    const { request, actionInput } = await TRANSFER_REQUEST();
    const freshPayload = await buildEncryptedInput();
    const prepared = await sdkActionToMobileBridge(
      request as any,
      makeSensitiveSource(freshPayload),
    );
    expect(prepared.actionInput).toBe(freshPayload);
    expect(prepared.actionInput).not.toEqual(actionInput);
    expect(
      act_impl_meteor_wallet_core.actionForId("transfer_accounts").serializeInput(freshPayload),
    ).toEqual(prepared.actionRequest.input);
  });

  it("maps both signed transfer outputs wire-shaped", async () => {
    const { request, actionInput } = await TRANSFER_REQUEST();
    const prepared = await sdkActionToMobileBridge(
      request as any,
      makeSensitiveSource(actionInput),
    );
    for (const success of [true, false]) {
      // The value the session receives from `waitForValidatedResult`: already signature-verified,
      // already bound to the signed turn, and already through the action's own output schema.
      const output = act_impl_meteor_wallet_core
        .actionForId("transfer_accounts")
        .validateOutput({ success });
      expect(meteorWalletCoreOutputToSdk(prepared, output)).toEqual({ success });
    }
  });

  it("refuses a transfer output that fails the action's own schema", async () => {
    // Signature, turn binding, and the output-hash recompute all moved into the session client
    // (each surfaces as its `mismatch` arm). The schema check is what still fails closed here.
    expect(() =>
      act_impl_meteor_wallet_core
        .actionForId("transfer_accounts")
        .validateOutput({ success: "yes" }),
    ).toThrow();
  });
});

describe("execution-target domain gating", () => {
  const transferRequest = {
    id: "meteor_wallet_core::transfer_accounts",
    expandedInput: {},
  } as any;

  it("V1 and test clients offer no targets for non-NEAR domains", async () => {
    const v1 = new MeteorConnectV1Client({} as unknown as MeteorConnect);
    expect(await v1.getExecutionTargetConfigs(transferRequest)).toEqual([]);
    const test = new MeteorConnectTestClient({} as unknown as MeteorConnect);
    expect(await test.getExecutionTargetConfigs(transferRequest)).toEqual([]);
  });

  it("offers no NEAR target unless experimentalNearOverSession is explicitly on", async () => {
    // The bridge's `session_policies.ts::hasImplementedRecoverySeams` admits only the three
    // meteor_wallet_core transfer ids, so a NEAR session is refused server-side with
    // `action_ineligible`. NEAR keeps running over v1_web / v1_ext instead.
    const storage = {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {},
    };
    const signInRequest = { id: "near::sign_in", expandedInput: {} } as any;
    const client = new MeteorConnectMobileBridgeClient({} as unknown as MeteorConnect);
    client.configure({ enabled: true }, storage);
    expect(await client.getExecutionTargetConfigs(signInRequest)).toEqual([]);

    const experimental = new MeteorConnectMobileBridgeClient({} as unknown as MeteorConnect);
    experimental.configure({ enabled: true, experimentalNearOverSession: true }, storage);
    const configs = await experimental.getExecutionTargetConfigs(signInRequest);
    expect(configs).toHaveLength(1);
    expect(configs[0]!.executionTarget).toBe("v2_bridge_mobile");

    // Non-sign-in NEAR actions never had an account-less shell and still do not get one.
    expect(
      await experimental.getExecutionTargetConfigs({
        id: "near::sign_message",
        expandedInput: {},
      } as any),
    ).toEqual([]);

    // A NEAR account whose stored connection still names the session bridge must not re-enter it
    // while the gate is closed — the gate runs before the stored-connection shortcut.
    const storedMobileConnection = { executionTarget: "v2_bridge_mobile" };
    const storedConnection = {
      id: "near::sign_message",
      expandedInput: { account: { connection: storedMobileConnection } },
    } as any;
    expect(await client.getExecutionTargetConfigs(storedConnection)).toEqual([]);
    expect(await experimental.getExecutionTargetConfigs(storedConnection)).toEqual([
      storedMobileConnection as any,
    ]);
  });

  it("mobile client offers transfer targets only when the feature flag is on", async () => {
    const storage = {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {},
    };
    const client = new MeteorConnectMobileBridgeClient({} as unknown as MeteorConnect);
    client.configure({ enabled: true }, storage);
    expect(await client.getExecutionTargetConfigs(transferRequest)).toEqual([]);

    const enabledClient = new MeteorConnectMobileBridgeClient({} as unknown as MeteorConnect);
    enabledClient.configure({ enabled: true, transferAccounts: { enabled: true } }, storage);
    const configs = await enabledClient.getExecutionTargetConfigs(transferRequest);
    expect(configs).toHaveLength(1);
    expect(configs[0]!.executionTarget).toBe("v2_bridge_mobile");
  });
});

describe("ExecutableAction post-execute guard", () => {
  it("settles a successful transfer without touching the active wallet connection", async () => {
    const fakeSession = {
      subscribe: () => () => {},
      getSnapshot: () => ({
        phase: "wallet_action",
        push: "not_attempted",
        linkPhase: "live",
        linkRedialAttempt: 0,
        pinAttemptsUsed: 0,
      }),
      cancel: async () => "cancelled_before_commit",
      isCommitted: () => true,
      dispose: async () => {},
      awaitResult: async () => ({ success: true }),
    };
    const meteorConnect = {
      mobileBridgeClient: {
        prepareRequest: async () => fakeSession,
        getCurrentSession: () => fakeSession,
        getActiveConnection: () => {
          throw new Error("guard_violated: getActiveConnection called for transfer");
        },
      },
      getClientByExecutionTargetId: () => ({
        makeRequest: async () => ({ success: true }),
      }),
    } as unknown as MeteorConnect;

    const action = new ExecutableAction(
      { id: "meteor_wallet_core::transfer_accounts", input: {} } as any,
      { formatVersion: 1, allAccountsBasicInfo: [], encryptedData: {} },
      meteorConnect,
      {
        allExecutionTargets: [{ executionTarget: "v2_bridge_mobile" } as any],
        contextualExecutionTarget: undefined,
      },
    );

    const output = await action.execute("v2_bridge_mobile");
    expect(output).toEqual({ success: true });
  });
});

describe("transfer outcome mapping", () => {
  it("maps this SDK's own flow endings to resolved outcomes", () => {
    expect(mapRejectionToOutcome(new Error("Action was cancelled"))).toEqual({
      status: "cancelled",
    });
    expect(mapRejectionToOutcome(new Error(MOBILE_BRIDGE_ENDING.cancelled))).toEqual({
      status: "cancelled",
    });
    expect(mapRejectionToOutcome(new Error(MOBILE_BRIDGE_ENDING.expired))).toEqual({
      status: "expired",
    });
    expect(mapRejectionToOutcome(new Error(MOBILE_BRIDGE_ENDING.pinAttemptsExceeded))).toEqual({
      status: "failed",
      reason: "pin_attempts_exhausted",
    });
    expect(mapRejectionToOutcome(new Error(MOBILE_BRIDGE_ENDING.failed))).toEqual({
      status: "failed",
      reason: "bridge_failed",
    });
    expect(mapRejectionToOutcome(new Error(MOBILE_BRIDGE_ENDING.disposed))).toEqual({
      status: "failed",
      reason: "bridge_failed",
    });
    // A signed typed-error result. A real transfer decline is successResult({ success: false }),
    // so an error result is a wallet-side failure, not a decline.
    expect(
      mapRejectionToOutcome(new Error(`${MOBILE_BRIDGE_ENDING.walletDeclined}: some_id — nope`)),
    ).toEqual({ status: "failed", reason: "bridge_failed" });
  });

  it("classifies typed protocol rejections by id, never by message", () => {
    expect(
      mapRejectionToOutcome(
        merr_bridge_session.fromId(EErr_Bridge_Session.wallet_update_required, {
          requiredWalletProtocolVersion: 2,
          requiredWalletCapabilities: [],
        }),
      ),
    ).toEqual({ status: "failed", reason: "wallet_update_required" });
    expect(
      mapRejectionToOutcome(merr_bridge_session.fromId(EErr_Bridge_Session.pin_incorrect)),
    ).toEqual({ status: "failed", reason: "pin_attempts_exhausted" });
    expect(
      mapRejectionToOutcome(merr_bridge_session.fromId(EErr_Bridge_Session.idle_expired)),
    ).toEqual({ status: "expired" });
    expect(
      mapRejectionToOutcome(merr_bridge_session.fromId(EErr_Bridge_Session.absolute_expired)),
    ).toEqual({ status: "expired" });
    expect(
      mapRejectionToOutcome(merr_bridge_session.fromId(EErr_Bridge_Session.turn_limit_reached)),
    ).toEqual({ status: "failed", reason: "bridge_failed" });
  });

  it("maps a terminal bridge release by its reason", () => {
    expect(
      mapRejectionToOutcome(new BridgeSessionTerminalError({ reason: "bridge_gone" })),
    ).toEqual({ status: "expired" });
    expect(
      mapRejectionToOutcome(new BridgeSessionTerminalError({ reason: "retry_budget" })),
    ).toEqual({ status: "failed", reason: "bridge_failed" });
  });

  it("throws integration-level rejections and anything it does not recognize", () => {
    expect(() =>
      mapRejectionToOutcome(merr_bridge_session.fromId(EErr_Bridge_Session.action_ineligible)),
    ).toThrow("transfer_accounts_backend_rejected: action_ineligible");
    expect(() =>
      mapRejectionToOutcome(merr_bridge_session.fromId(EErr_Bridge_Session.session_disabled)),
    ).toThrow("transfer_accounts_backend_rejected: session_disabled");
    expect(() => mapRejectionToOutcome(new Error(MOBILE_BRIDGE_ENDING.resultMismatch))).toThrow(
      MOBILE_BRIDGE_ENDING.resultMismatch,
    );
    expect(() =>
      mapRejectionToOutcome(new Error("mobile_bridge_transfer_attachment_missing")),
    ).toThrow("mobile_bridge_transfer_attachment_missing");
    expect(() => mapRejectionToOutcome(new Error("totally_unknown_error"))).toThrow(
      "totally_unknown_error",
    );
  });
});

describe("web_local_dev link rebase", () => {
  it("rebases a backend web link onto the local origin, preserving path and query", () => {
    expect(
      rebaseWalletLinkToLocalDev(
        "https://wallet-dev.meteorwallet.app/bridge_request?bridgeId=b1&protocolVersion=1",
        "https://localhost:3001",
      ),
    ).toBe("https://localhost:3001/bridge_request?bridgeId=b1&protocolVersion=1");
    // A base with a stray path contributes only its origin.
    expect(
      rebaseWalletLinkToLocalDev(
        "https://wallet-dev.meteorwallet.app/bridge_request?bridgeId=b2&protocolVersion=1",
        "http://192.168.0.12:3001/ignored",
      ),
    ).toBe("http://192.168.0.12:3001/bridge_request?bridgeId=b2&protocolVersion=1");
  });

  it("carries the partner's bridge backend as an mcBackend hint for the dev wallet", () => {
    const rebased = rebaseWalletLinkToLocalDev(
      "https://wallet-dev.meteorwallet.app/bridge_request?bridgeId=b3&protocolVersion=1",
      "https://localhost:3001",
      "https://mc.meteorwallet.app",
    );
    const url = new URL(rebased);
    expect(url.origin).toBe("https://localhost:3001");
    expect(url.searchParams.get("bridgeId")).toBe("b3");
    expect(url.searchParams.get("mcBackend")).toBe("https://mc.meteorwallet.app");
  });
});
