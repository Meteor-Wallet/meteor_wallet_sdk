import { describe, expect, it } from "bun:test";
import {
  act_impl_meteor_wallet_core,
  EMeteorAppId,
  EWalletProtocolCapability,
  type TNewKeyTransferStartInputV1,
  type TNewKeyTransferStartOutputV1,
  type TNewKeyTransferVerifyActiveInputV1,
  type TNewKeyTransferVerifyActiveOutputV1,
} from "@meteorwallet/connect-shared";
import type { MeteorConnect } from "../MeteorConnect";
import type { IMeteorConnection_V2_BridgeMobile } from "../MeteorConnect.types";
import { mobileBridgeResultToSdk } from "../target_clients/mobile_bridge/mobileBridgeResultToSdk";
import {
  getActionRequiredWalletCapabilities,
  sdkActionToMobileBridge,
} from "../target_clients/mobile_bridge/sdkActionToMobileBridge";
import { MeteorConnectNewKeyTransfer } from "./MeteorConnectNewKeyTransfer";

const SOURCE_KEY = "ed25519:4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi";
const DESTINATION_KEY = "ed25519:CktRuQ2mttgRGkXJtyksdKHjUdc2C4TgDzyB98oEzy8";
const TRANSACTION_HASH = "GgBaCs3NCBuZN12kCJgAW63ydqohFkHEdfdEXBPzLHq";
const CLIENT_ID = "AAAAAAAAAAAAAAAAAAAAAA";
const SESSION_ID = "BBBBBBBBBBBBBBBBBBBBBB";

const START_INPUT: TNewKeyTransferStartInputV1 = {
  formatVersion: 1,
  clientTransferId: CLIENT_ID,
  accounts: [
    {
      blockchainId: "near",
      networkId: "testnet",
      accountId: "alice.testnet",
      sourcePublicKey: SOURCE_KEY,
    },
  ],
};
const START_OUTPUT: TNewKeyTransferStartOutputV1 = {
  formatVersion: 1,
  clientTransferId: CLIENT_ID,
  transferSessionId: SESSION_ID,
  accounts: [
    {
      blockchainId: "near",
      networkId: "testnet",
      accountId: "alice.testnet",
      ok: true,
      destinationSignerType: "seed_phrase",
      destinationPublicKey: DESTINATION_KEY,
    },
  ],
};
const VERIFY_INPUT: TNewKeyTransferVerifyActiveInputV1 = {
  formatVersion: 1,
  transferSessionId: SESSION_ID,
  activations: [
    {
      blockchainId: "near",
      networkId: "testnet",
      accountId: "alice.testnet",
      addKeyTransactionHash: TRANSACTION_HASH,
    },
  ],
};
const VERIFY_OUTPUT: TNewKeyTransferVerifyActiveOutputV1 = {
  formatVersion: 1,
  transferSessionId: SESSION_ID,
  accounts: [
    {
      blockchainId: "near",
      networkId: "testnet",
      accountId: "alice.testnet",
      activation: "verified",
    },
  ],
};
const WALLET_CONNECTION: IMeteorConnection_V2_BridgeMobile = {
  executionTarget: "v2_bridge_mobile",
  schemaVersion: 1,
  bridgeEnvironmentId: "environment",
  meteorAppId: EMeteorAppId.meteor_wallet_web_dev,
  partnerClientId: "partner-client",
  walletVerifyPublicKey: `ed25519::raw_base64::${Buffer.alloc(32, 5).toString("base64")}`,
};

describe("new-key mobile bridge receive boundary", () => {
  it("serializes both actions and requires the dedicated capability", async () => {
    for (const request of [
      {
        id: "meteor_wallet_core::new_key_account_transfer_start",
        expandedInput: START_INPUT,
      },
      {
        id: "meteor_wallet_core::new_key_account_transfer_verify_active",
        expandedInput: VERIFY_INPUT,
      },
    ]) {
      const prepared = await sdkActionToMobileBridge(request as never);
      expect(prepared.actionRequest.domain).toBe("meteor_wallet_core");
      expect(getActionRequiredWalletCapabilities(prepared.actionRequest)).toContain(
        EWalletProtocolCapability.new_key_account_transfer_v1,
      );
    }
  });

  it("accepts only signed outputs with the exact requested identity set", async () => {
    const prepared = await sdkActionToMobileBridge({
      id: "meteor_wallet_core::new_key_account_transfer_start",
      expandedInput: START_INPUT,
    });
    const valid = act_impl_meteor_wallet_core.action.new_key_account_transfer_start
      .request(START_INPUT)
      .successResult(START_OUTPUT)
      .toJsonObject();
    await expect(
      mobileBridgeResultToSdk(
        prepared,
        { result: valid, signatureVerified: true, timestamp: Date.now() },
        { getConnection: () => WALLET_CONNECTION },
      ),
    ).resolves.toEqual(START_OUTPUT);
    await expect(
      mobileBridgeResultToSdk(
        prepared,
        { result: valid, signatureVerified: false, timestamp: Date.now() },
        { getConnection: () => WALLET_CONNECTION },
      ),
    ).rejects.toThrow("mobile_bridge_wallet_signature_invalid");

    const wrongSetResult = act_impl_meteor_wallet_core.action.new_key_account_transfer_start
      .request(START_INPUT)
      .successResult({
        ...START_OUTPUT,
        accounts: [{ ...START_OUTPUT.accounts[0], accountId: "bob.testnet" }],
      })
      .toJsonObject();
    await expect(
      mobileBridgeResultToSdk(
        prepared,
        { result: wrongSetResult, signatureVerified: true, timestamp: Date.now() },
        { getConnection: () => WALLET_CONNECTION },
      ),
    ).rejects.toThrow();
  });

  it("validates the verify session and requested subset after signature/hash checks", async () => {
    const prepared = await sdkActionToMobileBridge({
      id: "meteor_wallet_core::new_key_account_transfer_verify_active",
      expandedInput: VERIFY_INPUT,
    });
    const result = act_impl_meteor_wallet_core.action.new_key_account_transfer_verify_active
      .request(VERIFY_INPUT)
      .successResult(VERIFY_OUTPUT)
      .toJsonObject();
    await expect(
      mobileBridgeResultToSdk(
        prepared,
        { result, signatureVerified: true, timestamp: Date.now() },
        { getConnection: () => WALLET_CONNECTION },
      ),
    ).resolves.toEqual(VERIFY_OUTPUT);
  });
});

describe("MeteorConnectNewKeyTransfer journal", () => {
  const createHarness = (values = new Map<string, unknown>()) => {
    const targeted: Array<{ platform: string; wallet?: IMeteorConnection_V2_BridgeMobile }> = [];
    let promptCount = 0;
    const meteorConnect = {
      storage: {
        getJson: async (key: string) => values.get(key),
        setJson: async (key: string, value: unknown) => {
          values.set(key, structuredClone(value));
        },
      },
      createAction: async (request: { id: string; input?: { clientTransferId?: string } }) => {
        let target: { platform: string; walletConnection?: IMeteorConnection_V2_BridgeMobile };
        return {
          setTransferTarget: (value: typeof target) => {
            target = value;
            targeted.push({ platform: value.platform, wallet: value.walletConnection });
          },
          promptForExecution: async () => {
            promptCount += 1;
            const pending = values.get("newKeyTransferSessions") as Array<{
              clientTransferId: string;
              phase: string;
            }>;
            const currentClientTransferId = request.input?.clientTransferId ?? CLIENT_ID;
            expect(
              pending.find((session) => session.clientTransferId === currentClientTransferId)
                ?.phase,
            ).toMatch(/pending|progress/);
            if (!request.id.endsWith("_start")) return VERIFY_OUTPUT;
            const clientTransferId = request.input?.clientTransferId ?? CLIENT_ID;
            return {
              ...START_OUTPUT,
              clientTransferId,
              transferSessionId: clientTransferId === CLIENT_ID ? SESSION_ID : "D".repeat(22),
            };
          },
          getCompletedMobileConnection: () => WALLET_CONNECTION,
        };
      },
    };
    const api = new MeteorConnectNewKeyTransfer(meteorConnect as unknown as MeteorConnect);
    api.configure(true);
    return {
      api,
      targeted,
      getPromptCount: () => promptCount,
      setStoredSessions: (sessions: unknown) => values.set("newKeyTransferSessions", sessions),
    };
  };

  it("commits before prompting, replays once, and rejects changed input under the same id", async () => {
    const harness = createHarness();
    const options = {
      clientTransferId: CLIENT_ID,
      targetPlatform: "web" as const,
      accounts: START_INPUT.accounts,
    };
    const [first, replay] = await Promise.all([
      harness.api.start(options),
      harness.api.start(options),
    ]);
    expect(first.output).toEqual(START_OUTPUT);
    expect(replay.output).toEqual(START_OUTPUT);
    expect(harness.getPromptCount()).toBe(1);
    await expect(
      harness.api.start({
        ...options,
        accounts: [{ ...START_INPUT.accounts[0], accountId: "bob.testnet" }],
      }),
    ).rejects.toThrow("new_key_transfer_client_id_conflict");
  });

  it("serializes different transfers through the shared journal without losing either session", async () => {
    const values = new Map<string, unknown>();
    const firstHarness = createHarness(values);
    const secondHarness = createHarness(values);
    await Promise.all([
      firstHarness.api.start({
        clientTransferId: CLIENT_ID,
        targetPlatform: "web",
        accounts: START_INPUT.accounts,
      }),
      secondHarness.api.start({
        clientTransferId: "C".repeat(22),
        targetPlatform: "mobile",
        accounts: START_INPUT.accounts,
      }),
    ]);
    expect(
      (await firstHarness.api.getSessions()).map((session) => session.clientTransferId).sort(),
    ).toEqual([CLIENT_ID, "C".repeat(22)].sort());
  });

  it("fails closed instead of silently clearing a malformed persisted journal", async () => {
    const harness = createHarness();
    harness.setStoredSessions([{ formatVersion: 1, clientTransferId: "bad" }]);
    await expect(harness.api.getSessions()).rejects.toThrow("new_key_transfer_journal_corrupt");

    const strictHarness = createHarness();
    await strictHarness.api.start({
      clientTransferId: CLIENT_ID,
      targetPlatform: "web",
      accounts: START_INPUT.accounts,
    });
    const stored = await strictHarness.api.getSessions();
    (stored[0] as unknown as Record<string, unknown>).unexpected = true;
    strictHarness.setStoredSessions(stored);
    await expect(strictHarness.api.getSessions()).rejects.toThrow(
      "new_key_transfer_journal_corrupt",
    );
  });

  it("pins verify to the start wallet and preserves sessions after AddKey intent", async () => {
    const harness = createHarness();
    await harness.api.start({
      clientTransferId: CLIENT_ID,
      targetPlatform: "web",
      accounts: START_INPUT.accounts,
    });
    await harness.api.markAddKeyIntent({
      transferSessionId: SESSION_ID,
      accounts: START_INPUT.accounts,
    });
    await expect(harness.api.clear(CLIENT_ID)).rejects.toThrow(
      "new_key_transfer_recovery_required",
    );
    const verified = await harness.api.verifyActive({
      transferSessionId: SESSION_ID,
      activations: VERIFY_INPUT.activations,
    });
    expect(verified.session.phase).toBe("destination_keys_verified");
    expect(harness.targeted.at(-1)?.wallet).toEqual(WALLET_CONNECTION);
  });

  it("releases the recovery fence only after exact destination-key revocation is acknowledged", async () => {
    const harness = createHarness();
    await harness.api.start({
      clientTransferId: CLIENT_ID,
      targetPlatform: "web",
      accounts: START_INPUT.accounts,
    });
    await harness.api.markAddKeyIntent({
      transferSessionId: SESSION_ID,
      accounts: START_INPUT.accounts,
    });

    await expect(
      harness.api.markDestinationKeysRevoked({
        transferSessionId: SESSION_ID,
        accounts: [{ ...START_INPUT.accounts[0], accountId: "bob.testnet" }],
      }),
    ).rejects.toThrow("new_key_transfer_revoke_account_mismatch");

    const revoked = await harness.api.markDestinationKeysRevoked({
      transferSessionId: SESSION_ID,
      accounts: START_INPUT.accounts,
    });
    expect(revoked.phase).toBe("destination_keys_staged");
    expect(revoked.addKeyIntentAccounts).toEqual([]);
    expect(revoked.verifiedAccounts).toEqual([]);
    await expect(harness.api.clear(CLIENT_ID)).resolves.toBeUndefined();
    expect(await harness.api.getSessions()).toEqual([]);
  });
});
