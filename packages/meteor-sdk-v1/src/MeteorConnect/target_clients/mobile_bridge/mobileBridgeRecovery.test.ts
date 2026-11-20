import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
  type ICreatedPartnerSession,
  type IPartnerResumeTokenV1,
  type ISessionLinkStatus,
  type ISessionResultReceipt,
  type PartnerSessionClient,
  PartnerSessionResumeError,
  type TPartnerPairedWallet,
  type TValidatedSessionResult,
} from "@meteorwallet/connect";
import {
  act_impl_near,
  EBridgeLinkType,
  EMeteorAppId,
  ESessionPhase,
  EWalletPlatform,
  METEOR_WALLET_PROTOCOL_VERSION,
  type TSessionFacts,
} from "@meteorwallet/connect-shared";
import { hashCanonicalJsonSha256Base64 } from "@meteorwallet/connect-shared/internal";
import { KeyPair } from "@near-js/crypto";
import { base64 } from "@scure/base";
import { create_bun_test_local_storage } from "../../../ported_common/utils/storage/bun_test/create_bun_test_local_storage";
import { MeteorConnect } from "../../MeteorConnect";
import type {
  IMeteorConnectAccount,
  IMeteorConnectAccountIdentifier,
  IMeteorConnectRecoveredActionResult,
} from "../../MeteorConnect.types";
import { MemoryWebStorage } from "../../test/test_utils/memoryWebStorage";
import {
  createSessionClientDoubleBase,
  sessionFactsFor,
} from "../../test/test_utils/sessionClientDouble";
import {
  MeteorConnectMobileBridgeClient,
  recoveredOutcomeOf,
} from "./MeteorConnectMobileBridgeClient";
import type { IMobileBridgePreparedAction } from "./MeteorConnectMobileBridgeClient.types";
import { MOBILE_BRIDGE_ENDING, MobileBridgeSession } from "./MobileBridgeSession";
import {
  createBridgeEnvironmentId,
  createMobileBridgeStorage,
  createPendingRequestStore,
  type IMobileBridgePendingRequestRecord,
  type IMobileBridgePendingRequestStore,
} from "./mobileBridgeStorage";
import {
  createPendingRequestHandle,
  pendingActionMessageParams,
  pendingRequestToPreparedAction,
  preparedActionToPendingAction,
  sdkActionToMobileBridge,
} from "./sdkActionToMobileBridge";

/**
 * Reload recovery (MET-241): a page the browser reloaded while the user was in Meteor Mobile
 * collects the wallet's answer from its tab's pending-request record. Each "tab" below is a fresh
 * set of objects over one shared `sessionStorage`, which is exactly what survives a reload.
 */

const BACKEND_URL = "https://bridge.example";
const ENVIRONMENT_ID = createBridgeEnvironmentId(BACKEND_URL);
const ACCOUNT_ID = "alice.testnet";
const WALLET: TPartnerPairedWallet = {
  walletVerifyPublicKey: "ed25519::raw_base64::d2FsbGV0",
  walletExchangePublicKey: "x25519::raw_base64::d2FsbGV0",
  meteorAppId: EMeteorAppId.meteor_wallet_mobile_dev,
  pairedAt: 1,
  walletProtocolVersion: 2,
  walletCapabilities: [],
};
const RECEIPT = {
  bridgeId: "b1",
  sequence: 1,
  resultHash: "h",
} as unknown as ISessionResultReceipt;
const ACCOUNT_IDENTIFIER: IMeteorConnectAccountIdentifier = {
  blockchain: "near",
  network: "testnet",
  accountId: ACCOUNT_ID,
};
const SIGNED_IN_ACCOUNT = {
  identifier: ACCOUNT_IDENTIFIER,
  publicKeys: [],
  connection: { executionTarget: "v2_bridge_mobile" },
};

const tokenFor = (facts: TSessionFacts): IPartnerResumeTokenV1 =>
  ({
    v: 1,
    bridgeId: "b1",
    bridgeLease: "lease1",
    bridgeExchangePublicKey: "x25519::raw_base64::YnJpZGdl",
    encryptedBridgeSalt: { ciphertext: "c", iv: "i" },
    facts,
    partnerSecret: "secret value",
    partnerId: "partner-1",
    partnerRequestId: "sdk-request-id",
  }) as unknown as IPartnerResumeTokenV1;

const createdSession = (): ICreatedPartnerSession =>
  ({
    bridgeId: "b1",
    bridgeLease: "lease1",
    partnerId: "partner-1",
    partnerRequestId: "sdk-request-id",
    partnerSecret: "secret value",
    walletLinks: [
      {
        appId: EMeteorAppId.meteor_wallet_mobile_dev,
        walletName: "Meteor Mobile Dev",
        walletDescription: "dev",
        platform: EWalletPlatform.mobile,
        linkString: "meteorwalletdev://bridge_request?linkFormat=s1&bridgeId=b1",
        linkType: EBridgeLinkType.app_deep_link,
      },
    ],
    facts: sessionFactsFor(ESessionPhase.waiting_for_wallet),
    initialTurn: { envelope: {}, signatureBase64: "" },
  }) as unknown as ICreatedPartnerSession;

/**
 * A `PartnerSessionClient` double for both halves: the original tab (create + export the token)
 * and the reloaded one (resume + collect). Every facts-returning verb publishes before it resolves.
 */
function createClientDouble(
  options: {
    /** `false`: the client exports no token — any profile other than `single_turn_v1`. */
    exportsToken?: boolean;
    resumeError?: Error;
    /** The phase the realm projects right after a resume. */
    resumedPhase?: ESessionPhase;
    /** The wallet that claimed the session; the paired test wallet by default. */
    claimedWallet?: TPartnerPairedWallet;
    /**
     * The backend applies the acknowledgement, but its answer never reaches this page: the tab was
     * torn down (reloaded) while the verb was still in flight.
     */
    acknowledgementNeverReturns?: boolean;
  } = {},
) {
  const base = createSessionClientDoubleBase();
  const calls = {
    createSession: 0,
    resumeSession: [] as IPartnerResumeTokenV1[],
    acknowledged: 0,
    closed: 0,
  };
  let deliver!: (result: TValidatedSessionResult<unknown>) => void;
  const result = new Promise<TValidatedSessionResult<unknown>>((resolve) => {
    deliver = resolve;
  });
  const client = {
    backendUrl: BACKEND_URL,
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
    get claimedWallet(): TPartnerPairedWallet | undefined {
      return options.claimedWallet ?? WALLET;
    },
    clientPersistentId: "partner-1",
    hasPersistentClientId: () => true,
    getPairedWallets: async () => [WALLET],
    disconnectBridge: async () => {
      base.releaseBinding();
    },
    createSession: async (): Promise<ICreatedPartnerSession> => {
      calls.createSession += 1;
      const created = createdSession();
      base.publishFacts(created.facts);
      return created;
    },
    exportResumeToken: (): IPartnerResumeTokenV1 | undefined => {
      const facts = base.getSessionFacts();
      return options.exportsToken === false || facts == null ? undefined : tokenFor(facts);
    },
    resumeSession: async (token: IPartnerResumeTokenV1): Promise<TSessionFacts> => {
      calls.resumeSession.push(token);
      if (options.resumeError != null) throw options.resumeError;
      return base.publishFacts(
        sessionFactsFor(options.resumedPhase ?? ESessionPhase.wallet_action),
      );
    },
    notifyWalletForInitialClaim: async () => ({ delivered: true }),
    waitForValidatedResult: () => result,
    acknowledgeAndClose: base.verb(
      async () => {
        calls.acknowledged += 1;
        if (options.acknowledgementNeverReturns === true) await new Promise(() => {});
        return sessionFactsFor(ESessionPhase.closed);
      },
      { selfInitiated: true },
    ),
    closePhaseSafe: base.verb(
      async () => {
        calls.closed += 1;
        return sessionFactsFor(ESessionPhase.closed);
      },
      { selfInitiated: true },
    ),
  };
  return {
    client,
    calls,
    deliver,
    ok: (output: unknown) =>
      deliver({ status: "ok", output, receipt: RECEIPT } as TValidatedSessionResult<unknown>),
    decline: () =>
      deliver({
        status: "declined",
        errorIds: ["user_rejected"],
        errorMessage: "User rejected",
        receipt: RECEIPT,
      } as TValidatedSessionResult<unknown>),
    emit: base.emit,
  };
}

type TClientDouble = ReturnType<typeof createClientDouble>;

const signMessageRequest = () =>
  ({
    id: "near::sign_message",
    expandedInput: {
      account: { ...SIGNED_IN_ACCOUNT },
      messageParams: { message: "hello", recipient: "app.example", nonce: new Uint8Array(32) },
    },
  }) as never;

const signInWithKeyRequest = () =>
  ({
    id: "near::sign_in",
    expandedInput: {
      target: { blockchain: "near", network: "testnet" },
      contract: { id: "guestbook.testnet", methods: ["addMessage"] },
    },
  }) as never;

const verifyOwnerRequest = () =>
  ({
    id: "near::verify_owner",
    expandedInput: { account: { ...SIGNED_IN_ACCOUNT }, message: "owner?" },
  }) as never;

const verifyOwnerOutput = () => {
  const keyPair = KeyPair.fromRandom("ed25519");
  return {
    accountId: ACCOUNT_ID,
    message: "owner?",
    blockId: "block",
    publicKey: keyPair.getPublicKey().toString(),
    signature: base64.encode(new Uint8Array(64)),
  };
};

const signedMessageOutput = () => {
  const keyPair = KeyPair.fromRandom("ed25519");
  return {
    accountId: ACCOUNT_ID,
    publicKey: keyPair.getPublicKey().toString(),
    signature: base64.encode(new Uint8Array(64)),
  };
};

/** A store that records the order of its writes and removals, for the at-most-once checks. */
function createObservedStore() {
  const storage = new MemoryWebStorage();
  const store = createPendingRequestStore(ENVIRONMENT_ID, () => storage);
  return { storage, store };
}

function createSession(
  double: TClientDouble,
  prepared: IMobileBridgePreparedAction,
  store?: IMobileBridgePendingRequestStore,
  requestId = "request-1",
  persisted: Array<{ network: string; accountId: string; key: string }> = [],
): MobileBridgeSession {
  return new MobileBridgeSession({
    token: "tab-session",
    client: double.client as unknown as PartnerSessionClient,
    prepared,
    targetMeteorAppIds: [EMeteorAppId.meteor_wallet_mobile_dev],
    buildConnection: (wallet) => ({
      executionTarget: "v2_bridge_mobile",
      schemaVersion: 1,
      bridgeEnvironmentId: ENVIRONMENT_ID,
      meteorAppId: wallet.meteorAppId,
      partnerClientId: "partner-1",
      walletVerifyPublicKey: wallet.walletVerifyPublicKey,
    }),
    persistFunctionCallKey: async (network, accountId, keyPair) => {
      persisted.push({ network, accountId, key: keyPair.toString() });
    },
    isCurrent: () => true,
    assertIdentityGeneration: async () => {},
    acquireFirstPairingLease: async () => ({
      ownerToken: "lease",
      assertOwned: async () => {},
      release: async () => {},
    }),
    registerLiveSession: async () => ({ stop: async () => {} }),
    pendingRequest:
      store == null
        ? undefined
        : createPendingRequestHandle({
            store,
            requestId,
            prepared,
            meteorAppIds: [EMeteorAppId.meteor_wallet_mobile_dev],
          }),
  });
}

const settle = (session: MobileBridgeSession) =>
  session.awaitResult().then(
    (output: unknown) => ({ output }),
    (error: Error) => ({ error }),
  );

const flush = () => new Promise((resolve) => setTimeout(resolve, 5));

describe("MobileBridgeSession pending-request record", () => {
  it("is written after creation for a single-turn NEAR request, before the link is published", async () => {
    const double = createClientDouble();
    const { store } = createObservedStore();
    const prepared = await sdkActionToMobileBridge(signMessageRequest());
    const session = createSession(double, prepared, store);
    let recordWhenLinkPublished: IMobileBridgePendingRequestRecord | undefined;
    session.subscribe((snapshot) => {
      if (snapshot.deepLink != null && recordWhenLinkPublished == null) {
        recordWhenLinkPublished = store.read();
      }
    });

    await session.startPreparation();

    const record = store.read();
    if (record == null) throw new Error("no record written");
    expect(recordWhenLinkPublished?.requestId).toBe("request-1");
    expect(record.token.bridgeId).toBe("b1");
    expect(record.expiresAt).toBe(record.token.facts.absoluteExpiresAt);
    expect(record?.meteorAppIds).toEqual([EMeteorAppId.meteor_wallet_mobile_dev]);
    expect(record?.action.sdkActionId).toBe("near::sign_message");
    expect(record?.action.expandedInput).toEqual({ account: { identifier: ACCOUNT_IDENTIFIER } });
    expect(record?.functionCallKey).toBeUndefined();
  });

  it("is not written when the client exports no token (any other resource profile)", async () => {
    const double = createClientDouble({ exportsToken: false });
    const { storage, store } = createObservedStore();
    await createSession(
      double,
      await sdkActionToMobileBridge(signMessageRequest()),
      store,
    ).startPreparation();
    expect(storage.length).toBe(0);
  });

  it("is not written for an account transfer, nor with recovery switched off", async () => {
    const { storage, store } = createObservedStore();
    const transfer: IMobileBridgePreparedAction = {
      sdkRequest: { id: "meteor_wallet_core::transfer_accounts", expandedInput: {} } as never,
      actionRequest: { domain: "meteor_wallet_core", id: "transfer_accounts" } as never,
      actionInput: {},
      kind: { domain: "meteor_wallet_core", sharedActionId: "transfer_accounts" },
    };
    await createSession(createClientDouble(), transfer, store).startPreparation();
    await createSession(
      createClientDouble(),
      await sdkActionToMobileBridge(signMessageRequest()),
    ).startPreparation();
    expect(storage.length).toBe(0);
  });

  it("is removed before an in-memory answer is delivered — at most once", async () => {
    const double = createClientDouble();
    const { store } = createObservedStore();
    const session = createSession(
      double,
      await sdkActionToMobileBridge(signMessageRequest()),
      store,
    );
    const delivered = session.awaitResult().then(() => store.read());
    await session.startPreparation();
    expect(store.read()).toBeDefined();

    double.ok(signedMessageOutput());

    expect(await delivered).toBeUndefined();
    expect(double.calls.acknowledged).toBe(1);
  });

  it("is removed on a decline, a cancel, an abandonment and a disposal", async () => {
    const endings: Array<
      (session: MobileBridgeSession, double: TClientDouble) => Promise<unknown>
    > = [
      async (_session, double) => double.decline(),
      (session) => session.cancel(),
      (session) => session.abandon(),
      (session) => session.dispose(),
    ];
    for (const end of endings) {
      const double = createClientDouble();
      const { storage, store } = createObservedStore();
      const session = createSession(
        double,
        await sdkActionToMobileBridge(signMessageRequest()),
        store,
      );
      const outcome = settle(session);
      await session.startPreparation();
      expect(storage.length).toBe(1);
      await end(session, double);
      expect("error" in (await outcome)).toBe(true);
      expect(storage.length).toBe(0);
    }
  });

  it("keeps another request's record when this one ends", async () => {
    const { store } = createObservedStore();
    const first = createSession(
      createClientDouble(),
      await sdkActionToMobileBridge(signMessageRequest()),
      store,
      "first",
    );
    await first.startPreparation();
    const second = createSession(
      createClientDouble(),
      await sdkActionToMobileBridge(signMessageRequest()),
      store,
      "second",
    );
    await second.startPreparation();
    await first.dispose();
    expect(store.read()?.requestId).toBe("second");
  });

  it("keeps the wallet link it presents, without the secret its fragment carries", async () => {
    const { store } = createObservedStore();
    const session = createSession(
      createClientDouble(),
      await sdkActionToMobileBridge(signMessageRequest()),
      store,
    );
    await session.startPreparation();
    const link = createdSession().walletLinks[0];
    expect(store.read()?.walletLink).toEqual({
      linkString: link?.linkString ?? "",
      linkType: EBridgeLinkType.app_deep_link,
    });
    expect(JSON.stringify(store.read()?.walletLink)).not.toContain("secret");
    expect(session.getSnapshot().deepLink?.startsWith(link?.linkString ?? "-")).toBe(true);
  });

  it("carries a sign-in's new function-call key, so a recovered sign-in never strands it", async () => {
    const { store } = createObservedStore();
    const prepared = await sdkActionToMobileBridge(signInWithKeyRequest());
    const pendingKey =
      prepared.kind.domain === "near" ? prepared.kind.pendingFunctionCallKey : undefined;
    await createSession(createClientDouble(), prepared, store).startPreparation();
    expect(pendingKey).toBeDefined();
    if (pendingKey == null) throw new Error("the sign-in minted no key");
    expect(store.read()?.functionCallKey).toBe(pendingKey.toString());
  });
});

describe("MobileBridgeSession.startResume", () => {
  /** The original tab: create the session, then die without any teardown (the reload). */
  async function recordFromOriginalTab(request: never) {
    const { storage, store } = createObservedStore();
    const original = createSession(
      createClientDouble(),
      await sdkActionToMobileBridge(request),
      store,
    );
    await original.startPreparation();
    const record = store.read();
    if (record == null) throw new Error("no record written");
    return { storage, store, record };
  }

  it("collects the answer in the reloaded tab: no new session, one acknowledgement", async () => {
    const { storage, store, record } = await recordFromOriginalTab(signMessageRequest());
    const reloaded = createClientDouble();
    const session = createSession(
      reloaded,
      pendingRequestToPreparedAction(record),
      store,
      record.requestId,
    );
    const outcome = settle(session);

    await session.startResume(record.token);
    expect(reloaded.calls.resumeSession).toEqual([record.token]);
    reloaded.ok(signedMessageOutput());

    const settled = await outcome;
    expect("output" in settled && (settled.output as { accountId: string }).accountId).toBe(
      ACCOUNT_ID,
    );
    expect(reloaded.calls.createSession).toBe(0);
    expect(reloaded.calls.acknowledged).toBe(1);
    expect(storage.length).toBe(0);
    expect(session.getSnapshot().phase).toBe("completed");
  });

  it("publishes the original wallet link again, so the reloaded page can reopen the wallet", async () => {
    const { store, record } = await recordFromOriginalTab(signMessageRequest());
    const original = createSession(
      createClientDouble(),
      await sdkActionToMobileBridge(signMessageRequest()),
    );
    await original.startPreparation();
    const reloaded = createSession(
      createClientDouble(),
      pendingRequestToPreparedAction(record),
      store,
      record.requestId,
    );
    expect(reloaded.getSnapshot().deepLink).toBeUndefined();

    await reloaded.startResume(record.token, record.walletLink);

    const originalLink = original.getSnapshot().deepLink;
    if (originalLink == null || record.walletLink == null) throw new Error("no link recorded");
    expect(reloaded.getSnapshot().deepLink).toBe(originalLink);
    expect(reloaded.getSelectedWalletLink()).toEqual(record.walletLink);
    const opened: string[] = [];
    reloaded.openInApp((link) => {
      opened.push(link);
    });
    expect(opened).toEqual([originalLink]);
  });

  it("has no link to reopen for a record kept without one", async () => {
    const { store, record } = await recordFromOriginalTab(signMessageRequest());
    const session = createSession(
      createClientDouble(),
      pendingRequestToPreparedAction(record),
      store,
      record.requestId,
    );
    await session.startResume(record.token);
    expect(session.getSnapshot().deepLink).toBeUndefined();
    expect(() => session.openInApp(() => {})).toThrow("mobile_bridge_link_not_ready");
  });

  it("reports a decline signed while the page was gone as declined", async () => {
    const { storage, store, record } = await recordFromOriginalTab(signMessageRequest());
    const reloaded = createClientDouble();
    const session = createSession(
      reloaded,
      pendingRequestToPreparedAction(record),
      store,
      record.requestId,
    );
    const outcome = settle(session);
    await session.startResume(record.token);
    reloaded.decline();

    const settled = await outcome;
    expect("error" in settled && recoveredOutcomeOf(settled.error)).toBe("declined");
    expect(reloaded.calls.acknowledged).toBe(1);
    expect(storage.length).toBe(0);
  });

  it("reports a session the backend already released as expired", async () => {
    const { store, record } = await recordFromOriginalTab(signMessageRequest());
    const reloaded = createClientDouble();
    const session = createSession(
      reloaded,
      pendingRequestToPreparedAction(record),
      store,
      record.requestId,
    );
    const outcome = settle(session);
    await session.startResume(record.token);
    reloaded.emit("terminal", { outcome: { reason: "bridge_gone" } } as never);

    const settled = await outcome;
    expect("error" in settled && settled.error.message).toBe(MOBILE_BRIDGE_ENDING.expired);
    expect("error" in settled && recoveredOutcomeOf(settled.error)).toBe("expired");
  });

  it("fails cleanly, and drops the record, when the token can no longer be resumed", async () => {
    for (const [reason, expected] of [
      ["expired", "expired"],
      ["resume_context_missing", "failed"],
      ["partner_mismatch", "failed"],
    ] as const) {
      const { storage, store, record } = await recordFromOriginalTab(signMessageRequest());
      const reloaded = createClientDouble({
        resumeError: new PartnerSessionResumeError(reason, reason),
      });
      const session = createSession(
        reloaded,
        pendingRequestToPreparedAction(record),
        store,
        record.requestId,
      );
      const outcome = settle(session);
      await expect(session.startResume(record.token)).rejects.toThrow(reason);
      const settled = await outcome;
      expect("error" in settled && recoveredOutcomeOf(settled.error)).toBe(expected);
      expect(storage.length).toBe(0);
    }
  });

  it("keeps the record when another live page holds the session or the resume failed locally", async () => {
    for (const resumeError of [
      new PartnerSessionResumeError("owned_elsewhere", "owned_elsewhere"),
      new Error("mobile_bridge_lease_timeout"),
    ]) {
      const { storage, store, record } = await recordFromOriginalTab(signMessageRequest());
      const reloaded = createClientDouble({ resumeError });
      const session = createSession(
        reloaded,
        pendingRequestToPreparedAction(record),
        store,
        record.requestId,
      );
      const outcome = settle(session);
      await expect(session.startResume(record.token)).rejects.toThrow(resumeError.message);
      await outcome;
      await session.dispose();
      expect(store.read()?.requestId).toBe(record.requestId);
      expect(storage.length).toBe(1);
      expect(reloaded.calls.closed).toBe(0);
    }
  });

  it("persists the original sign-in's function-call key on a recovered sign-in", async () => {
    const { store, record } = await recordFromOriginalTab(signInWithKeyRequest());
    const reloaded = createClientDouble();
    const persisted: Array<{ network: string; accountId: string; key: string }> = [];
    const session = createSession(
      reloaded,
      pendingRequestToPreparedAction(record),
      store,
      record.requestId,
      persisted,
    );
    const outcome = settle(session);
    await session.startResume(record.token);
    reloaded.ok([{ accountId: ACCOUNT_ID }]);

    const settled = await outcome;
    const account = "output" in settled ? (settled.output as IMeteorConnectAccount) : undefined;
    expect(persisted).toEqual([
      { network: "testnet", accountId: ACCOUNT_ID, key: record.functionCallKey ?? "missing" },
    ]);
    expect(account?.publicKeys[0]?.publicKey).toBe(
      KeyPair.fromString(record.functionCallKey ?? "ed25519:")
        .getPublicKey()
        .toString(),
    );
  });
});

describe("an answer the page before the reload already acknowledged", () => {
  /**
   * The iPhone run of MET-241: the original tab collected the wallet's answer and sent the
   * acknowledgement, the backend applied it (the session is `closed` from then on), and the page was
   * reloaded before the verb returned. The record was never removed and the answer never delivered,
   * and the session the reloaded page would resume can no longer hand that answer out.
   */
  async function answeredThenReloaded(request: never, answer: (double: TClientDouble) => void) {
    const { storage, store } = createObservedStore();
    const original = createClientDouble({ acknowledgementNeverReturns: true });
    const first = createSession(original, await sdkActionToMobileBridge(request), store);
    void settle(first);
    await first.startPreparation();
    answer(original);
    await flush();
    expect(original.calls.acknowledged).toBe(1);
    const record = store.read();
    if (record == null) throw new Error("the record went before the acknowledgement returned");
    return { storage, store, record };
  }

  const recordedAnswerOf = (record: IMobileBridgePendingRequestRecord) => {
    if (record.answer == null) throw new Error("no answer was recorded");
    return record.answer;
  };

  it("records the answer, and the wallet that gave it, before acknowledging", async () => {
    const output = verifyOwnerOutput();
    const { record } = await answeredThenReloaded(verifyOwnerRequest(), (d) => d.ok(output));
    expect(record.answer).toEqual({
      status: "ok",
      output,
      wallet: {
        meteorAppId: WALLET.meteorAppId,
        walletVerifyPublicKey: WALLET.walletVerifyPublicKey,
      },
    });
  });

  it("delivers the recorded answer as success, without the bridge, exactly once", async () => {
    const output = verifyOwnerOutput();
    const { storage, store, record } = await answeredThenReloaded(verifyOwnerRequest(), (d) =>
      d.ok(output),
    );
    const reloaded = createClientDouble({ resumedPhase: ESessionPhase.closed });
    const session = createSession(
      reloaded,
      pendingRequestToPreparedAction(record),
      store,
      record.requestId,
    );
    const outcome = settle(session);
    await session.startFromRecordedAnswer(recordedAnswerOf(record));

    const settled = await outcome;
    if (!("output" in settled)) throw settled.error;
    expect((settled.output as { accountId: string }).accountId).toBe(ACCOUNT_ID);
    expect(reloaded.calls.resumeSession).toHaveLength(0);
    expect(reloaded.calls.acknowledged).toBe(0);
    expect(storage.length).toBe(0);
    expect(session.getSnapshot().phase).toBe("completed");
    expect(session.getCompletedConnection()?.walletVerifyPublicKey).toBe(
      WALLET.walletVerifyPublicKey,
    );
  });

  it("delivers a recorded decline as declined", async () => {
    const { store, record } = await answeredThenReloaded(verifyOwnerRequest(), (d) => d.decline());
    const session = createSession(
      createClientDouble(),
      pendingRequestToPreparedAction(record),
      store,
      record.requestId,
    );
    const outcome = settle(session);
    await session.startFromRecordedAnswer(recordedAnswerOf(record)).catch(() => {});
    const settled = await outcome;
    expect("error" in settled && recoveredOutcomeOf(settled.error)).toBe("declined");
  });

  it("persists the original sign-in's function-call key from a recorded answer", async () => {
    const { store, record } = await answeredThenReloaded(signInWithKeyRequest(), (d) =>
      d.ok([{ accountId: ACCOUNT_ID }]),
    );
    const persisted: Array<{ network: string; accountId: string; key: string }> = [];
    const session = createSession(
      createClientDouble(),
      pendingRequestToPreparedAction(record),
      store,
      record.requestId,
      persisted,
    );
    const outcome = settle(session);
    await session.startFromRecordedAnswer(recordedAnswerOf(record));
    const settled = await outcome;
    expect("output" in settled).toBe(true);
    expect(persisted).toEqual([
      { network: "testnet", accountId: ACCOUNT_ID, key: record.functionCallKey ?? "missing" },
    ]);
  });
});

describe("pending action round trip", () => {
  /** What `waitForValidatedResult` binds a result with: the hash of the serialized input. */
  const inputHash = (prepared: IMobileBridgePreparedAction): string => {
    if (prepared.kind.domain !== "near") throw new Error("near only");
    return hashCanonicalJsonSha256Base64(
      act_impl_near
        .actionForId(prepared.kind.sharedActionId)
        .serializeInput(prepared.actionInput as never),
    );
  };

  const functionCall = {
    functionCall: {
      methodName: "addMessage",
      args: new TextEncoder().encode(JSON.stringify({ text: "hi" })),
      gas: 30_000_000_000_000n,
      deposit: 0n,
    },
  };
  const requests: Array<{ id: string; expandedInput: unknown }> = [
    signInWithKeyRequest(),
    { id: "near::sign_in", expandedInput: { target: { blockchain: "near", network: "testnet" } } },
    {
      id: "near::sign_in_and_sign_message",
      expandedInput: {
        target: { blockchain: "near", network: "testnet" },
        messageParams: {
          message: "m",
          recipient: "r",
          nonce: new Uint8Array(32).fill(7),
          state: "s",
        },
      },
    },
    signMessageRequest(),
    { id: "near::sign_out", expandedInput: { account: SIGNED_IN_ACCOUNT } },
    {
      id: "near::sign_transactions",
      expandedInput: {
        account: SIGNED_IN_ACCOUNT,
        transactions: [{ receiverId: "guestbook.testnet", actions: [functionCall] }],
      },
    },
    {
      id: "near::sign_transactions",
      expandedInput: {
        account: SIGNED_IN_ACCOUNT,
        transactions: [
          { receiverId: "guestbook.testnet", actions: [functionCall] },
          { receiverId: "bob.testnet", actions: [{ transfer: { deposit: 1n } }] },
        ],
      },
    },
    {
      id: "near::sign_delegate_actions",
      expandedInput: {
        account: SIGNED_IN_ACCOUNT,
        delegateActions: [{ receiverId: "guestbook.testnet", actions: [functionCall] }],
      },
    },
    { id: "near::verify_owner", expandedInput: { account: SIGNED_IN_ACCOUNT, message: "owner?" } },
  ];

  for (const request of requests) {
    it(`binds a recovered ${request.id} answer to the request that was staged`, async () => {
      const prepared = await sdkActionToMobileBridge(request as never);
      const pending = preparedActionToPendingAction(prepared);
      if (pending == null) throw new Error("not recoverable");
      // Exactly what sessionStorage hands back after the reload.
      const record: IMobileBridgePendingRequestRecord = JSON.parse(
        JSON.stringify({
          v: 1,
          requestId: "r",
          createdAt: 0,
          expiresAt: 1,
          meteorAppIds: [EMeteorAppId.meteor_wallet_mobile_dev],
          token: {},
          ...pending,
        }),
      );
      const restored = pendingRequestToPreparedAction(record);
      expect(inputHash(restored)).toBe(inputHash(prepared));
      expect(restored.kind).toEqual(prepared.kind);
      expect(restored.actionRequest).toEqual(JSON.parse(JSON.stringify(prepared.actionRequest)));
    });
  }

  it("reads back the NEP-413 params a sign-message request staged, and nothing for other actions", async () => {
    const nonce = new Uint8Array(32).fill(9);
    const roundTrip = async (request: unknown) => {
      const pending = preparedActionToPendingAction(
        await sdkActionToMobileBridge(request as never),
      );
      if (pending == null) throw new Error("not recoverable");
      return pendingActionMessageParams(JSON.parse(JSON.stringify(pending.action)));
    };
    expect(
      await roundTrip({
        id: "near::sign_message",
        expandedInput: {
          account: SIGNED_IN_ACCOUNT,
          messageParams: { message: "hello", recipient: "app.example", nonce },
        },
      }),
    ).toEqual({ message: "hello", recipient: "app.example", nonce });
    expect(
      await roundTrip({
        id: "near::sign_in_and_sign_message",
        expandedInput: {
          target: { blockchain: "near", network: "testnet" },
          messageParams: { message: "m", recipient: "r", nonce, state: "s" },
        },
      }),
    ).toEqual({ message: "m", recipient: "r", nonce });
    expect(await roundTrip(verifyOwnerRequest())).toBeUndefined();
    expect(await roundTrip(signInWithKeyRequest())).toBeUndefined();
  });

  it("reads no message params from a staged input of the wrong shape", async () => {
    const pending = preparedActionToPendingAction(
      await sdkActionToMobileBridge(signMessageRequest()),
    );
    if (pending == null) throw new Error("not recoverable");
    for (const actionInput of [null, "x", { message: "m", recipient: "r" }, { message: 1 }]) {
      expect(pendingActionMessageParams({ ...pending.action, actionInput })).toBeUndefined();
    }
    expect(
      pendingActionMessageParams({
        ...pending.action,
        actionInput: { message: "m", recipient: "r", nonceBase64: "%%%" },
      }),
    ).toBeUndefined();
  });

  it("does not record the transfer families", async () => {
    const prepared: IMobileBridgePreparedAction = {
      sdkRequest: {
        id: "meteor_wallet_core::new_key_account_transfer_start",
        expandedInput: {},
      } as never,
      actionRequest: {} as never,
      actionInput: {},
      kind: { domain: "meteor_wallet_core", sharedActionId: "new_key_account_transfer_start" },
    };
    expect(preparedActionToPendingAction(prepared)).toBeUndefined();
  });
});

//
// The client: recovery at start-up, the listener, and the account effects
//

function createBridgeClientHarness(
  double: TClientDouble,
  options: {
    recoverAfterReload?: boolean;
    enabled?: boolean;
    /** Replaces the account store's sign-in write (e.g. to make it fail). */
    addSignedInAccount?: (account: IMeteorConnectAccount) => Promise<void>;
    /** Replaces the live-session registration a resume starts with (e.g. to make it fail). */
    registerLiveSession?: () => Promise<{ stop: () => Promise<void> }>;
    /** Every link the SDK opens the wallet with. */
    openedLinks?: string[];
  } = {},
) {
  const accounts: IMeteorConnectAccount[] = [];
  const keys: Array<{ network: string; accountId: string; key: string }> = [];
  const sameIdentifier = (a: IMeteorConnectAccountIdentifier, b: IMeteorConnectAccountIdentifier) =>
    a.accountId === b.accountId && a.network === b.network && a.blockchain === b.blockchain;
  const meteorConnect = {
    isDevelopment: false,
    nearKeyStoreProvider: {
      getKeyStore: () => ({
        setKey: async (network: string, accountId: string, keyPair: KeyPair) => {
          keys.push({ network, accountId, key: keyPair.toString() });
        },
      }),
    },
    addSignedInAccount:
      options.addSignedInAccount ??
      (async (account: IMeteorConnectAccount) => {
        accounts.push(account);
      }),
    removeSignedInAccount: async (identifier: IMeteorConnectAccountIdentifier) => {
      const index = accounts.findIndex((account) => sameIdentifier(account.identifier, identifier));
      if (index >= 0) accounts.splice(index, 1);
    },
    getAccount: async (identifier: IMeteorConnectAccountIdentifier) =>
      accounts.find((account) => sameIdentifier(account.identifier, identifier)),
    updateSignedInAccountConnection: async (updated: IMeteorConnectAccount) => {
      for (const account of accounts) {
        if (sameIdentifier(account.identifier, updated.identifier)) {
          account.connection = updated.connection;
        }
      }
    },
  };
  const durable = new Map<string, string>();
  const localStorageInterface = {
    getItem: async (key: string) => durable.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      durable.set(key, value);
    },
    removeItem: async (key: string) => {
      durable.delete(key);
    },
    getKeys: async (prefix?: string) =>
      [...durable.keys()].filter((key) => key.startsWith(prefix ?? "")),
  };
  const client = new MeteorConnectMobileBridgeClient(meteorConnect as unknown as MeteorConnect);
  client.configure(
    {
      enabled: options.enabled ?? true,
      backendUrl: BACKEND_URL,
      meteorAppId: EMeteorAppId.meteor_wallet_mobile_dev,
      autoOpenPairedWallet: false,
      recoverAfterReload: options.recoverAfterReload,
      nativeAppOpener: {
        open: (link) => {
          options.openedLinks?.push(link);
        },
      },
    },
    localStorageInterface,
  );
  // Everything `initializeBridgeClient` would build, with the session client replaced by the
  // double — the real one needs a backend.
  const lease = { ownerToken: "lease", assertOwned: async () => {}, release: async () => {} };
  Object.assign(client as unknown as Record<string, unknown>, {
    bridgeTarget: { backendUrl: BACKEND_URL, meteorAppId: EMeteorAppId.meteor_wallet_mobile_dev },
    storage: {
      ...createMobileBridgeStorage(localStorageInterface, BACKEND_URL),
      registerLiveSession: options.registerLiveSession ?? (async () => ({ stop: async () => {} })),
    },
    sessionClient: double.client,
    leaseProvider: { acquire: async () => lease },
    fencingGeneration: 0,
    initializePromise: Promise.resolve(),
  });
  return { client, accounts, keys };
}

describe("MeteorConnectMobileBridgeClient reload recovery", () => {
  let tabStorage: MemoryWebStorage;
  const globals = globalThis as { sessionStorage?: Storage };
  const originalSessionStorage = globals.sessionStorage;

  beforeEach(() => {
    tabStorage = new MemoryWebStorage();
    globals.sessionStorage = tabStorage;
  });
  afterEach(() => {
    if (originalSessionStorage == null) delete globals.sessionStorage;
    else globals.sessionStorage = originalSessionStorage;
  });

  /** The original tab sends `request`, then the page dies with the wallet holding it. */
  async function originalTabSends(request: never, requestId: string) {
    const tab = createBridgeClientHarness(createClientDouble());
    const session = await tab.client.prepareRequest(request, undefined, { requestId });
    await session.startPreparation();
    expect(tabStorage.length).toBe(1);
    return session;
  }

  it("recovers a sign-in: persists the key, adds the account, reports it exactly once", async () => {
    const original = await originalTabSends(signInWithKeyRequest(), "sign-in-1");
    const originalKey =
      original.prepared.kind.domain === "near"
        ? original.prepared.kind.pendingFunctionCallKey?.toString()
        : undefined;

    const reloaded = createClientDouble();
    const tab = createBridgeClientHarness(reloaded);
    const recovery = tab.client.recoverPendingRequest();
    // A second start (a double initialize) is the same recovery, never a second resume.
    expect(tab.client.recoverPendingRequest()).toBe(recovery);
    await flush();
    reloaded.ok([{ accountId: ACCOUNT_ID }]);
    await recovery;

    expect(reloaded.calls.resumeSession).toHaveLength(1);
    expect(reloaded.calls.createSession).toBe(0);
    expect(reloaded.calls.acknowledged).toBe(1);
    expect(tab.keys).toEqual([
      { network: "testnet", accountId: ACCOUNT_ID, key: originalKey ?? "" },
    ]);
    expect(tab.accounts.map((account) => account.identifier)).toEqual([ACCOUNT_IDENTIFIER]);
    expect(tab.accounts[0]?.publicKeys.map((key) => key.publicKey)).toEqual([
      KeyPair.fromString(originalKey ?? "ed25519:")
        .getPublicKey()
        .toString(),
    ]);
    expect(tabStorage.length).toBe(0);

    // A listener that subscribes late still hears of it, once; a second one does not.
    const heard: IMeteorConnectRecoveredActionResult[] = [];
    tab.client.onRecoveredActionResult((result) => heard.push(result));
    tab.client.onRecoveredActionResult((result) => heard.push(result));
    expect(heard).toHaveLength(1);
    expect(heard[0]).toMatchObject({
      requestId: "sign-in-1",
      actionId: "near::sign_in",
      outcome: "success",
    });
    expect(await tab.client.getRecoveredResults()).toHaveLength(1);
  });

  it("delivers to a listener that was already subscribed, and refreshes the account's connection", async () => {
    await originalTabSends(signMessageRequest(), "message-1");
    const reloaded = createClientDouble();
    const tab = createBridgeClientHarness(reloaded);
    tab.accounts.push({
      identifier: ACCOUNT_IDENTIFIER,
      publicKeys: [],
      connection: { executionTarget: "v1_web" } as never,
    });
    const heard: IMeteorConnectRecoveredActionResult[] = [];
    tab.client.onRecoveredActionResult((result) => heard.push(result));

    const recovery = tab.client.recoverPendingRequest();
    await flush();
    reloaded.ok(signedMessageOutput());
    await recovery;

    expect(heard.map((result) => [result.requestId, result.outcome])).toEqual([
      ["message-1", "success"],
    ]);
    expect(tab.accounts[0]?.connection.executionTarget).toBe("v2_bridge_mobile");
  });

  it("recovers an answer the page acknowledged just before it was reloaded as success, not cancelled", async () => {
    // The original page: the wallet answered, the acknowledgement reached the backend (which
    // closed the session), and the page was reloaded before that verb returned.
    const original = createClientDouble({ acknowledgementNeverReturns: true });
    const first = createBridgeClientHarness(original);
    const sent = await first.client.prepareRequest(verifyOwnerRequest(), undefined, {
      requestId: "verify-1",
    });
    await sent.startPreparation();
    original.ok(verifyOwnerOutput());
    await flush();
    expect(original.calls.acknowledged).toBe(1);
    expect(tabStorage.length).toBe(1);

    // The reloaded page: the session it would resume is already closed by that acknowledgement.
    const reloaded = createClientDouble({ resumedPhase: ESessionPhase.closed });
    const tab = createBridgeClientHarness(reloaded);
    tab.accounts.push({
      identifier: ACCOUNT_IDENTIFIER,
      publicKeys: [],
      connection: { executionTarget: "v1_web" } as never,
    });
    await tab.client.recoverPendingRequest();

    const results = await tab.client.getRecoveredResults();
    expect(results.map((result) => [result.requestId, result.actionId, result.outcome])).toEqual([
      ["verify-1", "near::verify_owner", "success"],
    ]);
    expect((results[0]?.output as { accountId: string }).accountId).toBe(ACCOUNT_ID);
    expect(reloaded.calls.resumeSession).toHaveLength(0);
    expect(tab.accounts[0]?.connection.executionTarget).toBe("v2_bridge_mobile");
    expect(tabStorage.length).toBe(0);
    expect(tab.client.getCurrentSession()).toBeUndefined();
  });

  it("delivers a recorded answer even once the record is past its deadline", async () => {
    const original = createClientDouble({ acknowledgementNeverReturns: true });
    const first = createBridgeClientHarness(original);
    const sent = await first.client.prepareRequest(signMessageRequest(), undefined, {
      requestId: "late-answered",
    });
    await sent.startPreparation();
    original.ok(signedMessageOutput());
    await flush();
    const key = [...tabStorage.map.keys()][0] ?? "";
    const stored = JSON.parse(tabStorage.getItem(key) ?? "{}");
    tabStorage.setItem(key, JSON.stringify({ ...stored, expiresAt: Date.now() - 1 }));

    const reloaded = createClientDouble();
    const tab = createBridgeClientHarness(reloaded);
    await tab.client.recoverPendingRequest();

    const [result] = await tab.client.getRecoveredResults();
    expect(result).toMatchObject({ requestId: "late-answered", outcome: "success" });
    expect(reloaded.calls.resumeSession).toHaveLength(0);
    expect(tabStorage.length).toBe(0);
  });

  it("reports a record past its deadline as expired without touching the bridge", async () => {
    await originalTabSends(signMessageRequest(), "late-1");
    const key = [...tabStorage.map.keys()][0] ?? "";
    const stored = JSON.parse(tabStorage.getItem(key) ?? "{}");
    tabStorage.setItem(key, JSON.stringify({ ...stored, expiresAt: Date.now() - 1 }));

    const reloaded = createClientDouble();
    const tab = createBridgeClientHarness(reloaded);
    await tab.client.recoverPendingRequest();

    expect(reloaded.calls.resumeSession).toHaveLength(0);
    const [result] = await tab.client.getRecoveredResults();
    expect(result).toMatchObject({ requestId: "late-1", outcome: "expired" });
    expect(tabStorage.length).toBe(0);
  });

  it("makes a new request wait for a recovered one the wallet is still answering", async () => {
    await originalTabSends(signMessageRequest(), "message-1");
    const reloaded = createClientDouble({ resumedPhase: ESessionPhase.wallet_action });
    const tab = createBridgeClientHarness(reloaded);
    const recovery = tab.client.recoverPendingRequest();
    await flush();

    const next = tab.client.prepareRequest(signMessageRequest(), undefined, { requestId: "next" });
    await flush();
    expect(reloaded.calls.createSession).toBe(0);

    reloaded.ok(signedMessageOutput());
    await recovery;
    const session = await next;
    await session.startPreparation();
    expect(reloaded.calls.createSession).toBe(1);
    expect(createPendingRequestStore(ENVIRONMENT_ID).read()?.requestId).toBe("next");
  });

  it("is switched off, and withdraws what an earlier page kept, with recoverAfterReload: false", async () => {
    await originalTabSends(signMessageRequest(), "message-1");
    const reloaded = createClientDouble();
    const tab = createBridgeClientHarness(reloaded, { recoverAfterReload: false });
    await tab.client.recoverPendingRequest();
    expect(tabStorage.length).toBe(0);
    expect(reloaded.calls.resumeSession).toHaveLength(0);
    expect(await tab.client.getRecoveredResults()).toEqual([]);

    const session = await tab.client.prepareRequest(signMessageRequest(), undefined, {
      requestId: "unrecorded",
    });
    await session.startPreparation();
    expect(tabStorage.length).toBe(0);
  });

  it("starts from MeteorConnect.initialize and reports through its public API", async () => {
    const original = await originalTabSends(signMessageRequest(), "from-initialize");
    const key = [...tabStorage.map.keys()][0] ?? "";
    const stored = JSON.parse(tabStorage.getItem(key) ?? "{}");
    // Past its deadline, so the recovery settles without a backend.
    tabStorage.setItem(key, JSON.stringify({ ...stored, expiresAt: Date.now() - 1 }));
    expect(original.prepared.sdkRequest.id).toBe("near::sign_message");

    const meteorConnect = new MeteorConnect();
    meteorConnect.setLoggingLevel("none");
    const heard: IMeteorConnectRecoveredActionResult[] = [];
    const unsubscribe = meteorConnect.onRecoveredActionResult((result) => heard.push(result));
    await meteorConnect.initialize({
      storage: create_bun_test_local_storage(),
      mobileBridge: { enabled: true, backendUrl: BACKEND_URL },
    });

    const results = await meteorConnect.getRecoveredResults();
    unsubscribe();
    expect(results.map((result) => [result.requestId, result.outcome])).toEqual([
      ["from-initialize", "expired"],
    ]);
    expect(heard).toEqual(results);
    expect(tabStorage.length).toBe(0);
    expect(await meteorConnect.getRecoveringRequest()).toBeUndefined();
  });

  it("claims the session client for recovery even when initialize never started it", async () => {
    await originalTabSends(signMessageRequest(), "message-1");
    const reloaded = createClientDouble({ resumedPhase: ESessionPhase.wallet_action });
    const tab = createBridgeClientHarness(reloaded);
    const heard: IMeteorConnectRecoveredActionResult[] = [];
    tab.client.onRecoveredActionResult((result) => heard.push(result));

    // No `recoverPendingRequest()` first: an unawaited (or failed) `MeteorConnect.initialize`.
    const next = tab.client.prepareRequest(signMessageRequest(), undefined, { requestId: "next" });
    await flush();
    expect(reloaded.calls.resumeSession).toHaveLength(1);
    expect(reloaded.calls.createSession).toBe(0);

    reloaded.ok(signedMessageOutput());
    const session = await next;
    await session.startPreparation();
    expect(heard.map((result) => [result.requestId, result.outcome])).toEqual([
      ["message-1", "success"],
    ]);
    expect(reloaded.calls.createSession).toBe(1);
    expect(tab.client.getCurrentSession()).toBe(session);
  });

  it("keeps the original request's wallet pin: another wallet's answer is not applied", async () => {
    await originalTabSends(signMessageRequest(), "pinned-1");
    const key = [...tabStorage.map.keys()][0] ?? "";
    const stored = JSON.parse(tabStorage.getItem(key) ?? "{}");
    tabStorage.setItem(
      key,
      JSON.stringify({ ...stored, expectedWalletVerifyPublicKey: WALLET.walletVerifyPublicKey }),
    );

    const reloaded = createClientDouble({
      claimedWallet: { ...WALLET, walletVerifyPublicKey: "ed25519::raw_base64::b3RoZXI" },
    });
    const tab = createBridgeClientHarness(reloaded);
    tab.accounts.push({
      identifier: ACCOUNT_IDENTIFIER,
      publicKeys: [],
      connection: { executionTarget: "v1_web" } as never,
    });
    const recovery = tab.client.recoverPendingRequest();
    await flush();
    reloaded.ok(signedMessageOutput());
    await recovery;

    const [result] = await tab.client.getRecoveredResults();
    expect(result).toMatchObject({ requestId: "pinned-1", outcome: "failed" });
    expect(tab.accounts[0]?.connection.executionTarget).toBe("v1_web");
  });

  it("writes the wallet pin of a request for a paired mobile account into the record", async () => {
    const double = createClientDouble();
    // A wallet on the current protocol, so the request is pushed to it (and pinned).
    double.client.getPairedWallets = async () => [
      { ...WALLET, walletProtocolVersion: METEOR_WALLET_PROTOCOL_VERSION },
    ];
    const tab = createBridgeClientHarness(double);
    const connection = {
      executionTarget: "v2_bridge_mobile",
      schemaVersion: 1,
      bridgeEnvironmentId: ENVIRONMENT_ID,
      meteorAppId: WALLET.meteorAppId,
      partnerClientId: "partner-1",
      walletVerifyPublicKey: WALLET.walletVerifyPublicKey,
    };
    const request = {
      id: "near::sign_message",
      expandedInput: {
        account: { ...SIGNED_IN_ACCOUNT, connection },
        messageParams: { message: "hello", recipient: "app.example", nonce: new Uint8Array(32) },
      },
    } as never;
    const session = await tab.client.prepareRequest(request, undefined, { requestId: "pin" });
    await session.startPreparation();
    expect(createPendingRequestStore(ENVIRONMENT_ID).read()?.expectedWalletVerifyPublicKey).toBe(
      WALLET.walletVerifyPublicKey,
    );
  });

  it("stays silent, keeps the record and closes nothing when another live page holds it", async () => {
    await originalTabSends(signMessageRequest(), "duplicate-1");
    const reloaded = createClientDouble({
      resumeError: new PartnerSessionResumeError("owned_elsewhere", "owned_elsewhere"),
    });
    const tab = createBridgeClientHarness(reloaded);
    const heard: IMeteorConnectRecoveredActionResult[] = [];
    tab.client.onRecoveredActionResult((result) => heard.push(result));
    await tab.client.recoverPendingRequest();

    expect(heard).toEqual([]);
    expect(await tab.client.getRecoveredResults()).toEqual([]);
    expect(createPendingRequestStore(ENVIRONMENT_ID).read()?.requestId).toBe("duplicate-1");
    expect(reloaded.calls.closed).toBe(0);
    expect(tab.client.getCurrentSession()).toBeUndefined();
  });

  it("reports a local setup failure as failed but keeps the record for a later load", async () => {
    await originalTabSends(signMessageRequest(), "transient-1");
    const reloaded = createClientDouble();
    const tab = createBridgeClientHarness(reloaded, {
      registerLiveSession: async () => {
        throw new Error("mobile_bridge_lease_timeout");
      },
    });
    await tab.client.recoverPendingRequest();

    const [result] = await tab.client.getRecoveredResults();
    expect(result).toMatchObject({ requestId: "transient-1", outcome: "failed" });
    expect(reloaded.calls.resumeSession).toHaveLength(0);
    expect(createPendingRequestStore(ENVIRONMENT_ID).read()?.requestId).toBe("transient-1");
  });

  it("still reports a collected answer as success when the account store write fails", async () => {
    await originalTabSends(signInWithKeyRequest(), "sign-in-2");
    const reloaded = createClientDouble();
    const tab = createBridgeClientHarness(reloaded, {
      addSignedInAccount: async () => {
        throw new Error("storage full");
      },
    });
    const recovery = tab.client.recoverPendingRequest();
    await flush();
    reloaded.ok([{ accountId: ACCOUNT_ID }]);
    await recovery;

    const [result] = await tab.client.getRecoveredResults();
    expect(result).toMatchObject({ requestId: "sign-in-2", outcome: "success" });
    expect(result?.output).toBeDefined();
    // The key reached the key store before the account write failed: nothing is stranded.
    expect(tab.keys).toHaveLength(1);
  });

  it("refuses to dispose while a recovered request is being collected", async () => {
    await originalTabSends(signMessageRequest(), "message-1");
    const reloaded = createClientDouble();
    const tab = createBridgeClientHarness(reloaded);
    const recovery = tab.client.recoverPendingRequest();
    await flush();

    await expect(tab.client.dispose()).rejects.toThrow("mobile_bridge_dispose_during_recovery");
    expect(createPendingRequestStore(ENVIRONMENT_ID).read()?.requestId).toBe("message-1");

    reloaded.ok(signedMessageOutput());
    await recovery;
    await tab.client.dispose();
    const [result] = await tab.client.getRecoveredResults();
    expect(result).toMatchObject({ requestId: "message-1", outcome: "success" });
  });

  it("creates no session for a request cancelled while it waited for recovery", async () => {
    await originalTabSends(signMessageRequest(), "message-1");
    const reloaded = createClientDouble({ resumedPhase: ESessionPhase.wallet_action });
    const tab = createBridgeClientHarness(reloaded);
    let cancelled = false;
    const next = tab.client.prepareRequest(signMessageRequest(), undefined, {
      requestId: "next",
      isCancelled: () => cancelled,
    });
    await flush();
    cancelled = true;
    reloaded.ok(signedMessageOutput());

    await expect(next).rejects.toThrow("Action was cancelled");
    expect(reloaded.calls.createSession).toBe(0);
    expect(tabStorage.length).toBe(0);
  });

  it("withdraws a kept record when the mobile bridge is now disabled", async () => {
    await originalTabSends(signMessageRequest(), "message-1");
    const reloaded = createClientDouble();
    const tab = createBridgeClientHarness(reloaded, { enabled: false });
    await tab.client.recoverPendingRequest();
    expect(tabStorage.length).toBe(0);
    expect(reloaded.calls.resumeSession).toHaveLength(0);
    expect(await tab.client.getRecoveredResults()).toEqual([]);
  });

  it("hands back the recovered sign-message's params, so the page can verify the signature", async () => {
    await originalTabSends(signMessageRequest(), "message-params");
    const reloaded = createClientDouble();
    const tab = createBridgeClientHarness(reloaded);
    const recovery = tab.client.recoverPendingRequest();
    await flush();
    reloaded.ok(signedMessageOutput());
    await recovery;

    const [result] = await tab.client.getRecoveredResults();
    expect(result).toMatchObject({ requestId: "message-params", outcome: "success" });
    expect(result?.messageParams).toEqual({
      message: "hello",
      recipient: "app.example",
      nonce: new Uint8Array(32),
    });
  });

  describe("a recovered request the wallet has not answered", () => {
    async function recovering(options: { withoutWalletLink?: boolean } = {}) {
      await originalTabSends(signMessageRequest(), "stuck-1");
      if (options.withoutWalletLink === true) {
        const key = [...tabStorage.map.keys()][0] ?? "";
        const { walletLink: _dropped, ...stored } = JSON.parse(tabStorage.getItem(key) ?? "{}");
        tabStorage.setItem(key, JSON.stringify(stored));
      }
      const reloaded = createClientDouble({ resumedPhase: ESessionPhase.wallet_action });
      const openedLinks: string[] = [];
      const tab = createBridgeClientHarness(reloaded, { openedLinks });
      const heard: IMeteorConnectRecoveredActionResult[] = [];
      tab.client.onRecoveredActionResult((result) => heard.push(result));
      const recovery = tab.client.recoverPendingRequest();
      const handle = await tab.client.getRecoveringRequest();
      if (handle == null) throw new Error("no recovering request");
      return { reloaded, tab, heard, recovery, handle, openedLinks };
    }

    it("is described once it has been re-entered", async () => {
      const { reloaded, handle, tab } = await recovering();
      expect(reloaded.calls.resumeSession).toHaveLength(1);
      expect(handle).toMatchObject({
        requestId: "stuck-1",
        actionId: "near::sign_message",
        canOpenInWallet: true,
      });
      // The idle deadline runs out first; the absolute one is only the hard wall.
      const snapshot = tab.client.getCurrentSession()?.getSnapshot();
      expect(handle.expiresAt).toBe(snapshot?.idleExpiresAt ?? -1);
      expect(handle.expiresAt).toBeLessThan(snapshot?.absoluteExpiresAt ?? -1);
    });

    it("reopens the wallet on the same request through the configured opener", async () => {
      const { handle, openedLinks, tab } = await recovering();
      await handle.openInWallet();
      expect(openedLinks).toHaveLength(1);
      expect(openedLinks[0]).toBe(tab.client.getCurrentSession()?.getSnapshot().deepLink ?? "-");
      expect(openedLinks[0]?.startsWith(createdSession().walletLinks[0]?.linkString ?? "-")).toBe(
        true,
      );
    });

    it("is cancelled on request: closed, reported as cancelled, and out of the way", async () => {
      const { reloaded, tab, heard, recovery, handle } = await recovering();
      await handle.cancel();

      expect(reloaded.calls.closed).toBe(1);
      expect(heard.map((result) => [result.requestId, result.outcome])).toEqual([
        ["stuck-1", "cancelled"],
      ]);
      await recovery;
      expect(tabStorage.length).toBe(0);
      expect(tab.client.getCurrentSession()).toBeUndefined();
      expect(await tab.client.getRecoveringRequest()).toBeUndefined();
      expect(() => handle.openInWallet()).toThrow("mobile_bridge_recovered_request_settled");
      // A second cancel is a no-op, and a new request starts at once.
      await handle.cancel();
      expect(reloaded.calls.closed).toBe(1);
      const next = await tab.client.prepareRequest(signMessageRequest(), undefined, {
        requestId: "next",
      });
      await next.startPreparation();
      expect(reloaded.calls.createSession).toBe(1);
    });

    it("sends one close verb for a double tap", async () => {
      const { reloaded, heard, handle } = await recovering();
      await Promise.all([handle.cancel(), handle.cancel()]);
      expect(reloaded.calls.closed).toBe(1);
      expect(heard.map((result) => result.outcome)).toEqual(["cancelled"]);
    });

    it("delivers the wallet's answer when cancelled while acknowledging it", async () => {
      const { reloaded, heard, recovery, handle } = await recovering();
      let releaseAcknowledgement!: () => void;
      const acknowledgementHeld = new Promise<void>((resolve) => {
        releaseAcknowledgement = resolve;
      });
      const acknowledge = reloaded.client.acknowledgeAndClose;
      reloaded.client.acknowledgeAndClose = async (...args: Parameters<typeof acknowledge>) => {
        await acknowledgementHeld;
        return acknowledge(...args);
      };
      reloaded.ok(signedMessageOutput());
      await flush();
      const cancelling = handle.cancel();
      await flush();
      releaseAcknowledgement();
      await cancelling;
      await recovery;

      expect(reloaded.calls.closed).toBe(0);
      expect(reloaded.calls.acknowledged).toBe(1);
      expect(heard.map((result) => [result.requestId, result.outcome])).toEqual([
        ["stuck-1", "success"],
      ]);
    });

    it("still ends as cancelled when the close cannot be sent", async () => {
      const { reloaded, heard, handle } = await recovering();
      reloaded.client.closePhaseSafe = async () => {
        throw new Error("network down");
      };
      await handle.cancel();
      expect(heard.map((result) => [result.requestId, result.outcome])).toEqual([
        ["stuck-1", "cancelled"],
      ]);
      expect(tabStorage.length).toBe(0);
    });

    it("cannot be reopened when its record kept no wallet link, but can be cancelled", async () => {
      const { handle, heard, openedLinks } = await recovering({ withoutWalletLink: true });
      expect(handle.canOpenInWallet).toBe(false);
      expect(() => handle.openInWallet()).toThrow("mobile_bridge_link_not_ready");
      expect(openedLinks).toEqual([]);
      await handle.cancel();
      expect(heard.map((result) => result.outcome)).toEqual(["cancelled"]);
    });

    it("is gone once the wallet answers", async () => {
      const { reloaded, tab, recovery, handle } = await recovering();
      reloaded.ok(signedMessageOutput());
      await recovery;
      expect(await tab.client.getRecoveringRequest()).toBeUndefined();
      await handle.cancel();
      expect(reloaded.calls.closed).toBe(0);
      const [result] = await tab.client.getRecoveredResults();
      expect(result?.outcome).toBe("success");
    });
  });

  it("describes no recovering request when there is nothing to recover", async () => {
    const tab = createBridgeClientHarness(createClientDouble());
    expect(await tab.client.getRecoveringRequest()).toBeUndefined();
    await tab.client.recoverPendingRequest();
    expect(await tab.client.getRecoveringRequest()).toBeUndefined();
  });

  it("describes no recovering request for a record past its deadline", async () => {
    await originalTabSends(signMessageRequest(), "late-2");
    const key = [...tabStorage.map.keys()][0] ?? "";
    const stored = JSON.parse(tabStorage.getItem(key) ?? "{}");
    tabStorage.setItem(key, JSON.stringify({ ...stored, expiresAt: Date.now() - 1 }));
    const tab = createBridgeClientHarness(createClientDouble());
    void tab.client.recoverPendingRequest();
    expect(await tab.client.getRecoveringRequest()).toBeUndefined();
    const [result] = await tab.client.getRecoveredResults();
    expect(result?.outcome).toBe("expired");
  });

  it("has nothing to report when the tab kept no record", async () => {
    const reloaded = createClientDouble();
    const tab = createBridgeClientHarness(reloaded);
    await tab.client.recoverPendingRequest();
    expect(await tab.client.getRecoveredResults()).toEqual([]);
    expect(reloaded.calls.resumeSession).toHaveLength(0);
  });
});
