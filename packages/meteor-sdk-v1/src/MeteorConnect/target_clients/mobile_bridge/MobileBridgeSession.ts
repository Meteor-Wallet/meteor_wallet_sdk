import {
  buildWalletLinkUrl,
  classifyPushWakeOutcome,
  describeCloseOptions,
  describeSessionError,
  type IBridgeSessionTerminalOutcome,
  type ICreatedPartnerSession,
  type IPushWakeOutcomeClassification,
  type ISessionResultReceipt,
  isTerminalPhase,
  type PartnerSessionClient,
  type TPartnerPairedWallet,
  type TSessionLinkPhase,
} from "@meteorwallet/connect";
import {
  act_impl_meteor_wallet_core,
  act_impl_near,
  EBridgeLinkType,
  type EMeteorAppId,
  ESessionPhase,
  ESessionResourceProfile,
  type TMeteorBridgeWalletLink,
  type TSessionFacts,
} from "@meteorwallet/connect-shared";
import type { KeyPair } from "@near-js/crypto";
import type {
  IMeteorConnectBridgeLeaseHandle,
  IMeteorConnection_V2_BridgeMobile,
} from "../../MeteorConnect.types";
import type {
  IMobileBridgeExternalWorkHold,
  IMobileBridgePreparedAction,
  TMobileBridgeExternalWorkJournal,
} from "./MeteorConnectMobileBridgeClient.types";
import { meteorWalletCoreOutputToSdk, nearOutputToSdk } from "./mobileBridgeOutputToSdk";

/**
 * Dev-only: rebase a backend-issued web wallet link onto a local dev origin, preserving the
 * link's path and query (bridgeId, bridgeLease, protocolVersion).
 * "https://wallet-dev…/bridge_request?x=y" + "https://localhost:3001"
 * → "https://localhost:3001/bridge_request?x=y".
 *
 * Only the ORIGIN moves. Which backend the session lives on is advertised separately, through
 * `buildWalletLinkUrl`'s `backendUrlHint` (0.13+) — a locally served wallet derives its backend
 * from its own hostname, which is wrong whenever the partner used any other one. That hint rides
 * the link fragment and is resolved on the wallet side against ITS OWN allowlist via
 * `resolveTrustedBackendUrlHint`, so a link can never talk a wallet into dialing an arbitrary host.
 */
export function rebaseWalletLinkToLocalDev(linkString: string, localBaseUrl: string): string {
  const link = new URL(linkString);
  const base = new URL(localBaseUrl);
  return `${base.origin}${link.pathname}${link.search}`;
}

/**
 * This SDK's own flow-ending sentinels. They are the SDK's vocabulary, not protocol errors —
 * every BACKEND failure is classified through `describeSessionError` (kind / ids / retry) and is
 * never matched by message. Shared so the thrower here and the outcome mapper in
 * `MeteorConnectTransferAccounts` cannot drift apart.
 */
export const MOBILE_BRIDGE_ENDING = {
  /** The user, the wallet, or a phase-safe close ended the flow before a result was accepted. */
  cancelled: "mobile_bridge_cancelled",
  /** A deadline passed, or the bridge was already gone, with no signed result. */
  expired: "mobile_bridge_expired",
  /** The owning action released this session. */
  disposed: "mobile_bridge_session_disposed",
  /** The session terminalized in `failed`, or its redial budget ran out. */
  failed: "mobile_bridge_failed",
  /** The signed result did not answer the request this session staged. */
  resultMismatch: "mobile_bridge_action_result_mismatch",
  /** Prefix of a signed typed-error result; the typed ids follow after ": ". */
  walletDeclined: "mobile_bridge_wallet_declined",
  /** The backend refused this partner identity's handshake; only a reset re-pairs. */
  identityPinMismatch: "mobile_bridge_identity_pin_mismatch",
  /** The SDK's own 3-submission cap (the protocol exposes no attempt counter). */
  pinAttemptsExceeded: "PIN attempts exceeded",
  /** A next turn was asked for on a session that is not holding an external-work window. */
  externalWorkHoldUnavailable: "mobile_bridge_external_work_hold_unavailable",
} as const;

export type TMobileBridgePhase =
  | "initializing"
  | "busy_other_tab"
  | "creating_bridge"
  | "waiting_for_wallet"
  | "wallet_verification"
  | "wallet_action"
  /** The wallet's signed result is staged on the bridge and has not been acknowledged yet. */
  | "result_ready"
  /** The session is held open while off-bridge work (the AddKey window) completes. */
  | "external_work"
  | "completed"
  | "failed"
  | "cancelled";

export interface IMobileBridgeSnapshot {
  phase: TMobileBridgePhase;
  push: "not_attempted" | "sending" | "delivered" | "not_delivered";
  /**
   * The SDK's own judgment of the push-wake outcome (`classifyPushWakeOutcome`). A wallet with no
   * push registration — every web wallet — reports `delivered: false, reason: no_token`, which is
   * `expected`/`informational`: the QR/link is the delivery path there, not a fallback.
   */
  pushOutcome?: IPushWakeOutcomeClassification;
  /** The typed `ESessionNotifyWalletReason` behind a non-delivery, when the backend named one. */
  pushReason?: string;
  deepLink?: string;
  /** Idle deadline — the countdown; every successful transition pushes it out. */
  idleExpiresAt?: number;
  /** Absolute deadline — the hard wall no refresh moves. */
  absoluteExpiresAt?: number;
  /**
   * The last accepted authenticated session facts. Carried verbatim so the UI can derive its own
   * presentation from the SDK's own pure helpers — `describeCloseOptions(facts, "partner")` for
   * the close verb, `isTerminalPhase(facts)` for terminality — instead of re-deriving either from
   * the projected phase. Facts carry no secret material (phase, deadlines, policy bounds only).
   */
  facts?: Readonly<TSessionFacts>;
  /** The SDK-maintained bridge link health phase (`client.linkStatus`). */
  linkPhase: TSessionLinkPhase;
  /** Redial attempt within the current outage; 0 whenever no redial is pending. */
  linkRedialAttempt: number;
  /** How long until that redial fires, when one is scheduled. */
  linkRetryInMs?: number;
  /** Why the bridge session was permanently released, when it was. */
  terminalReason?: IBridgeSessionTerminalOutcome["reason"];
  pinAttemptsUsed: number;
  pinError?: string;
  /**
   * Failure copy, classified ONCE here through `describeSessionError` (DX5). The UI renders
   * `errorHeadline`/`errorDetail` and keeps `error` — the untouched original message — as fine
   * print; `errorIds` carries the typed protocol ids so no consumer ever matches on a string.
   */
  errorHeadline?: string;
  errorDetail?: string;
  errorIds?: string[];
  error?: string;
  identityResetRequired?: boolean;
}

interface IMobileBridgeSessionInput {
  token: string;
  client: PartnerSessionClient;
  prepared: IMobileBridgePreparedAction;
  /** Ordered app-id preference: session targeting + wallet-link selection (first match wins). */
  targetMeteorAppIds: EMeteorAppId[];
  /** Dev-only: rebase the selected web wallet link onto a local origin (transfer "web_local_dev"). */
  localDevLinkRewrite?: { baseUrl: string; mcBackendHintUrl: string };
  pushWallet?: TPartnerPairedWallet;
  /**
   * Bind the session to ONE already-paired wallet server-side as well as locally (the new-key
   * verification turn, which must reach exactly the wallet that minted the destination key).
   */
  pinnedWallet?: TPartnerPairedWallet;
  /**
   * Journal-before-hold seam. Present only for `new_key_account_transfer_start`: supplying it is
   * what swaps this turn's closing verb from `acknowledgeAndClose` to
   * `acknowledgeAndBeginExternalWork`, leaving the session held open for the AddKey window.
   */
  journalBeforeExternalWorkHold?: TMobileBridgeExternalWorkJournal;
  buildConnection(wallet: TPartnerPairedWallet): IMeteorConnection_V2_BridgeMobile;
  persistFunctionCallKey?: (network: string, accountId: string, keyPair: KeyPair) => Promise<void>;
  isCurrent(token: string): boolean;
  assertIdentityGeneration(): Promise<void>;
  acquireFirstPairingLease(): Promise<IMeteorConnectBridgeLeaseHandle>;
  registerLiveSession(): Promise<{ stop(): Promise<void> }>;
}

/** Local phases that mean the flow is over; nothing may re-enter the transport from here. */
const SETTLED_PHASES: readonly TMobileBridgePhase[] = ["completed", "failed", "cancelled"];

/**
 * Local phases where the wallet already holds — or has already answered — the request. Cancelling
 * from any of them is a `target_already_committed` outcome, never a silent discard.
 */
const COMMITTED_PHASES: readonly TMobileBridgePhase[] = [
  "wallet_action",
  "result_ready",
  "external_work",
  "completed",
];

type TMeteorWalletCoreActionId = Extract<
  IMobileBridgePreparedAction["kind"],
  { domain: "meteor_wallet_core" }
>["sharedActionId"];

/**
 * Project one authenticated session phase onto the SDK's own flow phase. `ready` (between turns)
 * and the two terminal phases are deliberately absent: the first never occurs in these
 * single-turn flows, and `completed` is set only once the explicit close verb has resolved.
 */
function flowPhaseForSessionPhase(phase: ESessionPhase): TMobileBridgePhase | undefined {
  switch (phase) {
    case ESessionPhase.initializing:
      return "creating_bridge";
    case ESessionPhase.waiting_for_wallet:
      return "waiting_for_wallet";
    case ESessionPhase.wallet_verification:
      return "wallet_verification";
    case ESessionPhase.wallet_action:
      return "wallet_action";
    case ESessionPhase.result_ready:
      return "result_ready";
    case ESessionPhase.external_work:
      return "external_work";
    default:
      return undefined;
  }
}

export class MobileBridgeSession {
  readonly token: string;
  /**
   * The turn this session is currently carrying. Mutable because the new-key flow is two-turn:
   * the verification request replaces the start request on the SAME session after the
   * external-work hold (`beginNextTurn`).
   */
  private preparedAction: IMobileBridgePreparedAction;
  private readonly input: IMobileBridgeSessionInput;
  private readonly listeners = new Set<(snapshot: IMobileBridgeSnapshot) => void>();
  private readonly clientSubscriptions: Array<() => void> = [];
  private visibilityListener?: () => void;
  /** The SDK's echoed idempotency id for this logical request — the exact-retry handle (D8). */
  private partnerRequestId?: string;
  private createdSession?: ICreatedPartnerSession;
  private selectedWalletLink?: TMeteorBridgeWalletLink;
  private resultSettled = false;
  private resultReceipt?: ISessionResultReceipt;
  /**
   * Set the moment this turn's result is validated — BEFORE the verb that ends the turn is sent.
   * `acknowledgeAndClose` terminalizes the session inside its own still-pending await, and the
   * client dispatches `factsChanged`/`terminal` synchronously from there, so without this flag the
   * `closed` phase this session just asked for reads back as a counterparty close and rejects the
   * very result being acknowledged. Only that one reading is suppressed: a `failed` phase, or any
   * terminal outcome other than the `closed` we asked for, still fails the turn.
   */
  private closingAfterOwnResult = false;
  /** Set once this session parks in the external-work hold; cleared when the next turn starts. */
  private externalWorkHold?: IMobileBridgeExternalWorkHold;
  /**
   * The journal-before-hold seam of the CURRENT turn. Only an initial `..._start` turn can carry
   * one, so the turn installed after a hold clears it — a hold is never entered twice.
   */
  private turnExternalWorkJournal?: TMobileBridgeExternalWorkJournal;
  private claimedWallet?: TPartnerPairedWallet;
  private completedConnection?: IMeteorConnection_V2_BridgeMobile;
  private resolveResult!: (value: any) => void;
  private rejectResult!: (reason: unknown) => void;
  private resultPromise = this.armResultPromise();
  private preparationPromise?: Promise<void>;
  /**
   * Once-only guard for `collectResult()` — both entry points assign it with `??=`, and
   * `beginNextTurn` clears it to re-arm the next turn. Its value is deliberately never read:
   * biome's `noUnusedPrivateClassMembers` therefore reports it, and applying that autofix
   * would let one turn collect its result twice.
   */
  private collectionPromise?: Promise<void>;
  private readonly abortController = new AbortController();
  private pairingLease?: IMeteorConnectBridgeLeaseHandle;
  private pairingLeasePromise?: Promise<void>;
  private pairingRetryTimer?: ReturnType<typeof setTimeout>;
  private liveSession?: { stop(): Promise<void> };
  private expiryTimer?: ReturnType<typeof setTimeout>;
  private disposePromise?: Promise<void>;
  private snapshot: IMobileBridgeSnapshot = {
    phase: "initializing",
    push: "not_attempted",
    linkPhase: "detached",
    linkRedialAttempt: 0,
    pinAttemptsUsed: 0,
  };

  /** One turn's result promise; re-armed for the turn that follows an external-work hold. */
  private armResultPromise(): Promise<any> {
    const promise = new Promise<any>((resolve, reject) => {
      this.resolveResult = resolve;
      this.rejectResult = reject;
    });
    void promise.catch(() => {});
    return promise;
  }

  /** The turn this session is carrying right now. */
  get prepared(): IMobileBridgePreparedAction {
    return this.preparedAction;
  }

  constructor(input: IMobileBridgeSessionInput) {
    this.input = input;
    this.token = input.token;
    this.preparedAction = input.prepared;
    this.turnExternalWorkJournal = input.journalBeforeExternalWorkHold;
    if (input.pushWallet != null) {
      this.snapshot = { ...this.snapshot, push: "sending" };
    }
    // Observe from construction, not from prepare(): the facts of the very first bind — and a
    // terminal outcome raised while the session is still being created — must not be missed.
    this.watchClientEvents();
    this.watchDocumentVisibility();
  }

  startPreparation(): Promise<void> {
    this.preparationPromise ??= this.prepare();
    return this.preparationPromise;
  }

  getSnapshot(): IMobileBridgeSnapshot {
    return { ...this.snapshot };
  }

  subscribe(listener: (snapshot: IMobileBridgeSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  private update(patch: Partial<IMobileBridgeSnapshot>): void {
    if (!this.input.isCurrent(this.token)) return;
    this.snapshot = { ...this.snapshot, ...patch };
    for (const listener of this.listeners) listener(this.getSnapshot());
  }

  async prepare(): Promise<void> {
    this.update({ phase: "creating_bridge", error: undefined });
    await this.input.assertIdentityGeneration();
    this.liveSession = await this.input.registerLiveSession();

    try {
      // Snapshot the paired-wallet ledger BEFORE the session exists, so the wallet that claims it
      // can be identified exactly afterwards (see resolveClaimedWallet).
      const pinned = this.input.pinnedWallet;
      const session = await this.input.client.createSession({
        initialActionRequest: this.prepared.actionRequest,
        meteorAppIds: [...this.input.targetMeteorAppIds],
        // A reloaded tab's own context can never be re-entered (its partner secret was
        // memory-only); a live sibling tab's context is always kept.
        onContextConflict: "discard-unbound",
        // A session pinned to one wallet says so in the creation binding too, so the backend
        // refuses any other claimant instead of relying on this SDK's local checks alone.
        ...(pinned == null
          ? {}
          : {
              clientConnectionInfo: {
                meteorAppId: pinned.meteorAppId,
                walletVerifyPublicKey: pinned.walletVerifyPublicKey,
                walletExchangePublicKey: pinned.walletExchangePublicKey,
                walletProtocolVersion: pinned.walletProtocolVersion,
                walletCapabilities: [...pinned.walletCapabilities],
              },
            }),
        // Everything else is policy-derived server-side: the idempotency id, authorizationMode,
        // the required wallet capability set, and — for every id but one — the resource profile.
        // `verify_active` permits two profiles, so omitting it there throws
        // SessionResourceProfileAmbiguityError.
        ...(this.prepared.kind.domain === "meteor_wallet_core" &&
        this.prepared.kind.sharedActionId === "new_key_account_transfer_verify_active"
          ? { resourceProfile: ESessionResourceProfile.single_turn_v1 }
          : {}),
      });
      this.createdSession = session;
      this.partnerRequestId = session.partnerRequestId;
      this.publishWalletLink(session);
      this.applySessionFacts(session.facts);
      this.collectionPromise ??= this.collectResult();
      if (this.input.pushWallet != null) {
        await this.notifyPairedWallet(this.input.pushWallet);
      }
    } catch (error) {
      this.fail(error);
      throw error;
    }
  }

  /**
   * Re-arm this session for the turn that follows its external-work hold, and stage that turn on
   * the SAME bridge. `prepareAction` is the client's own prepare-before-send seam — it durably
   * persists the exact signed turn under the session mutation lock — and `submitPreparedAction`
   * re-validates and transmits it. The turn's own request, result promise and receipt are
   * replaced; the bridge, the pairing and the claimed wallet are the ones the held turn proved.
   */
  async beginNextTurn(prepared: IMobileBridgePreparedAction): Promise<void> {
    const hold = this.externalWorkHold;
    if (hold == null) throw new Error(MOBILE_BRIDGE_ENDING.externalWorkHoldUnavailable);
    this.preparedAction = prepared;
    // A continued turn is never a `..._start`, so it can never open a second hold.
    this.turnExternalWorkJournal = undefined;
    this.resultSettled = false;
    this.resultReceipt = undefined;
    this.closingAfterOwnResult = false;
    this.resultPromise = this.armResultPromise();
    this.collectionPromise = undefined;
    this.update({ phase: "creating_bridge", error: undefined });
    try {
      const client = this.input.client;
      const nextTurn = await client.prepareAction({
        actionRequest: prepared.actionRequest,
        sequence: hold.receipt.sequence + 1,
        priorResultHash: hold.receipt.resultHash,
      });
      const facts = await client.submitPreparedAction(nextTurn);
      // The hold is spent the moment its next turn is staged; offering it twice would be a replay.
      this.externalWorkHold = undefined;
      this.applySessionFacts(facts);
      this.collectionPromise ??= this.collectResult();
      // The wallet is already claimed and attached, so this is a turn WAKE, not a claim — and it
      // is classified like every other wake, never booleanised.
      void this.notifyWalletForTurn();
    } catch (error) {
      this.fail(error);
      throw error;
    }
  }

  /** The idempotency id this session was allocated under — reuse only for an exact retry. */
  getPartnerRequestId(): string | undefined {
    return this.partnerRequestId;
  }

  /** The bridge this session was allocated on, once creation succeeded. */
  getBridgeId(): string | undefined {
    return this.createdSession?.bridgeId;
  }

  /** The verified result receipt, once the wallet's signed result has been validated. */
  getResultReceipt(): ISessionResultReceipt | undefined {
    return this.resultReceipt;
  }

  /**
   * The live external-work hold this session is parked in, or `undefined` when it is not holding
   * one. Only a held session can carry the next turn; anything else takes a fresh session.
   */
  getExternalWorkHold(): IMobileBridgeExternalWorkHold | undefined {
    return this.externalWorkHold == null ? undefined : { ...this.externalWorkHold };
  }

  // ---------------------------------------------------------------------------------------------
  // Client observation
  // ---------------------------------------------------------------------------------------------

  /**
   * `client.events` replaces the deleted subclass hooks. Handlers run synchronously inside the
   * client's own hook processing, so none of them may call a client mutation — they only read
   * getters and update this projection (the pairing lease is the SDK's own, not the client's).
   */
  private watchClientEvents(): void {
    const events = this.input.client.events;
    this.clientSubscriptions.push(
      events.on("factsChanged", ({ facts }) => this.applySessionFacts(facts)),
      events.on("terminal", ({ outcome }) => this.applyTerminalOutcome(outcome)),
      events.on("linkStatusChanged", ({ status }) => {
        // The redial ladder is the SDK's (`maxRedialAttempts`); the panel only reports it.
        this.update({
          linkPhase: status.phase,
          linkRedialAttempt: status.attempt,
          linkRetryInMs: status.retryInMs,
        });
        if (status.phase === "rejected") {
          // The backend refused the handshake for this identity (pinned-key mismatch and friends).
          // Redialing cannot help; only a partner-identity reset re-pairs.
          this.update({ identityResetRequired: true });
          this.fail(new Error(MOBILE_BRIDGE_ENDING.identityPinMismatch));
        }
      }),
      // The wallet is displaying a PIN and the PARTNER must collect it. Fires once per binding.
      events.on("pinRequired", ({ facts }) => this.applySessionFacts(facts)),
    );
  }

  private watchDocumentVisibility(): void {
    if (typeof document === "undefined") return;
    const onVisibility = () => {
      if (document.visibilityState !== "visible" || !this.input.isCurrent(this.token)) return;
      // `offline` is the SDK's own bounded-retry release and `connectBridgeLink()` its documented
      // revival. While `reconnecting`, the SDK's redial ladder already owns the dial.
      if (this.input.client.linkStatus.phase !== "offline") return;
      void this.input.client.connectBridgeLink().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisibility);
    this.visibilityListener = () => document.removeEventListener("visibilitychange", onVisibility);
  }

  private applySessionFacts(facts: Readonly<TSessionFacts>): void {
    if (!this.input.isCurrent(this.token)) return;
    this.update({
      facts,
      idleExpiresAt: facts.idleExpiresAt,
      absoluteExpiresAt: facts.absoluteExpiresAt,
    });
    if (isTerminalPhase(facts)) {
      if (facts.phase === ESessionPhase.failed) {
        this.fail(new Error(MOBILE_BRIDGE_ENDING.failed));
        return;
      }
      // `closed` while nothing has settled locally: the counterparty closed the session, which is
      // exactly the 0.9 `cancelled` ending. This session's OWN close verb lands here too — the
      // client publishes its facts from inside the still-pending await — and that is a completed
      // turn, never a cancel.
      if (!this.resultSettled && !this.closingAfterOwnResult) this.markCancelled();
      return;
    }
    this.scheduleExpiry(facts);
    const phase = flowPhaseForSessionPhase(facts.phase);
    if (phase == null || SETTLED_PHASES.includes(this.snapshot.phase)) return;
    if (phase === "wallet_verification") {
      void this.ensureFirstPairingLease();
      return;
    }
    if (phase !== "creating_bridge" && phase !== "waiting_for_wallet") {
      void this.releaseFirstPairingLease();
    }
    this.update({ phase });
  }

  private applyTerminalOutcome(outcome: IBridgeSessionTerminalOutcome): void {
    if (!this.input.isCurrent(this.token)) return;
    this.update({ terminalReason: outcome.reason });
    if (this.resultSettled) return;
    if (outcome.reason === "bridge_gone") {
      this.fail(new Error(MOBILE_BRIDGE_ENDING.expired));
      return;
    }
    if (outcome.reason === "terminal_status" && outcome.statusId === ESessionPhase.closed) {
      // Same rule as `applySessionFacts`: the terminalization our own close verb produces is not
      // a counterparty cancel. Every other reason still fails the turn, so a genuine failure
      // arriving in that same window is never swallowed.
      if (!this.closingAfterOwnResult) this.markCancelled();
      return;
    }
    this.fail(new Error(MOBILE_BRIDGE_ENDING.failed));
  }

  // ---------------------------------------------------------------------------------------------
  // Wallet link + push
  // ---------------------------------------------------------------------------------------------

  private publishWalletLink(session: ICreatedPartnerSession): void {
    // Ordered preference: the first configured app id that has a backend-issued link wins.
    const backendLink = this.input.targetMeteorAppIds
      .map((appId) => session.walletLinks.find((candidate) => candidate.appId === appId))
      .find((candidate) => candidate != null);
    if (backendLink == null) throw new Error("mobile_bridge_app_link_missing");
    // Dev-only local rewrite — web links only, deep links are never rebased. The rewritten link
    // becomes the selected link so the opener allowlist follows it too.
    const link =
      this.input.localDevLinkRewrite != null && backendLink.linkType === EBridgeLinkType.web_app_url
        ? {
            ...backendLink,
            linkString: rebaseWalletLinkToLocalDev(
              backendLink.linkString,
              this.input.localDevLinkRewrite.baseUrl,
            ),
          }
        : backendLink;
    this.selectedWalletLink = link;
    // The memory-only secret rides the URL fragment. `buildWalletLinkUrl` is the only supported
    // way to build it and `parseWalletLinkUrl` the only supported way to read it back — a
    // hand-concatenated link is the historical source of unclaimable bridges.
    // The rebased local-dev link is the only case where partner and wallet can legitimately be on
    // different backends, so it is the only case that advertises one. Deployed links stay unset.
    const hint = this.input.localDevLinkRewrite?.mcBackendHintUrl;
    this.update({
      deepLink: buildWalletLinkUrl(session, link, ...(hint == null ? [] : [{ backendUrlHint: hint }])),
    });
  }

  /**
   * Wake an already-paired wallet for the initial claim. The outcome is CLASSIFIED, never
   * booleanised: a web wallet has no push registration at all, so `delivered: false` with reason
   * `no_token` is the expected path and the QR/link stays the real delivery channel.
   */
  private async notifyPairedWallet(wallet: TPartnerPairedWallet): Promise<void> {
    await this.applyWakeOutcome(() =>
      this.input.client.notifyWalletForInitialClaim(wallet.walletVerifyPublicKey),
    );
  }

  /**
   * Wake the already-claimed wallet for the turn that follows the external-work hold. Same
   * classification rule as the initial claim: never booleanised, and never a reason to hide the
   * link — the wallet may simply still be sitting on the same bridge.
   */
  private async notifyWalletForTurn(): Promise<void> {
    await this.applyWakeOutcome(() => this.input.client.notifyWalletForCurrentTurn());
  }

  private async applyWakeOutcome(
    send: () => Promise<{ delivered: boolean; reason?: string | null }>,
  ): Promise<void> {
    this.update({ push: "sending" });
    let outcome: { delivered: boolean; reason?: string | null };
    try {
      outcome = await send();
    } catch {
      outcome = { delivered: false, reason: null };
    }
    const classified = classifyPushWakeOutcome(outcome);
    this.update({
      push: classified.delivered ? "delivered" : "not_delivered",
      pushOutcome: classified,
      pushReason: classified.reason ?? undefined,
    });
  }

  // ---------------------------------------------------------------------------------------------
  // Result collection
  // ---------------------------------------------------------------------------------------------

  /**
   * Wait → match → validate against the exact request we staged, then end in ONE explicit verb.
   * `waitForValidatedResult` never acknowledges anything itself, and a session parked in
   * `result_ready` blocks the wallet — so every arm below, the failures included, sends a verb.
   */
  private async collectResult(): Promise<void> {
    const kind = this.prepared.kind;
    try {
      const output =
        kind.domain === "meteor_wallet_core"
          ? await this.collectMeteorWalletCoreResult(kind.sharedActionId)
          : await this.collectNearResult();
      this.resultSettled = true;
      // A journal-backed external-work hold keeps the SESSION live even though this TURN is
      // settled: the AddKey window runs next, then the verification turn on the same bridge.
      this.update({ phase: this.externalWorkHold == null ? "completed" : "external_work" });
      this.resolveResult(output);
    } catch (error) {
      this.fail(error);
    }
  }

  private async collectMeteorWalletCoreResult(
    sharedActionId: TMeteorWalletCoreActionId,
  ): Promise<unknown> {
    const client = this.input.client;
    const outcome = await client.waitForValidatedResult(
      act_impl_meteor_wallet_core,
      sharedActionId,
      // The abort signal makes disposal deterministic: the wait cancels locally (F7) instead of
      // depending on `disconnectBridge` to reject it, and the session itself is left untouched.
      { input: this.prepared.actionInput, signal: this.abortController.signal },
    );
    this.resultReceipt = outcome.receipt;
    // Every arm below ends this turn with a verb of THIS session's own, so the flag is raised
    // here — before the first of them is sent — and never after one has already terminalized.
    this.closingAfterOwnResult = true;
    if (outcome.status === "mismatch") {
      // Receipt-only acknowledgement: nothing from a mismatched output may be trusted, but the
      // session must not be left parked in `result_ready` either.
      await client.acknowledgeAndClose(outcome.receipt);
      throw new Error(MOBILE_BRIDGE_ENDING.resultMismatch);
    }
    if (outcome.status === "declined") {
      // A signed typed-error result. Acknowledgement is transport receipt, never acceptance.
      await client.acknowledgeAndClose(outcome.receipt);
      throw new Error(
        `${MOBILE_BRIDGE_ENDING.walletDeclined}: ${outcome.errorIds.join(",")} — ${outcome.errorMessage}`,
      );
    }
    const journalBeforeHold = this.turnExternalWorkJournal;
    if (journalBeforeHold != null) {
      const created = this.createdSession;
      if (created == null) throw new Error(MOBILE_BRIDGE_ENDING.externalWorkHoldUnavailable);
      // Journal-before-hold (D33). The contract requires the signed result to be durable BEFORE
      // the hold begins, and the hold to name the exact hash that was written — so the mapping and
      // the host journal both run first, and the backend refuses any drift as
      // `external_work_journal_mismatch`.
      let journaledResultHash: string;
      let heldOutput: unknown;
      try {
        heldOutput = meteorWalletCoreOutputToSdk(this.prepared, outcome.output);
        journaledResultHash = await journalBeforeHold({
          receipt: outcome.receipt,
          output: heldOutput,
        });
      } catch (error) {
        // Nothing durable was accepted, so no hold may begin. Acknowledge receipt and close so the
        // session is not left parked in `result_ready` holding the wallet's signed result.
        await client.acknowledgeAndClose(outcome.receipt).catch(() => {});
        throw error;
      }
      const facts = await client.acknowledgeAndBeginExternalWork(
        outcome.receipt,
        journaledResultHash,
      );
      const walletConnection = this.input.buildConnection(this.resolveClaimedWallet());
      this.completedConnection = walletConnection;
      this.externalWorkHold = {
        bridgeId: outcome.receipt.bridgeId,
        partnerRequestId: created.partnerRequestId,
        receipt: outcome.receipt,
        walletConnection,
      };
      this.applySessionFacts(facts);
      return heldOutput;
    }
    // The verb goes FIRST, before any business-level mapping: the result is already verified and
    // bound to this turn, so acknowledging it is correct regardless of what the SDK then makes of
    // it — and a mapping that throws must never leave the session parked in `result_ready`.
    await client.acknowledgeAndClose(outcome.receipt);
    if (sharedActionId !== "transfer_accounts") {
      // Pin the exact wallet identity that authored this result; the matching `..._verify_active`
      // turn is bound to it.
      this.completedConnection = this.input.buildConnection(this.resolveClaimedWallet());
    }
    return meteorWalletCoreOutputToSdk(this.prepared, outcome.output);
  }

  private async collectNearResult(): Promise<unknown> {
    const kind = this.prepared.kind;
    if (kind.domain !== "near") throw new Error("mobile_bridge_unsupported_action_result");
    const client = this.input.client;
    const outcome = await client.waitForValidatedResult(act_impl_near, kind.sharedActionId, {
      input: this.prepared.actionInput,
      signal: this.abortController.signal,
    });
    this.resultReceipt = outcome.receipt;
    // Same rule as the meteor_wallet_core collector: raised before the first closing verb.
    this.closingAfterOwnResult = true;
    if (outcome.status === "mismatch") {
      await client.acknowledgeAndClose(outcome.receipt);
      throw new Error(MOBILE_BRIDGE_ENDING.resultMismatch);
    }
    if (outcome.status === "declined") {
      await client.acknowledgeAndClose(outcome.receipt);
      throw new Error(
        `${MOBILE_BRIDGE_ENDING.walletDeclined}: ${outcome.errorIds.join(",")} — ${outcome.errorMessage}`,
      );
    }
    // Same rule as above: acknowledge and close before the SDK-shaped hydration, which does local
    // key persistence and account-identity checks that must not be able to park the session.
    await client.acknowledgeAndClose(outcome.receipt);
    const connection = this.input.buildConnection(this.resolveClaimedWallet());
    this.completedConnection = connection;
    return nearOutputToSdk(this.prepared, outcome.output, {
      getConnection: () => connection,
      persistFunctionCallKey: this.input.persistFunctionCallKey,
    });
  }

  // ---------------------------------------------------------------------------------------------
  // Claimed wallet identity
  // ---------------------------------------------------------------------------------------------

  /**
   * Which wallet claimed THIS session.
   *
   * `client.claimedWallet` is the session's own binding (0.13+), so this no longer has to diff the
   * whole paired-wallet ledger against a pre-session baseline and fail closed on an ambiguous
   * result. A pushed session additionally pins the exact verify key it targeted — a claim by any
   * other wallet is refused rather than accepted.
   */
  private resolveClaimedWallet(): TPartnerPairedWallet {
    if (this.claimedWallet != null) return this.claimedWallet;
    const claimed = this.input.client.claimedWallet;
    if (claimed == null) throw new Error("mobile_bridge_active_wallet_unavailable");
    const pinned = this.input.pushWallet;
    if (pinned != null && claimed.walletVerifyPublicKey !== pinned.walletVerifyPublicKey) {
      throw new Error("mobile_bridge_active_wallet_unavailable");
    }
    if (!this.input.targetMeteorAppIds.includes(claimed.meteorAppId)) {
      throw new Error("mobile_bridge_active_wallet_unavailable");
    }
    this.claimedWallet = claimed;
    return claimed;
  }

  // ---------------------------------------------------------------------------------------------
  // Deadlines and the first-pairing lease
  // ---------------------------------------------------------------------------------------------

  private scheduleExpiry(facts: Readonly<TSessionFacts>): void {
    if (this.expiryTimer != null) clearTimeout(this.expiryTimer);
    // The idle window normally runs out first; the absolute deadline is the hard wall that no
    // successful transition moves.
    const expiresAt = Math.min(facts.idleExpiresAt, facts.absoluteExpiresAt);
    const delay = Math.max(0, expiresAt - Date.now());
    this.expiryTimer = setTimeout(
      () => {
        if (!SETTLED_PHASES.includes(this.snapshot.phase)) {
          this.fail(new Error(MOBILE_BRIDGE_ENDING.expired));
        }
      },
      Math.min(delay, 2_147_483_647),
    );
  }

  private async ensureFirstPairingLease(): Promise<void> {
    if (SETTLED_PHASES.includes(this.snapshot.phase)) return;
    if (this.pairingLease != null) {
      this.update({ phase: "wallet_verification" });
      return;
    }
    if (this.pairingLeasePromise != null) return this.pairingLeasePromise;
    this.update({ phase: "busy_other_tab" });
    this.pairingLeasePromise = (async () => {
      try {
        const lease = await this.input.acquireFirstPairingLease();
        await lease.assertOwned();
        if (!this.input.isCurrent(this.token)) {
          await lease.release();
          return;
        }
        this.pairingLease = lease;
        this.update({ phase: "wallet_verification", error: undefined });
      } catch {
        if (!this.input.isCurrent(this.token)) return;
        this.update({ phase: "busy_other_tab", error: "Meteor Mobile is busy in another tab." });
        this.pairingRetryTimer = setTimeout(() => {
          this.pairingLeasePromise = undefined;
          void this.ensureFirstPairingLease();
        }, 1_000);
      }
    })();
    return this.pairingLeasePromise;
  }

  private async releaseFirstPairingLease(): Promise<void> {
    if (this.pairingRetryTimer != null) clearTimeout(this.pairingRetryTimer);
    const lease = this.pairingLease;
    this.pairingLease = undefined;
    await lease?.release();
  }

  // ---------------------------------------------------------------------------------------------
  // Settling
  // ---------------------------------------------------------------------------------------------

  private fail(error: unknown): void {
    // Nothing may re-open a settled flow — including a disposed one, whose in-flight result wait
    // rejects moments after the local waiters were already released. A session parked in the
    // external-work hold is the one exception: its TURN is settled but the session is still live,
    // so its failure must still be published or a dead hold would stay adoptable.
    if (this.resultSettled && this.externalWorkHold == null) return;
    this.externalWorkHold = undefined;
    // One classifier, no message matching, classified exactly once — here. The panel renders the
    // headline/detail and keeps the untouched original message as fine print; where the failure
    // was a typed protocol rejection its ids ride along, so copy decisions ("update your wallet")
    // are made against `errorIds`, never by inspecting an error string.
    const described = describeSessionError(error, { backendUrl: this.input.client.backendUrl });
    this.update({
      phase: "failed",
      errorHeadline: described.headline,
      errorDetail: described.detail,
      errorIds:
        described.kind === "session" || described.kind === "bridge" ? [...described.ids] : [],
      error: described.originalMessage,
    });
    if (!this.resultSettled) {
      this.resultSettled = true;
      this.rejectResult(error);
    }
    void this.releaseFirstPairingLease();
  }

  private markCancelled(): void {
    this.externalWorkHold = undefined;
    this.update({ phase: "cancelled" });
    if (!this.resultSettled) {
      this.resultSettled = true;
      this.rejectResult(new Error(MOBILE_BRIDGE_ENDING.cancelled));
    }
    void this.releaseFirstPairingLease();
  }

  async submitPin(pinCode: string): Promise<void> {
    if (!/^\d{4}$/.test(pinCode)) throw new Error("Enter the 4-digit PIN shown in Meteor Mobile");
    // The protocol still exposes no server-side attempt counter, so this cap stays load-bearing.
    if (this.snapshot.pinAttemptsUsed >= 3) {
      throw new Error(MOBILE_BRIDGE_ENDING.pinAttemptsExceeded);
    }
    const attempts = this.snapshot.pinAttemptsUsed + 1;
    this.update({ pinAttemptsUsed: attempts, pinError: undefined });
    try {
      await this.input.assertIdentityGeneration();
      await this.input.client.verifyPin(pinCode);
    } catch (error) {
      const described = describeSessionError(error, { backendUrl: this.input.client.backendUrl });
      const incorrect = described.kind === "session" && described.ids.includes("pin_incorrect");
      this.update({
        pinError:
          attempts >= 3
            ? MOBILE_BRIDGE_ENDING.pinAttemptsExceeded
            : incorrect
              ? "Incorrect PIN"
              : described.headline,
      });
      throw error;
    }
  }

  /**
   * Revive a bridge link the SDK's bounded redial ladder gave up on (`linkPhase === "offline"`).
   * The panel's Reconnect button is the user-mediated half of `maxRedialAttempts`: while
   * `reconnecting`, the ladder still owns the dial and this is a no-op.
   */
  async reconnectLink(): Promise<void> {
    if (this.input.client.linkStatus.phase !== "offline") return;
    await this.input.client.connectBridgeLink();
  }

  /** The backend-issued wallet link the deep link / QR was built from (undefined pre-session). */
  getSelectedWalletLink(): TMeteorBridgeWalletLink | undefined {
    return this.selectedWalletLink;
  }

  /** Exact verified wallet identity that authored a completed new-key transfer result. */
  getCompletedConnection(): IMeteorConnection_V2_BridgeMobile | undefined {
    return this.completedConnection == null ? undefined : { ...this.completedConnection };
  }

  isCommitted(): boolean {
    return COMMITTED_PHASES.includes(this.snapshot.phase);
  }

  /**
   * Cancel before the wallet commits. The close verb is never chosen by hand: `describeCloseOptions`
   * names the one operation the §5.7 matrix permits for the partner in the current authenticated
   * phase, and `closePhaseSafe` performs exactly that one — never a blind destructive close.
   */
  async cancel(): Promise<"cancelled_before_commit" | "target_already_committed"> {
    if (this.snapshot.phase === "cancelled" || this.snapshot.phase === "failed") {
      return "cancelled_before_commit";
    }
    await this.preparationPromise?.catch(() => {});
    if (this.isCommitted()) return "target_already_committed";
    const facts = this.input.client.sessionFacts;
    if (facts == null || isTerminalPhase(facts)) {
      this.markCancelled();
      return "cancelled_before_commit";
    }
    const closeOptions = describeCloseOptions(facts, "partner");
    if (closeOptions.operation == null) {
      // The phase permits no close operation (nothing claimable exists yet); settle locally.
      this.markCancelled();
      return "cancelled_before_commit";
    }
    if (closeOptions.requiresReceipt && this.resultReceipt == null) {
      throw new Error("mobile_bridge_result_pending");
    }
    await this.input.assertIdentityGeneration();
    await this.input.client.closePhaseSafe(this.resultReceipt);
    this.markCancelled();
    return "cancelled_before_commit";
  }

  /**
   * End this session from the owning action's teardown. Unlike {@link cancel} — whose
   * `target_already_committed` answer deliberately keeps a wallet-held request alive so another
   * execution target can adopt it — abandonment always sends the ONE close verb §5.7 permits for
   * the current authenticated phase, so a session is never left parked in `result_ready` sitting
   * on the wallet's signed result. An external-work hold is closed here too: reaching abandonment
   * means the owning action was cancelled, so the AddKey window is over before it began.
   */
  async abandon(): Promise<void> {
    if (SETTLED_PHASES.includes(this.snapshot.phase)) return;
    await this.preparationPromise?.catch(() => {});
    const facts = this.input.client.sessionFacts;
    if (facts == null || isTerminalPhase(facts)) {
      this.markCancelled();
      return;
    }
    const closeOptions = describeCloseOptions(facts, "partner");
    if (closeOptions.operation == null) {
      this.markCancelled();
      return;
    }
    // `result_ready` is the phase that matters here: its permitted operation is the destructive
    // `abandonResultAndClose`, and it REQUIRES the receipt of the result being discarded.
    if (closeOptions.requiresReceipt && this.resultReceipt == null) {
      this.markCancelled();
      return;
    }
    await this.input.assertIdentityGeneration();
    await this.input.client.closePhaseSafe(this.resultReceipt);
    this.markCancelled();
  }

  async awaitResult(): Promise<any> {
    return this.resultPromise;
  }

  openInApp(open: (fullLink: string) => void): void {
    if (this.snapshot.deepLink == null) throw new Error("mobile_bridge_link_not_ready");
    open(this.snapshot.deepLink);
  }

  private async disposeInternal(): Promise<void> {
    this.abortController.abort();
    for (const unsubscribe of this.clientSubscriptions.splice(0)) unsubscribe();
    this.visibilityListener?.();
    if (this.expiryTimer != null) clearTimeout(this.expiryTimer);
    if (this.pairingRetryTimer != null) clearTimeout(this.pairingRetryTimer);
    if (!this.resultSettled) {
      this.resultSettled = true;
      this.rejectResult(new Error(MOBILE_BRIDGE_ENDING.disposed));
    }
    this.externalWorkHold = undefined;
    await this.releaseFirstPairingLease();
    await this.liveSession?.stop();
    this.listeners.clear();
    // A local release publishes no session event, so nothing observes it — it runs last, after
    // every local waiter has already been settled.
    await this.input.client.disconnectBridge();
  }

  dispose(): Promise<void> {
    this.disposePromise ??= this.disposeInternal();
    return this.disposePromise;
  }

  /**
   * Release the owning ACTION's grip on a session that is holding an external-work window, without
   * touching the bridge. The start action's UI is finished, but the held session IS the transport
   * for the verification turn — disconnecting here would force the wallet to mint a second
   * destination key. Local observers (the transfer key handle, the panel) are dropped; the client
   * subscriptions stay, because the hold's own expiry and terminal outcomes must still land.
   */
  releaseUiObservers(): void {
    this.listeners.clear();
    this.visibilityListener?.();
    this.visibilityListener = undefined;
  }
}
