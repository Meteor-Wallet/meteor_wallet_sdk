import { describe, expect, it } from "bun:test";
import type {
  ICreatedPartnerSession,
  ICreateSessionInput,
  IPreparedSessionTurn,
  ISessionLinkStatus,
  ISessionResultReceipt,
  PartnerSessionClient,
  TPartnerPairedWallet,
  TValidatedSessionResult,
} from "@meteorwallet/connect";
import {
  buildAccountsTransferRequestData,
  decryptAccountsTransferRequestData,
  EBridgeInteractionMode,
  EBridgeLinkType,
  EMeteorAppId,
  ESessionPhase,
  EWalletPlatform,
  type TSessionFacts,
  type TSessionRequestEnvelopeV1,
  TRANSFER_ACCOUNTS_MAX_ACCOUNTS,
  TRANSFER_ACCOUNTS_MAX_SECRETS_PER_ACCOUNT,
} from "@meteorwallet/connect-shared";
import type { ITypedStorageHelper } from "../../ported_common/utils/storage/TypedStorageHelper";
import type { IMeteorConnectTypedStorage } from "../MeteorConnect.types";
import {
  type IMobileBridgeSnapshot,
  MobileBridgeSession,
} from "../target_clients/mobile_bridge/MobileBridgeSession";
import { sdkActionToMobileBridge } from "../target_clients/mobile_bridge/sdkActionToMobileBridge";
import {
  createSessionClientDoubleBase,
  sessionFactsFor,
} from "../test/test_utils/sessionClientDouble";
import { MeteorConnectTransferAccounts } from "./MeteorConnectTransferAccounts";
import { parseTransferSecretInput, TransferAccountsStaging } from "./TransferAccountsStaging";
import { TransferSensitiveAttachment } from "./TransferSensitiveAttachment";

const MNEMONIC_12 =
  "shoot island position soft burden budget tooth cruel issue economy destroy above";
const PRIVATE_KEY =
  "ed25519:3D4YudUahN1nawWogh8pAKSj92sUNMdbZGjn7kERKzYoTy8tnFQuwoGUC51DowKqorvkr2pytJSnwuSbsNVfqygr";

function makeMemoryStorage(): {
  helper: ITypedStorageHelper<IMeteorConnectTypedStorage>;
  raw: Map<string, unknown>;
} {
  const raw = new Map<string, unknown>();
  return {
    raw,
    helper: {
      getJson: async (key) => raw.get(key) as any,
      getJsonOrDef: async (key, def) => (raw.get(key) as any) ?? def,
      setJson: async (key, val) => void raw.set(key, val),
      removeItem: async (key) => void raw.delete(key),
    },
  };
}

function makeStaging(persist = false) {
  const storage = makeMemoryStorage();
  const staging = new TransferAccountsStaging({
    persist,
    getStorage: () => storage.helper,
  });
  return { staging, storage };
}

function makeFakeSession(initialPhase: IMobileBridgeSnapshot["phase"] = "creating_bridge") {
  const listeners = new Set<(snapshot: IMobileBridgeSnapshot) => void>();
  let snapshot: IMobileBridgeSnapshot = {
    phase: initialPhase,
    push: "not_attempted",
    linkPhase: "live",
    linkRedialAttempt: 0,
    pinAttemptsUsed: 0,
  };
  const fake = {
    getSnapshot: () => ({ ...snapshot }),
    subscribe: (listener: (s: IMobileBridgeSnapshot) => void) => {
      listeners.add(listener);
      listener({ ...snapshot });
      return () => listeners.delete(listener);
    },
    setPhase: (phase: IMobileBridgeSnapshot["phase"]) => {
      snapshot = { ...snapshot, phase };
      for (const listener of listeners) listener({ ...snapshot });
    },
  };
  return fake as typeof fake & MobileBridgeSession;
}

describe("parseTransferSecretInput", () => {
  it("detects secret kinds via the shared encoder", () => {
    expect(parseTransferSecretInput(MNEMONIC_12)).toEqual({ type: "mnemonic" });
    expect(parseTransferSecretInput(PRIVATE_KEY)).toEqual({ type: "private_key" });
    expect(parseTransferSecretInput("")).toEqual({ type: "invalid", reason: "empty_secret_input" });
    expect(parseTransferSecretInput("one two three")).toEqual({
      type: "invalid",
      reason: "invalid_mnemonic_word_count",
    });
  });
});

describe("TransferAccountsStaging", () => {
  it("passes shared-encoder failure reasons through verbatim", async () => {
    const { staging } = makeStaging();
    const empty = await staging.stage({
      networkId: "testnet",
      accountId: "a.testnet",
      secretInput: " ",
    });
    expect(empty).toMatchObject({ ok: false, reason: "empty_secret_input" });
    const badKey = await staging.stage({
      networkId: "testnet",
      accountId: "a.testnet",
      secretInput: "ed25519:",
    });
    expect(badKey).toMatchObject({ ok: false, reason: "invalid_private_key" });
    const badCount = await staging.stage({
      networkId: "testnet",
      accountId: "a.testnet",
      secretInput: "eleven words only one two three four five six seven eight",
    });
    expect(badCount).toMatchObject({
      ok: false,
      reason: "invalid_mnemonic_word_count",
      wordCount: 11,
    });
  });

  it("rejects bad account ids with a friendly message", async () => {
    const { staging } = makeStaging();
    const badChars = await staging.stage({
      networkId: "testnet",
      accountId: "Bad!Account",
      secretInput: MNEMONIC_12,
    });
    expect(badChars).toMatchObject({ ok: false, reason: "invalid_account_id" });
    const tooShort = await staging.stage({
      networkId: "testnet",
      accountId: "a",
      secretInput: MNEMONIC_12,
    });
    expect(tooShort).toMatchObject({ ok: false, reason: "invalid_account_id" });
  });

  it("merges secrets on re-staging the same identity tuple and dedupes exact repeats", async () => {
    const { staging } = makeStaging();
    const first = await staging.stage({
      networkId: "testnet",
      accountId: " Alice.Testnet ",
      secretInput: MNEMONIC_12,
    });
    expect(first).toMatchObject({ ok: true });
    const second = await staging.stage({
      networkId: "testnet",
      accountId: "alice.testnet",
      secretInput: PRIVATE_KEY,
    });
    expect(second).toMatchObject({
      ok: true,
      account: { accountId: "alice.testnet", secretTypes: ["mnemonic", "private_key"] },
    });
    const duplicate = await staging.stage({
      networkId: "testnet",
      accountId: "alice.testnet",
      secretInput: MNEMONIC_12,
    });
    expect(duplicate).toMatchObject({ ok: false, reason: "duplicate_secret" });
    expect(await staging.getStagedSummaries()).toHaveLength(1);
  });

  it("enforces the shared per-account and per-set bounds", async () => {
    const { staging } = makeStaging();
    for (let i = 0; i < TRANSFER_ACCOUNTS_MAX_SECRETS_PER_ACCOUNT; i++) {
      const result = await staging.stage({
        networkId: "testnet",
        accountId: "alice.testnet",
        secretInput: MNEMONIC_12.replace(
          "shoot",
          [
            "ability",
            "able",
            "about",
            "above",
            "absent",
            "absorb",
            "abstract",
            "absurd",
            "abuse",
            "access",
          ][i]!,
        ),
      });
      expect(result.ok).toBe(true);
    }
    const overflow = await staging.stage({
      networkId: "testnet",
      accountId: "alice.testnet",
      secretInput: MNEMONIC_12.replace("shoot", "accident"),
    });
    expect(overflow).toMatchObject({ ok: false, reason: "too_many_secrets" });

    const { staging: setStaging } = makeStaging();
    for (let i = 0; i < TRANSFER_ACCOUNTS_MAX_ACCOUNTS; i++) {
      const result = await setStaging.stage({
        networkId: "testnet",
        accountId: `account-${i}.testnet`,
        secretInput: MNEMONIC_12,
      });
      expect(result.ok).toBe(true);
    }
    const overflowSet = await setStaging.stage({
      networkId: "testnet",
      accountId: "one-too-many.testnet",
      secretInput: MNEMONIC_12,
    });
    expect(overflowSet).toMatchObject({ ok: false, reason: "too_many_accounts" });
  });

  it("maxAccounts override raises the staging cap past the protocol transfer bound", async () => {
    const storage = makeMemoryStorage();
    const staging = new TransferAccountsStaging({
      persist: false,
      getStorage: () => storage.helper,
      maxAccounts: TRANSFER_ACCOUNTS_MAX_ACCOUNTS + 2,
    });
    for (let i = 0; i < TRANSFER_ACCOUNTS_MAX_ACCOUNTS + 2; i++) {
      const result = await staging.stage({
        networkId: "testnet",
        accountId: `account-${i}.testnet`,
        secretInput: MNEMONIC_12,
      });
      expect(result.ok).toBe(true);
    }
    const overflow = await staging.stage({
      networkId: "testnet",
      accountId: "one-too-many.testnet",
      secretInput: MNEMONIC_12,
    });
    expect(overflow).toMatchObject({ ok: false, reason: "too_many_accounts" });
    // The raised cap is staging-only: the shared transfer builder still enforces the
    // protocol's 50-account bound on the oversized set.
    await expect(
      buildAccountsTransferRequestData({
        decrypted: { formatVersion: 1, accounts: await staging.getStagedWithSecrets() },
      }),
    ).rejects.toThrow();
  });

  it("summaries never contain secret material", async () => {
    const { staging } = makeStaging();
    await staging.stage({
      networkId: "testnet",
      accountId: "alice.testnet",
      secretInput: MNEMONIC_12,
    });
    const summaries = await staging.getStagedSummaries();
    const serialized = JSON.stringify(summaries);
    expect(serialized).not.toContain("prefixedBase64DataString");
    expect(serialized).not.toContain(Buffer.from(MNEMONIC_12).toString("base64").slice(0, 16));
  });

  it("persists opt-in, revalidates on load, and drops invalid stored data", async () => {
    const { staging, storage } = makeStaging(true);
    await staging.stage({
      networkId: "testnet",
      accountId: "alice.testnet",
      secretInput: MNEMONIC_12,
    });
    expect(storage.raw.get("stagedTransferAccounts")).toBeDefined();

    const reloaded = new TransferAccountsStaging({
      persist: true,
      getStorage: () => storage.helper,
    });
    expect(await reloaded.getStagedSummaries()).toHaveLength(1);

    storage.raw.set("stagedTransferAccounts", [{ not: "valid" }]);
    const corrupted = new TransferAccountsStaging({
      persist: true,
      getStorage: () => storage.helper,
    });
    expect(await corrupted.getStagedSummaries()).toHaveLength(0);

    await staging.clearStaged();
    expect(storage.raw.has("stagedTransferAccounts")).toBe(false);
  });

  it("does not touch storage when persistence is off", async () => {
    const { staging, storage } = makeStaging(false);
    await staging.stage({
      networkId: "testnet",
      accountId: "alice.testnet",
      secretInput: MNEMONIC_12,
    });
    expect(storage.raw.size).toBe(0);
  });
});

describe("TransferSensitiveAttachment + TransferKeyHandle", () => {
  async function makeBoundAttachment() {
    const staging = makeStaging().staging;
    await staging.stage({
      networkId: "testnet",
      accountId: "alice.testnet",
      secretInput: MNEMONIC_12,
    });
    const accounts = await staging.getStagedWithSecrets();
    const attachment = new TransferSensitiveAttachment({ formatVersion: 1, accounts });
    const actionInput = await attachment.buildFreshBridgePayload();
    const session = makeFakeSession();
    attachment.bindPendingHandleToSession(session);
    return { attachment, actionInput, session };
  }

  it("reveals only at wallet_action, only for the bound session, and round-trips the decrypt", async () => {
    const { attachment, actionInput, session } = await makeBoundAttachment();
    const handle = attachment.getActiveHandle()!;

    expect(handle.getRevealPayload(session)).toBeNull(); // creating_bridge — gate closed
    session.setPhase("wallet_action");
    const payload = handle.getRevealPayload(session);
    expect(payload).not.toBeNull();
    expect(payload!.raw.startsWith("mck1.")).toBe(true);
    expect(payload!.grouped.replaceAll(" ", "")).toBe(payload!.raw);

    // A different session can never unlock the handle, whatever its phase claims.
    const impostor = makeFakeSession("wallet_action");
    expect(handle.getRevealPayload(impostor)).toBeNull();

    // The revealed key decrypts exactly the ciphertext this bridge carried.
    const decrypted = await decryptAccountsTransferRequestData({
      transferKeyString: payload!.raw,
      actionInput,
    });
    expect(decrypted.ok).toBe(true);
    if (decrypted.ok) {
      expect(decrypted.data.accounts[0]!.accountId).toBe("alice.testnet");
    }
  });

  it("wipes on terminal phases and regenerates a fresh key per bridge", async () => {
    const { attachment, actionInput, session } = await makeBoundAttachment();
    const firstHandle = attachment.getActiveHandle()!;
    session.setPhase("wallet_action");
    const firstKey = firstHandle.getRevealPayload(session)!.raw;

    // Refresh: new payload, new key, old handle wiped even before its session ends.
    const secondInput = await attachment.buildFreshBridgePayload();
    expect(firstHandle.isWiped()).toBe(true);
    expect(firstHandle.getRevealPayload(session)).toBeNull();
    const secondSession = makeFakeSession("wallet_action");
    attachment.bindPendingHandleToSession(secondSession);
    const secondHandle = attachment.getActiveHandle()!;
    const secondKey = secondHandle.getRevealPayload(secondSession)!.raw;
    expect(secondKey).not.toBe(firstKey);
    expect(JSON.stringify(secondInput)).not.toBe(JSON.stringify(actionInput));

    // Terminal phase wipes (idempotently).
    secondSession.setPhase("failed");
    expect(secondHandle.isWiped()).toBe(true);
    secondHandle.wipe();
    expect(secondHandle.getRevealPayload(secondSession)).toBeNull();

    // The wallet answering is already too late to reveal: the key dies at `result_ready`, not at
    // the terminal phase that may follow an acknowledgement round trip or an external-work hold.
    for (const phase of ["result_ready", "external_work"] as const) {
      const { attachment: earlyAttachment, session: earlySession } = await makeBoundAttachment();
      const earlyHandle = earlyAttachment.getActiveHandle()!;
      earlySession.setPhase("wallet_action");
      expect(earlyHandle.getRevealPayload(earlySession)).not.toBeNull();
      earlySession.setPhase(phase);
      expect(earlyHandle.isWiped()).toBe(true);
      expect(earlyHandle.getRevealPayload(earlySession)).toBeNull();
      earlyAttachment.dispose();
    }

    // Dispose drops the retained snapshot: no further payloads can be built.
    attachment.dispose();
    await expect(attachment.buildFreshBridgePayload()).rejects.toThrow(
      "transfer_accounts_attachment_disposed",
    );
  });

  it("canary: the key never appears in any serialization or the wire payload", async () => {
    const { attachment, actionInput, session } = await makeBoundAttachment();
    const handle = attachment.getActiveHandle()!;
    session.setPhase("wallet_action");
    const key = handle.getRevealPayload(session)!.raw;

    expect(JSON.stringify(attachment)).toBe('"[REDACTED]"');
    expect(JSON.stringify(handle)).toBe('"[REDACTED]"');
    expect(String(handle)).toBe("[REDACTED]");
    expect(Object.keys(handle)).toEqual([]);
    expect(JSON.stringify(actionInput)).not.toContain(key);
    expect(JSON.stringify(actionInput)).not.toContain(key.split(".")[1]!);
    // The plaintext never appears in the encrypted wire payload either.
    expect(JSON.stringify(actionInput)).not.toContain(
      Buffer.from(MNEMONIC_12).toString("base64").slice(0, 16),
    );
  });
});

/**
 * A `PartnerSessionClient`-shaped double that records the ONE action-bearing value the client
 * persists: `createSession`'s `initialActionRequest` becomes `envelope.actionRequest` in the
 * signed turn the client writes under `currentTurn::<bridgeId>` and reads back through
 * `readPersistedExpectedTurn()`.
 */
function createTurnCapturingClient(input: { result?: TValidatedSessionResult<unknown> } = {}) {
  const created: ICreateSessionInput[] = [];
  // The emission contract every double in this package shares: a verb publishes the facts it
  // returns from inside its own still-pending await (see `createSessionClientDoubleBase`).
  const base = createSessionClientDoubleBase();
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
    createSession: async (createInput: ICreateSessionInput): Promise<ICreatedPartnerSession> => {
      created.push(createInput);
      // The shipped `createSession` binds the session and stages its initial turn, accepting the
      // facts it is about to return along the way — so they are published, not merely returned.
      const facts = base.publishFacts(sessionFactsFor(ESessionPhase.waiting_for_wallet));
      return {
        bridgeId: "b1",
        bridgeLease: "lease1",
        partnerId: "partner-1",
        partnerRequestId: "request-1",
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
    claimedWallet: undefined,
    getPairedWallets: async (): Promise<TPartnerPairedWallet[]> => [],
    // The canary reveals the key mid-flow and wants no turn ending, so by default the wait never
    // settles; a test that needs the closing verb to actually run scripts a result.
    waitForValidatedResult: (): Promise<TValidatedSessionResult<unknown>> =>
      input.result == null ? new Promise(() => {}) : Promise.resolve(input.result),
    acknowledgeAndClose: base.verb(() => sessionFactsFor(ESessionPhase.closed), {
      selfInitiated: true,
    }),
    // The client drops the binding's facts here, so a fresh session starts from nothing.
    disconnectBridge: async (): Promise<void> => {
      base.releaseBinding();
    },
  };
  const emitFactsChanged = (phase: ESessionPhase) => {
    base.emit("factsChanged", { facts: sessionFactsFor(phase), source: "realm" });
  };
  return { client: client as unknown as PartnerSessionClient, created, emitFactsChanged };
}

describe("transfer key vs. the persisted signed turn (§4.6 canary)", () => {
  it("never lets the key body reach the turn envelope the session persists", async () => {
    const staging = makeStaging().staging;
    await staging.stage({
      networkId: "testnet",
      accountId: "alice.testnet",
      secretInput: MNEMONIC_12,
    });
    const attachment = new TransferSensitiveAttachment({
      formatVersion: 1,
      accounts: await staging.getStagedWithSecrets(),
    });
    // Exactly what `prepareRequest` builds: the wire payload is regenerated per bridge from the
    // attachment, and the initial `expandedInput` build is never sent.
    const prepared = await sdkActionToMobileBridge(
      { id: "meteor_wallet_core::transfer_accounts", expandedInput: {} } as never,
      attachment,
    );
    const { client, created, emitFactsChanged } = createTurnCapturingClient();
    const session = new MobileBridgeSession({
      token: "canary",
      client,
      prepared,
      targetMeteorAppIds: [EMeteorAppId.meteor_wallet_web_dev],
      buildConnection: () => {
        throw new Error("unused");
      },
      isCurrent: () => true,
      assertIdentityGeneration: async () => {},
      acquireFirstPairingLease: async () => ({
        ownerToken: "lease",
        assertOwned: async () => {},
        release: async () => {},
      }),
      registerLiveSession: async () => ({ stop: async () => {} }),
    });
    attachment.bindPendingHandleToSession(session);
    await session.startPreparation();

    // Reveal exactly as the panel does: only once this session reaches `wallet_action`.
    const handle = attachment.getActiveHandle()!;
    emitFactsChanged(ESessionPhase.wallet_action);
    const key = handle.getRevealPayload(session)!.raw;
    const keyBody = key.split(".")[1]!;

    const initialActionRequest = created[0]?.initialActionRequest;
    expect(initialActionRequest).toBeDefined();
    // Sanity: this IS the object carrying the transfer — the ciphertext legitimately rides it…
    const { encryptedData } = prepared.actionInput as {
      encryptedData: { ciphertext: string };
    };
    expect(JSON.stringify(initialActionRequest)).toContain(encryptedData.ciphertext.slice(0, 32));

    // The record `readPersistedExpectedTurn()` returns is this signed turn: the envelope (whose
    // only action-bearing field is `actionRequest`, verbatim from `initialActionRequest`) plus its
    // signature. Typed against the published shapes so a new action-bearing field breaks the build
    // rather than slipping past this canary.
    const persistedTurn: IPreparedSessionTurn = {
      envelope: {
        formatVersion: 1,
        bridgeId: "b1",
        interactionMode: EBridgeInteractionMode.session_v1,
        sequence: 1,
        turnId: "turn-1",
        operationId: "operation-1",
        issuedAt: Date.now(),
        recoveryContractHash: "recovery-contract-hash",
        requestHash: "request-hash",
        priorResultHash: null,
        actionRequest: initialActionRequest,
      } satisfies TSessionRequestEnvelopeV1,
      signatureBase64: "signature",
    };

    for (const serialized of [
      JSON.stringify(persistedTurn),
      JSON.stringify(initialActionRequest),
      JSON.stringify(prepared.actionInput),
      JSON.stringify(prepared.actionRequest),
      JSON.stringify(session.getSnapshot()),
      JSON.stringify(session.prepared),
      JSON.stringify(created[0]),
    ]) {
      expect(serialized).not.toContain(key);
      expect(serialized).not.toContain(keyBody);
    }

    handle.wipe();
    attachment.dispose();
    await session.dispose();
  });
});

describe("the turn-capturing double's own closing verb", () => {
  it("emits the closed facts from inside the verb, the way the shipped client does", async () => {
    // The canary above never settles its result wait, which leaves `acknowledgeAndClose`
    // unreachable — and an unreachable verb is where a double quietly stops matching the client.
    // Script a result so the verb runs, and assert the facts are EMITTED and not merely returned:
    // `acceptSessionActionFacts` accepts them inside the verb's own still-pending await, and a
    // session that only learns of its own close afterwards reads the next arrival as a
    // counterparty cancel instead of a completed turn.
    const staging = makeStaging().staging;
    await staging.stage({
      networkId: "testnet",
      accountId: "alice.testnet",
      secretInput: MNEMONIC_12,
    });
    const attachment = new TransferSensitiveAttachment({
      formatVersion: 1,
      accounts: await staging.getStagedWithSecrets(),
    });
    const prepared = await sdkActionToMobileBridge(
      { id: "meteor_wallet_core::transfer_accounts", expandedInput: {} } as never,
      attachment,
    );
    const receipt: ISessionResultReceipt = {
      bridgeId: "b1",
      sequence: 1,
      turnId: "turn-id-0123456789ab",
      requestHash: "request-hash",
      resultHash: "result-hash",
    };
    const { client } = createTurnCapturingClient({
      result: { status: "ok", output: { success: true }, receipt },
    });
    const observed: string[] = [];
    client.events.on("factsChanged", ({ facts, source }) =>
      observed.push(`facts:${facts.phase}:${source}`),
    );
    client.events.on("terminal", ({ outcome }) => observed.push(`terminal:${outcome.statusId}`));

    const session = new MobileBridgeSession({
      token: "closing-verb",
      client,
      prepared,
      targetMeteorAppIds: [EMeteorAppId.meteor_wallet_web_dev],
      // A transfer turn never resolves a claimed wallet, so this stays unused.
      buildConnection: () => {
        throw new Error("unused");
      },
      isCurrent: () => true,
      assertIdentityGeneration: async () => {},
      acquireFirstPairingLease: async () => ({
        ownerToken: "lease",
        assertOwned: async () => {},
        release: async () => {},
      }),
      registerLiveSession: async () => ({ stop: async () => {} }),
    });
    attachment.bindPendingHandleToSession(session);
    const settled = session.awaitResult();
    await session.startPreparation();

    expect(await settled).toEqual({ success: true });
    // Both facts-accepting verbs this flow uses, in the order the shipped client raises them.
    expect(observed).toEqual([
      `facts:${ESessionPhase.waiting_for_wallet}:action`,
      `facts:${ESessionPhase.closed}:action`,
      `terminal:${ESessionPhase.closed}`,
    ]);
    // And the session read its own close as the completed turn it is, not as a cancel.
    expect(session.getSnapshot().phase).toBe("completed");

    attachment.dispose();
    await session.dispose();
  });
});

describe("MeteorConnectTransferAccounts staged-set retention", () => {
  function makeNamespace(config: {
    clearStagedOnSuccess?: boolean;
    persistStagedAccounts?: boolean;
  }) {
    const storage = makeMemoryStorage();
    const fakeAction = {
      setSensitiveTransferSource: () => {},
      promptForExecution: async () => ({ success: true }),
    };
    const meteorConnect = {
      storage: storage.helper,
      createAction: async () => fakeAction,
    } as any;
    const namespace = new MeteorConnectTransferAccounts(meteorConnect);
    namespace.configure({ enabled: true, ...config });
    return namespace;
  }

  it("keeps staged accounts after a successful transfer by default", async () => {
    const namespace = makeNamespace({});
    await namespace.stage({
      networkId: "testnet",
      accountId: "alice.testnet",
      secretInput: MNEMONIC_12,
    });
    expect(await namespace.prompt()).toEqual({ status: "imported" });
    // The user may want to transfer the same accounts to another platform next.
    expect(await namespace.getStagedSummaries()).toHaveLength(1);
  });

  it("drops the in-memory staged set on dispose", async () => {
    // The DEFAULT configuration, and the one the drop exists for: the plaintext mnemonics and
    // private keys are held on this instance ONLY, and disposal is the point they stop being
    // reachable. This is also the only configuration in which the drop is observable — with
    // persistence on, `getStagedSummaries()` reloads the set straight back out of storage.
    const namespace = makeNamespace({});
    await namespace.stage({
      networkId: "testnet",
      accountId: "alice.testnet",
      secretInput: MNEMONIC_12,
    });
    expect(await namespace.getStagedSummaries()).toHaveLength(1);

    namespace.dropStagedFromMemory();

    expect(await namespace.getStagedSummaries()).toEqual([]);
    expect(await namespace.getStagedWithSecrets()).toEqual([]);
  });

  it("leaves opted-in persisted staging alone when the in-memory set is dropped", async () => {
    const namespace = makeNamespace({ persistStagedAccounts: true });
    await namespace.stage({
      networkId: "testnet",
      accountId: "alice.testnet",
      secretInput: MNEMONIC_12,
    });
    // What MeteorConnect.disposeMobileBridge() calls: memory goes, opted-in storage stays.
    namespace.dropStagedFromMemory();
    expect(await namespace.getStagedSummaries()).toHaveLength(1);
  });

  it("clears staged accounts only with the clearStagedOnSuccess opt-in", async () => {
    const namespace = makeNamespace({ clearStagedOnSuccess: true });
    await namespace.stage({
      networkId: "testnet",
      accountId: "alice.testnet",
      secretInput: MNEMONIC_12,
    });
    expect(await namespace.prompt()).toEqual({ status: "imported" });
    expect(await namespace.getStagedSummaries()).toHaveLength(0);
  });
});
