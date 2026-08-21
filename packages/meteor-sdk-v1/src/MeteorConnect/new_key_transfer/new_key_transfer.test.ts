import { describe, expect, it } from "bun:test";
import type {
  ICreatedPartnerSession,
  ICreateSessionInput,
  IPreparedSessionTurn,
  ISessionLinkStatus,
  ISessionResultReceipt,
  TPartnerPairedWallet,
} from "@meteorwallet/connect";
import {
  createMemoryStorageAdapter,
  PartnerSessionClient,
  SessionResourceProfileAmbiguityError,
} from "@meteorwallet/connect";
import {
  act_impl_meteor_wallet_core,
  EBridgeLinkType,
  EMeteorAppId,
  ESessionPhase,
  ESessionResourceProfile,
  EWalletPlatform,
  EWalletProtocolCapability,
  hashNewKeyTransferStartInput,
  type IAddKeyJournalChain,
  type IAddKeySignedTransaction,
  type TNewKeyTransferStartInputV1,
  type TNewKeyTransferStartOutputV1,
  type TNewKeyTransferVerifyActiveInputV1,
  type TNewKeyTransferVerifyActiveOutputV1,
  type TSessionFacts,
} from "@meteorwallet/connect-shared";
import { getActionPolicy } from "@meteorwallet/connect-shared/internal";
import { CEnvironmentStorageAdapter } from "../../ported_common/utils/storage/EnvironmentStorageAdapter";
import type { ILocalStorageInterface } from "../../ported_common/utils/storage/storage.types";
import type { MeteorConnect } from "../MeteorConnect";
import type { IMeteorConnection_V2_BridgeMobile } from "../MeteorConnect.types";
import type { IMobileBridgeExternalWorkHold } from "../target_clients/mobile_bridge/MeteorConnectMobileBridgeClient.types";
import { MobileBridgeSession } from "../target_clients/mobile_bridge/MobileBridgeSession";
import { meteorWalletCoreOutputToSdk } from "../target_clients/mobile_bridge/mobileBridgeOutputToSdk";
import {
  getActionRequiredWalletCapabilities,
  sdkActionToMobileBridge,
} from "../target_clients/mobile_bridge/sdkActionToMobileBridge";
import {
  createSessionClientDoubleBase,
  sessionFactsFor,
} from "../test/test_utils/sessionClientDouble";
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
/** A SECOND, unrelated transfer — the one a leftover start-result journal slot would brick. */
const SECOND_CLIENT_ID = "CCCCCCCCCCCCCCCCCCCCCC";
const SECOND_SESSION_ID = "DDDDDDDDDDDDDDDDDDDDDD";
const SECOND_DESTINATION_KEY = "ed25519:cGfHiC6Kgg3FpFZvgwGcswsCRtp4aBP2fzuXRQPizuN";
const SECOND_START_INPUT: TNewKeyTransferStartInputV1 = {
  ...START_INPUT,
  clientTransferId: SECOND_CLIENT_ID,
};
const SECOND_START_OUTPUT: TNewKeyTransferStartOutputV1 = {
  ...START_OUTPUT,
  clientTransferId: SECOND_CLIENT_ID,
  transferSessionId: SECOND_SESSION_ID,
  accounts: [
    {
      blockchainId: "near",
      networkId: "testnet",
      accountId: "alice.testnet",
      ok: true,
      destinationSignerType: "seed_phrase",
      destinationPublicKey: SECOND_DESTINATION_KEY,
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
const WALLET_VERIFY_KEY = `ed25519::raw_base64::${Buffer.alloc(32, 5).toString("base64")}` as const;
const WALLET_CONNECTION: IMeteorConnection_V2_BridgeMobile = {
  executionTarget: "v2_bridge_mobile",
  schemaVersion: 1,
  bridgeEnvironmentId: "environment",
  meteorAppId: EMeteorAppId.meteor_wallet_web_dev,
  partnerClientId: "partner-client",
  walletVerifyPublicKey: WALLET_VERIFY_KEY,
};
const PAIRED_WALLET: TPartnerPairedWallet = {
  walletVerifyPublicKey: WALLET_VERIFY_KEY,
  walletExchangePublicKey: `x25519::raw_base64::${Buffer.alloc(32, 7).toString("base64")}`,
  meteorAppId: EMeteorAppId.meteor_wallet_web_dev,
  pairedAt: 1,
  walletProtocolVersion: 2,
  walletCapabilities: [EWalletProtocolCapability.new_key_account_transfer_v1],
};

const startRequestPayload = () =>
  act_impl_meteor_wallet_core.action.new_key_account_transfer_start
    .request(START_INPUT)
    .toJsonObject();
const verifyRequestPayload = () =>
  act_impl_meteor_wallet_core.action.new_key_account_transfer_verify_active
    .request(VERIFY_INPUT)
    .toJsonObject();

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
    // Signature verification, action matching, and the result-envelope binding are all performed
    // by `PartnerSessionClient.waitForValidatedResult` before the SDK sees anything. What this
    // layer still owns — and what is asserted here — is the business-level binding of the output
    // back to the account set the request asked for.
    const prepared = await sdkActionToMobileBridge({
      id: "meteor_wallet_core::new_key_account_transfer_start",
      expandedInput: START_INPUT,
    });
    const valid = act_impl_meteor_wallet_core
      .actionForId("new_key_account_transfer_start")
      .validateOutput(START_OUTPUT);
    expect(meteorWalletCoreOutputToSdk(prepared, valid)).toEqual(START_OUTPUT);

    const wrongSet = act_impl_meteor_wallet_core
      .actionForId("new_key_account_transfer_start")
      .validateOutput({
        ...START_OUTPUT,
        accounts: [{ ...START_OUTPUT.accounts[0], accountId: "bob.testnet" }],
      });
    expect(() => meteorWalletCoreOutputToSdk(prepared, wrongSet)).toThrow();
  });

  it("validates the verify session and requested subset of the signed output", async () => {
    const prepared = await sdkActionToMobileBridge({
      id: "meteor_wallet_core::new_key_account_transfer_verify_active",
      expandedInput: VERIFY_INPUT,
    });
    const output = act_impl_meteor_wallet_core
      .actionForId("new_key_account_transfer_verify_active")
      .validateOutput(VERIFY_OUTPUT);
    expect(meteorWalletCoreOutputToSdk(prepared, output)).toEqual(VERIFY_OUTPUT);
  });
});

describe("new-key session resource profiles", () => {
  it("throws SessionResourceProfileAmbiguityError when verify_active omits the profile", async () => {
    // The real trap, on the real client: the profile is derived from the action policy, and the
    // derivation refuses to guess when the policy permits more than one. This throws before any
    // network call, which is why it is reachable without a backend.
    const client = new PartnerSessionClient({
      backendUrl: "https://bridge.example",
      partnerMetadata: { name: "SDK tests", origin: "web_url::https://example.test" },
      storageAdapter: createMemoryStorageAdapter({ keyPrefix: "sdk_test::" }),
    });
    const attempt = client.createSession({
      initialActionRequest: verifyRequestPayload(),
      meteorAppIds: [EMeteorAppId.meteor_wallet_web_dev],
    });
    await expect(attempt).rejects.toBeInstanceOf(SessionResourceProfileAmbiguityError);
    await attempt.catch((error: unknown) => {
      if (!(error instanceof SessionResourceProfileAmbiguityError)) throw error;
      expect(error.allowedResourceProfiles).toEqual([
        ESessionResourceProfile.single_turn_v1,
        ESessionResourceProfile.external_work_v1,
      ]);
    });
  });

  it("names the one action whose policy permits two profiles — the omission trap", () => {
    // `createSession` derives the profile from the action policy and throws
    // SessionResourceProfileAmbiguityError when more than one is permitted. These are the exact
    // policy sets that make omitting `resourceProfile` legal for start and illegal for verify.
    expect(getActionPolicy(startRequestPayload()).allowedResourceProfiles).toEqual([
      ESessionResourceProfile.external_work_v1,
    ]);
    expect(getActionPolicy(verifyRequestPayload()).allowedResourceProfiles).toEqual([
      ESessionResourceProfile.single_turn_v1,
      ESessionResourceProfile.external_work_v1,
    ]);
  });
});

// -------------------------------------------------------------------------------------------
// Session doubles
// -------------------------------------------------------------------------------------------

/** Result/request hashes are canonical padded base64 of 32 bytes — the journal parses them. */
const hashFor = (seed: number): string => Buffer.alloc(32, seed).toString("base64");

const receiptFor = (sequence: number): ISessionResultReceipt => ({
  bridgeId: "bridge-1",
  sequence,
  turnId: `turn-${sequence}`,
  requestHash: hashFor(sequence * 2),
  resultHash: hashFor(sequence * 2 + 1),
});

interface IBridgeTrace {
  createSessionInputs: ICreateSessionInput[];
  preparedActions: Array<{ sequence: number; priorResultHash: string }>;
  externalWorkHolds: Array<{ receipt: ISessionResultReceipt; journaledResultHash: string }>;
  closedReceipts: ISessionResultReceipt[];
  turnWakes: number;
  events: string[];
}

/**
 * A `PartnerSessionClient`-shaped double covering the two-turn new-key choreography: session
 * creation, the validated-result wait, the external-work hold verb, and `prepareAction` /
 * `submitPreparedAction` / `notifyWalletForCurrentTurn` for the turn that follows it. Every
 * facts-returning verb goes through the shared emission base, so the facts reach subscribers
 * before the verb resolves — exactly as the shipped client publishes them.
 */
function createBridgeDouble(outputs: unknown[]) {
  const trace: IBridgeTrace = {
    createSessionInputs: [],
    preparedActions: [],
    externalWorkHolds: [],
    closedReceipts: [],
    turnWakes: 0,
    events: [],
  };
  let sequence = 0;
  let pairedAtTicks = PAIRED_WALLET.pairedAt;
  // `acceptSessionActionFacts`, mirrored once for every double in this package: a verb publishes
  // the facts it returns from inside its own still-pending await (`createSessionClientDoubleBase`).
  const base = createSessionClientDoubleBase({
    facts: sessionFactsFor(ESessionPhase.waiting_for_wallet),
  });
  const nextOutput = (): unknown => {
    const output = outputs.shift();
    if (output === undefined) throw new Error("no scripted wallet result remains");
    return output;
  };
  const client = {
    backendUrl: "https://bridge.example",
    events: base.events,
    linkStatus: {
      phase: "live",
      attempt: 0,
      retryInMs: undefined,
      lastDownForMs: undefined,
      attachError: undefined,
      diagnostics: {},
    } satisfies ISessionLinkStatus,
    get sessionFacts(): Readonly<TSessionFacts> | undefined {
      return base.getSessionFacts();
    },
    createSession: async (input: ICreateSessionInput): Promise<ICreatedPartnerSession> => {
      trace.createSessionInputs.push({ ...input });
      sequence = 0;
      // The shipped `createSession` binds the session and stages its initial turn, accepting the
      // facts it is about to return along the way — so they are published, not merely returned.
      const facts = base.publishFacts(sessionFactsFor(ESessionPhase.waiting_for_wallet));
      return {
        bridgeId: "bridge-1",
        bridgeLease: "lease-1",
        partnerId: "partner-1",
        partnerRequestId: `sdk-request-${trace.createSessionInputs.length}`,
        partnerSecret: "secret",
        walletLinks: [
          {
            appId: EMeteorAppId.meteor_wallet_web_dev,
            walletName: "Meteor Web Dev",
            walletDescription: "dev",
            platform: EWalletPlatform.web,
            linkString: "https://wallet-dev.meteorwallet.app/bridge_request?linkFormat=s1",
            linkType: EBridgeLinkType.web_app_url,
          },
        ],
        facts,
        initialTurn: { envelope: {}, signatureBase64: "" },
      } as unknown as ICreatedPartnerSession;
    },
    // Every claim rewrites the claiming wallet's paired record with a fresh `pairedAt`; that is
    // how the session names its claimant against the baseline it took before creation.
    getPairedWallets: async (): Promise<TPartnerPairedWallet[]> => [
      { ...PAIRED_WALLET, pairedAt: (pairedAtTicks += 1) },
    ],
    notifyWalletForInitialClaim: async () => ({ delivered: true }),
    notifyWalletForCurrentTurn: async () => {
      trace.turnWakes += 1;
      return { delivered: true } as never;
    },
    // The wait itself accepts no facts: the staged result reaches the client through the realm
    // projection, which is where `result_ready` comes from.
    waitForValidatedResult: async () => {
      sequence += 1;
      base.emit("factsChanged", {
        facts: sessionFactsFor(ESessionPhase.result_ready),
        source: "realm",
      });
      return { status: "ok", output: nextOutput(), receipt: receiptFor(sequence) } as never;
    },
    acknowledgeAndClose: base.verb((receipt: ISessionResultReceipt) => {
      trace.events.push("verb:acknowledgeAndClose");
      trace.closedReceipts.push(receipt);
      return sessionFactsFor(ESessionPhase.closed);
    }),
    acknowledgeAndBeginExternalWork: base.verb(
      (receipt: ISessionResultReceipt, journaledResultHash: string) => {
        trace.events.push("verb:acknowledgeAndBeginExternalWork");
        trace.externalWorkHolds.push({ receipt, journaledResultHash });
        return sessionFactsFor(ESessionPhase.external_work);
      },
    ),
    prepareAction: async (input: {
      sequence: number;
      priorResultHash: string;
    }): Promise<IPreparedSessionTurn> => {
      trace.preparedActions.push({
        sequence: input.sequence,
        priorResultHash: input.priorResultHash,
      });
      return { envelope: {}, signatureBase64: "" } as unknown as IPreparedSessionTurn;
    },
    submitPreparedAction: base.verb(() => sessionFactsFor(ESessionPhase.wallet_action)),
    closePhaseSafe: base.verb(() => sessionFactsFor(ESessionPhase.closed)),
    // The client drops the binding's facts here, so a fresh session starts from nothing.
    disconnectBridge: async (): Promise<void> => {
      base.releaseBinding();
    },
  };
  return { client: client as unknown as PartnerSessionClient, trace };
}

function memoryLocalStorage() {
  const values = new Map<string, string>();
  const implementation: ILocalStorageInterface = {
    setItem: async (key, value) => {
      values.set(key, value);
    },
    getItem: async (key) => values.get(key) ?? null,
    removeItem: async (key) => {
      values.delete(key);
    },
  };
  return { values, implementation };
}

/**
 * Drives `MeteorConnectNewKeyTransfer` against a REAL `MobileBridgeSession` over the client double
 * above, standing in for the `ExecutableAction` + `ActionUi` glue only.
 */
function createHarness(input: { sessions?: Map<string, unknown>; outputs?: unknown[] } = {}) {
  const values = input.sessions ?? new Map<string, unknown>();
  const storage = memoryLocalStorage();
  const outputs = input.outputs ?? [START_OUTPUT, VERIFY_OUTPUT];
  const { client, trace } = createBridgeDouble(outputs);
  const targeted: Array<{
    id: string;
    platform: string;
    walletConnection?: IMeteorConnection_V2_BridgeMobile;
    continuedHold?: IMobileBridgeExternalWorkHold;
    retained: boolean;
  }> = [];
  let heldSession: MobileBridgeSession | undefined;
  let currentSession: MobileBridgeSession | undefined;
  const releasedSessions: MobileBridgeSession[] = [];
  let promptCount = 0;

  const meteorConnect = {
    localStorageAdapter: new CEnvironmentStorageAdapter(storage.implementation),
    mobileBridgeClient: {
      getCurrentSession: () => currentSession,
      releaseSession: async (session: MobileBridgeSession) => {
        releasedSessions.push(session);
        if (currentSession === session) currentSession = undefined;
        if (heldSession === session) heldSession = undefined;
        await session.dispose();
      },
    },
    storage: {
      getJson: async (key: string) => values.get(key),
      setJson: async (key: string, value: unknown) => {
        values.set(key, structuredClone(value));
      },
    },
    createAction: async (request: { id: string; input: Record<string, unknown> }) => {
      let target: {
        platform: string;
        walletConnection?: IMeteorConnection_V2_BridgeMobile;
        externalWorkJournal?: (input: {
          receipt: ISessionResultReceipt;
          output: unknown;
        }) => Promise<string>;
        continueExternalWorkHold?: IMobileBridgeExternalWorkHold;
        retainSessionForExternalWork?: boolean;
      };
      let session: MobileBridgeSession | undefined;
      return {
        setTransferTarget: (value: typeof target) => {
          target = value;
          targeted.push({
            id: request.id,
            platform: value.platform,
            walletConnection: value.walletConnection,
            continuedHold: value.continueExternalWorkHold,
            retained: value.retainSessionForExternalWork === true,
          });
        },
        getExternalWorkHold: () => session?.getExternalWorkHold(),
        getCompletedMobileConnection: () => session?.getCompletedConnection(),
        promptForExecution: async () => {
          promptCount += 1;
          const pending = values.get("newKeyTransferSessions") as Array<{
            clientTransferId: string;
            phase: string;
          }>;
          const currentClientTransferId =
            typeof request.input.clientTransferId === "string"
              ? request.input.clientTransferId
              : CLIENT_ID;
          expect(
            pending.find((stored) => stored.clientTransferId === currentClientTransferId)?.phase ??
              pending[0]?.phase,
          ).toMatch(/pending|progress/);
          const prepared = await sdkActionToMobileBridge({
            id: request.id,
            expandedInput: request.input,
          } as never);
          const continued = target.continueExternalWorkHold;
          if (continued != null && heldSession?.getExternalWorkHold() != null) {
            session = heldSession;
            await heldSession.beginNextTurn(prepared);
          } else {
            session = new MobileBridgeSession({
              token: `token-${promptCount}`,
              client,
              prepared,
              targetMeteorAppIds: [EMeteorAppId.meteor_wallet_web_dev],
              pushWallet: target.walletConnection == null ? undefined : PAIRED_WALLET,
              pinnedWallet: target.walletConnection == null ? undefined : PAIRED_WALLET,
              journalBeforeExternalWorkHold: target.externalWorkJournal,
              buildConnection: () => WALLET_CONNECTION,
              isCurrent: () => true,
              assertIdentityGeneration: async () => {},
              acquireFirstPairingLease: async () => ({
                ownerToken: "lease",
                assertOwned: async () => {},
                release: async () => {},
              }),
              registerLiveSession: async () => ({ stop: async () => {} }),
            });
            await session.startPreparation();
          }
          currentSession = session;
          const output = await session.awaitResult();
          if (target.retainSessionForExternalWork === true) heldSession = session;
          return output;
        },
      };
    },
  };
  const api = new MeteorConnectNewKeyTransfer(meteorConnect as unknown as MeteorConnect);
  api.configure(true);
  return {
    api,
    trace,
    targeted,
    storage,
    releasedSessions,
    getPromptCount: () => promptCount,
    dropHold: () => {
      heldSession = undefined;
    },
    setStoredSessions: (sessions: unknown) => values.set("newKeyTransferSessions", sessions),
  };
}

/**
 * A chain seam that finalizes immediately. Everything that decides whether the AddKey is
 * authorized still belongs to the shared runner + proof verifier — this only plays the RPC.
 */
function createChainDouble(): { chain: IAddKeyJournalChain; calls: string[] } {
  const calls: string[] = [];
  let destinationLive = false;
  const signed: IAddKeySignedTransaction = {
    transactionHash: TRANSACTION_HASH,
    signedTransactionBase64: Buffer.alloc(64, 3).toString("base64"),
  };
  const finalStatus = (job: { accountId: string; destinationPublicKey: string }) => ({
    final_execution_status: "FINAL",
    status: { SuccessValue: "" },
    transaction: {
      hash: TRANSACTION_HASH,
      signer_id: job.accountId,
      receiver_id: job.accountId,
      public_key: SOURCE_KEY,
      actions: [
        {
          AddKey: {
            public_key: job.destinationPublicKey,
            access_key: { nonce: 1, permission: "FullAccess" },
          },
        },
      ],
    },
  });
  const chain: IAddKeyJournalChain = {
    getAccessKeys: async (job) => {
      calls.push("getAccessKeys");
      return {
        keys: [
          { public_key: job.sourcePublicKey, access_key: { nonce: 1, permission: "FullAccess" } },
          ...(destinationLive
            ? [
                {
                  public_key: job.destinationPublicKey,
                  access_key: { nonce: 2, permission: "FullAccess" },
                },
              ]
            : []),
        ],
      };
    },
    signAddKeyTransaction: async () => {
      calls.push("sign");
      return signed;
    },
    broadcastSignedTransaction: async (job) => {
      calls.push("broadcast");
      destinationLive = true;
      return finalStatus(job);
    },
    getFinalTransactionStatus: async (job) => {
      calls.push("status");
      return finalStatus(job);
    },
  };
  return { chain, calls };
}

describe("MeteorConnectNewKeyTransfer journal", () => {
  it("commits before prompting, replays once, and rejects changed input under the same id", async () => {
    const harness = createHarness({ outputs: [START_OUTPUT] });
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
    const firstHarness = createHarness({ sessions: values, outputs: [START_OUTPUT] });
    const secondHarness = createHarness({
      sessions: values,
      outputs: [
        { ...START_OUTPUT, clientTransferId: "C".repeat(22), transferSessionId: "D".repeat(22) },
      ],
    });
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
    const harness = createHarness({ outputs: [] });
    harness.setStoredSessions([{ formatVersion: 1, clientTransferId: "bad" }]);
    await expect(harness.api.getSessions()).rejects.toThrow("new_key_transfer_journal_corrupt");

    const strictHarness = createHarness({ outputs: [START_OUTPUT] });
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
    expect(harness.targeted.at(-1)?.walletConnection).toEqual(WALLET_CONNECTION);
  });

  it("releases the recovery fence only after exact destination-key revocation is acknowledged", async () => {
    const harness = createHarness({ outputs: [START_OUTPUT] });
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
    // Clearing a transfer must not strand its bridge: the held session is closed and released, or
    // every later action would be refused as `mobile_bridge_session_already_active`.
    expect(harness.releasedSessions).toHaveLength(1);
  });

  it("discards the cleared transfer's start result so a later transfer can be started", async () => {
    // The shared AddKey journal has exactly ONE start-result slot and `rememberStartResult`
    // refuses to displace another transfer's, so a start result left behind by `clear()` rejects
    // every LATER transfer with `start_result_conflict` — after the wallet has already minted its
    // destination keys. Both of clear()'s fences have passed here, which is precisely the
    // condition under which discarding is safe.
    const harness = createHarness({ outputs: [START_OUTPUT, SECOND_START_OUTPUT] });
    await harness.api.start({
      clientTransferId: CLIENT_ID,
      targetPlatform: "web",
      accounts: START_INPUT.accounts,
    });
    expect((await harness.api.getRecoveryState()).startResult?.output.transferSessionId).toBe(
      SESSION_ID,
    );

    await harness.api.clear(CLIENT_ID);
    expect((await harness.api.getRecoveryState()).startResult).toBeNull();

    const second = await harness.api.start({
      clientTransferId: SECOND_CLIENT_ID,
      targetPlatform: "web",
      accounts: SECOND_START_INPUT.accounts,
    });
    expect(second.output.transferSessionId).toBe(SECOND_SESSION_ID);
    expect((await harness.api.getRecoveryState()).startResult?.output.transferSessionId).toBe(
      SECOND_SESSION_ID,
    );
  });

  it("keeps the session when the start result cannot be discarded, rather than half-clearing", async () => {
    const harness = createHarness({ outputs: [START_OUTPUT] });
    await harness.api.start({
      clientTransferId: CLIENT_ID,
      targetPlatform: "web",
      accounts: START_INPUT.accounts,
    });
    harness.storage.implementation.removeItem = async () => {
      throw new Error("storage unavailable");
    };

    await expect(harness.api.clear(CLIENT_ID)).rejects.toThrow(
      "new_key_transfer_start_result_discard_failed",
    );
    // A session row deleted on top of an undiscardable start result would be unrecoverable: the
    // transfer could no longer be resumed AND no later one could be started.
    expect((await harness.api.getSessions()).map((stored) => stored.clientTransferId)).toEqual([
      CLIENT_ID,
    ]);
  });

  it("never displaces ANOTHER transfer's journaled start result when clearing", async () => {
    // `clear()` owns the transfer it names and nothing else. A start result belonging to a
    // different transfer is live recoverable state — dropping it would strand that transfer's
    // destination keys exactly as the bug above stranded these.
    const harness = createHarness({ outputs: [START_OUTPUT] });
    await harness.api.start({
      clientTransferId: CLIENT_ID,
      targetPlatform: "web",
      accounts: START_INPUT.accounts,
    });
    // A second transfer that never reached the wallet: journaled sessions carry it, the shared
    // start-result slot still names the first.
    harness.setStoredSessions([
      ...(await harness.api.getSessions()),
      {
        formatVersion: 1,
        phase: "start_pending",
        targetPlatform: "web",
        clientTransferId: SECOND_CLIENT_ID,
        canonicalInputHash: hashNewKeyTransferStartInput(SECOND_START_INPUT),
        startRequest: SECOND_START_INPUT,
        addKeyIntentAccounts: [],
        verifiedAccounts: [],
        updatedAt: Date.now(),
      },
    ]);

    await harness.api.clear(SECOND_CLIENT_ID);

    expect((await harness.api.getRecoveryState()).startResult?.output.transferSessionId).toBe(
      SESSION_ID,
    );
    expect((await harness.api.getSessions()).map((stored) => stored.clientTransferId)).toEqual([
      CLIENT_ID,
    ]);
  });
});

describe("MeteorConnectNewKeyTransfer external-work hold", () => {
  it("journals the signed start result BEFORE beginning the hold, naming its exact hash", async () => {
    const harness = createHarness({ outputs: [START_OUTPUT] });
    const started = await harness.api.start({
      clientTransferId: CLIENT_ID,
      targetPlatform: "web",
      accounts: START_INPUT.accounts,
    });

    expect(started.externalWorkHeld).toBe(true);
    // The start action's profile is policy-derived (`external_work_v1` is its only one), so the
    // SDK never names it — and never closes the turn either.
    expect(harness.trace.createSessionInputs).toHaveLength(1);
    expect(harness.trace.createSessionInputs[0]?.resourceProfile).toBeUndefined();
    expect(harness.trace.closedReceipts).toHaveLength(0);
    expect(harness.trace.externalWorkHolds).toHaveLength(1);

    const held = harness.trace.externalWorkHolds[0]!;
    expect(held.journaledResultHash).toBe(held.receipt.resultHash);

    // Journal-before-hold: the durable record exists, and it is the record the hold verb named.
    const recovery = await harness.api.getRecoveryState();
    expect(recovery.startResult?.resultHash).toBe(held.receipt.resultHash);
    expect(recovery.startResult?.output).toEqual(START_OUTPUT);
    expect(recovery.orphanedSignedAddKey).toBe(false);
  });

  it("refuses the hold — and closes the turn — when the journal write fails", async () => {
    const harness = createHarness({ outputs: [START_OUTPUT] });
    harness.storage.implementation.setItem = async () => {
      throw new Error("quota exceeded");
    };
    await expect(
      harness.api.start({
        clientTransferId: CLIENT_ID,
        targetPlatform: "web",
        accounts: START_INPUT.accounts,
      }),
    ).rejects.toThrow();
    // No hold may begin without its journal, and the wallet's signed result is never left parked
    // in `result_ready`.
    expect(harness.trace.externalWorkHolds).toHaveLength(0);
    expect(harness.trace.closedReceipts).toHaveLength(1);
  });

  it("runs AddKey through the shared runner and installs verify on the SAME session", async () => {
    const harness = createHarness();
    await harness.api.start({
      clientTransferId: CLIENT_ID,
      targetPlatform: "web",
      accounts: START_INPUT.accounts,
    });

    const { chain, calls } = createChainDouble();
    const addKeys = await harness.api.runAddKeys({ transferSessionId: SESSION_ID, chain });
    expect(addKeys.verifyInput).toEqual(VERIFY_INPUT);
    // The runner's own ordering: read the journal, record intent, sign, broadcast — never a
    // replacement transaction after an ambiguous send.
    // The journal is read before the first chain call; intent is durable before signing; the
    // exact signed bytes are durable before broadcast; and finality is re-proven from the chain.
    expect(calls).toEqual(["getAccessKeys", "sign", "broadcast", "getAccessKeys"]);
    expect(addKeys.session.phase).toBe("add_key_in_progress");
    expect(addKeys.session.addKeyIntentAccounts).toEqual(["near::testnet::alice.testnet"]);

    const verified = await harness.api.verifyActive({
      transferSessionId: SESSION_ID,
      activations: addKeys.verifyInput.activations,
    });
    expect(verified.output).toEqual(VERIFY_OUTPUT);
    expect(verified.session.phase).toBe("destination_keys_verified");

    // One session, two turns: the verification turn was prepared against the held receipt, woke
    // the wallet for that turn, and only then was the session closed.
    expect(harness.trace.createSessionInputs).toHaveLength(1);
    expect(harness.trace.preparedActions).toEqual([{ sequence: 2, priorResultHash: hashFor(3) }]);
    expect(harness.trace.turnWakes).toBe(1);
    expect(harness.trace.closedReceipts.map((receipt) => receipt.sequence)).toEqual([2]);
    expect(harness.targeted.at(-1)?.continuedHold?.bridgeId).toBe("bridge-1");

    // The verification proof is durable before the turn is staged and cleared only once verified.
    expect((await harness.api.getRecoveryState()).pendingVerification).toBeNull();
  });

  it("recovers on a FRESH single_turn_v1 session when the hold is lost mid-flight", async () => {
    const harness = createHarness();
    await harness.api.start({
      clientTransferId: CLIENT_ID,
      targetPlatform: "web",
      accounts: START_INPUT.accounts,
    });
    const { chain } = createChainDouble();
    await harness.api.runAddKeys({ transferSessionId: SESSION_ID, chain });

    // Process loss: the memory-only partner secret — and with it the hold — is gone.
    harness.dropHold();
    (
      harness.api as unknown as { externalWorkHolds: Map<string, unknown> }
    ).externalWorkHolds.clear();

    const verified = await harness.api.verifyActive({
      transferSessionId: SESSION_ID,
      activations: VERIFY_INPUT.activations,
    });
    expect(verified.session.phase).toBe("destination_keys_verified");

    // A second, freshly created session — never a replayed lease — carrying the profile the SDK
    // must name explicitly (two are permitted), pinned to the exact wallet that minted the keys.
    expect(harness.trace.createSessionInputs).toHaveLength(2);
    const recovery = harness.trace.createSessionInputs[1]!;
    expect(recovery.resourceProfile).toBe(ESessionResourceProfile.single_turn_v1);
    expect(recovery.partnerRequestId).toBeUndefined();
    expect(recovery.clientConnectionInfo?.walletVerifyPublicKey).toBe(WALLET_VERIFY_KEY);
    expect(harness.trace.preparedActions).toHaveLength(0);
    expect(harness.targeted.at(-1)?.continuedHold).toBeUndefined();
  });

  it("refuses AddKey when the durable start-result journal does not bind this transfer", async () => {
    const harness = createHarness({ outputs: [START_OUTPUT] });
    await harness.api.start({
      clientTransferId: CLIENT_ID,
      targetPlatform: "web",
      accounts: START_INPUT.accounts,
    });
    // Lose the start-result record the way a cleared browser store would.
    await harness.storage.implementation.removeItem("met_data_newKeyTransferStartResultJournal");
    const { chain, calls } = createChainDouble();
    await expect(harness.api.runAddKeys({ transferSessionId: SESSION_ID, chain })).rejects.toThrow(
      "new_key_transfer_start_result_journal_missing",
    );
    expect(calls).toEqual([]);
  });
});
