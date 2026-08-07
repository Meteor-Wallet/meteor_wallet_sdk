import { describe, expect, it } from "bun:test";
import {
  act_impl_meteor_wallet_core,
  buildAccountsTransferRequestData,
  EWalletProtocolCapability,
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
import { mobileBridgeResultToSdk } from "./mobileBridgeResultToSdk";
import { rebaseWalletLinkToLocalDev } from "./MobileBridgeSession";
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

  it("hydrates transfer results and maps both signed outputs wire-shaped", async () => {
    const { request, actionInput } = await TRANSFER_REQUEST();
    const prepared = await sdkActionToMobileBridge(
      request as any,
      makeSensitiveSource(actionInput),
    );
    const context = {
      getConnection: () => {
        throw new Error("transfer result mapping must never resolve a wallet connection");
      },
    };
    for (const success of [true, false]) {
      const result = act_impl_meteor_wallet_core.action.transfer_accounts
        .request(actionInput)
        .successResult({ success })
        .toJsonObject();
      const output = await mobileBridgeResultToSdk(
        prepared,
        { result, signatureVerified: true, timestamp: Date.now() },
        context,
      );
      expect(output).toEqual({ success });
    }
  });

  it("rejects tampered transfer results", async () => {
    const { request, actionInput } = await TRANSFER_REQUEST();
    const prepared = await sdkActionToMobileBridge(
      request as any,
      makeSensitiveSource(actionInput),
    );
    const result = act_impl_meteor_wallet_core.action.transfer_accounts
      .request(actionInput)
      .successResult({ success: true })
      .toJsonObject();
    await expect(
      mobileBridgeResultToSdk(
        prepared,
        {
          result: { ...result, outputHash: "tampered" },
          signatureVerified: true,
          timestamp: Date.now(),
        },
        { getConnection: () => ({}) as any },
      ),
    ).rejects.toThrow("mobile_bridge_output_hash_mismatch");
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
        pinAttemptsUsed: 0,
        reconnecting: false,
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
  it("maps flow endings to resolved outcomes", () => {
    expect(mapRejectionToOutcome(new Error("Action was cancelled"))).toEqual({
      status: "cancelled",
    });
    expect(mapRejectionToOutcome(new Error("mobile_bridge_cancelled"))).toEqual({
      status: "cancelled",
    });
    expect(mapRejectionToOutcome(new Error("mobile_bridge_expired"))).toEqual({
      status: "expired",
    });
    expect(mapRejectionToOutcome(new Error("PIN attempts exceeded"))).toEqual({
      status: "failed",
      reason: "pin_attempts_exhausted",
    });
    expect(mapRejectionToOutcome(new Error("wallet_update_required"))).toEqual({
      status: "failed",
      reason: "wallet_update_required",
    });
    expect(mapRejectionToOutcome(new Error("mobile_bridge_failed"))).toEqual({
      status: "failed",
      reason: "bridge_failed",
    });
  });

  it("rethrows integration errors and classifies backend rejections", () => {
    expect(() => mapRejectionToOutcome(new Error("mobile_bridge_action_result_mismatch"))).toThrow(
      "mobile_bridge_action_result_mismatch",
    );
    expect(() =>
      mapRejectionToOutcome(new Error("[merr_bridge](invalid_action_request) Bad request")),
    ).toThrow("transfer_accounts_backend_rejected: invalid_action_request");
    expect(() =>
      mapRejectionToOutcome(new Error("[merr_bridge](idempotency_conflict) Conflict")),
    ).toThrow("transfer_accounts_backend_rejected: idempotency_conflict");
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
