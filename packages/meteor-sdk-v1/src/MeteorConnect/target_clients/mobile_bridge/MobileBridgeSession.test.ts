import { describe, expect, it } from "bun:test";
import type {
  ICreatedPartnerSession,
  ICreateSessionInput,
  ISessionLinkStatus,
  ISessionResultReceipt,
  PartnerSessionClient,
  TPartnerPairedWallet,
  TValidatedSessionResult,
} from "@meteorwallet/connect";
import { describeCloseOptions, describeSessionError, isTerminalPhase } from "@meteorwallet/connect";
import {
  EBridgeLinkType,
  EErr_Bridge_Session,
  EMeteorAppId,
  ESessionNotifyWalletReason,
  ESessionPhase,
  ESessionResourceProfile,
  EWalletPlatform,
  merr_bridge_session,
  type TSessionFacts,
} from "@meteorwallet/connect-shared";
import {
  createSessionClientDoubleBase,
  sessionFactsFor,
} from "../../test/test_utils/sessionClientDouble";
import type { IMobileBridgePreparedAction } from "./MeteorConnectMobileBridgeClient.types";
import { MobileBridgeSession, type TMobileBridgePhase } from "./MobileBridgeSession";

const PAIRED_WALLET: TPartnerPairedWallet = {
  walletVerifyPublicKey: "ed25519::raw_base64::d2FsbGV0",
  walletExchangePublicKey: "x25519::raw_base64::d2FsbGV0",
  meteorAppId: EMeteorAppId.meteor_wallet_web_dev,
  pairedAt: 1,
  walletProtocolVersion: 2,
  walletCapabilities: [],
};

const WEB_LINK_STRING =
  "https://wallet-dev.meteorwallet.app/bridge_request?linkFormat=s1&bridgeId=b1&bridgeLease=lease1";

const createdSessionFor = (phase: ESessionPhase): ICreatedPartnerSession =>
  ({
    bridgeId: "b1",
    bridgeLease: "lease1",
    partnerId: "partner-1",
    partnerRequestId: "sdk-generated-request-id",
    partnerSecret: "secret value/with+chars",
    walletLinks: [
      {
        appId: EMeteorAppId.meteor_wallet_web_dev,
        walletName: "Meteor Web Dev",
        walletDescription: "dev",
        platform: EWalletPlatform.web,
        linkString: WEB_LINK_STRING,
        linkType: EBridgeLinkType.web_app_url,
      },
    ],
    facts: sessionFactsFor(phase),
    initialTurn: { envelope: {}, signatureBase64: "" },
  }) as unknown as ICreatedPartnerSession;

/**
 * A `PartnerSessionClient`-shaped double: the shared emission base (`client.events`, and the
 * publish-before-you-resolve rule every facts-returning verb obeys), the two read-only projections
 * the snapshot derives from (`linkStatus`, `sessionFacts`), and the verbs these tests exercise.
 * Typed on purpose — the untyped `as any` stub this replaced was hiding exactly the kind of
 * surface drift a client-library upgrade introduces.
 */
function createClientDouble(
  overrides: {
    disconnectBridge?: () => Promise<void>;
    linkStatus?: Partial<ISessionLinkStatus>;
    sessionFacts?: TSessionFacts;
    createSession?: (input: ICreateSessionInput) => Promise<ICreatedPartnerSession>;
    waitForValidatedResult?: () => Promise<TValidatedSessionResult<unknown>>;
    acknowledgeAndClose?: (receipt: ISessionResultReceipt) => Promise<TSessionFacts>;
    closePhaseSafe?: (receipt?: ISessionResultReceipt) => Promise<TSessionFacts>;
    pairedWallets?: TPartnerPairedWallet[];
    notifyWalletForInitialClaim?: () => Promise<{
      delivered: boolean;
      reason?: ESessionNotifyWalletReason;
    }>;
  } = {},
) {
  let pairedAtTicks = PAIRED_WALLET.pairedAt;
  // The emission contract every double here shares: a verb publishes the facts it returns from
  // inside its own still-pending await (see `createSessionClientDoubleBase`).
  const base = createSessionClientDoubleBase({ facts: overrides.sessionFacts });
  const createSession =
    overrides.createSession ?? (async () => createdSessionFor(ESessionPhase.waiting_for_wallet));
  const disconnectBridge = overrides.disconnectBridge ?? (async () => {});
  const acknowledgeAndClose =
    overrides.acknowledgeAndClose ?? (async () => sessionFactsFor(ESessionPhase.closed));
  const closePhaseSafe =
    overrides.closePhaseSafe ?? (async () => sessionFactsFor(ESessionPhase.closed));
  const client = {
    backendUrl: "https://bridge.example",
    events: base.events,
    linkStatus: {
      phase: "detached",
      attempt: 0,
      retryInMs: undefined,
      lastDownForMs: undefined,
      attachError: undefined,
      diagnostics: {},
      ...overrides.linkStatus,
    } satisfies ISessionLinkStatus,
    get sessionFacts(): Readonly<TSessionFacts> | undefined {
      return base.getSessionFacts();
    },
    disconnectBridge: async (): Promise<void> => {
      await disconnectBridge();
      // The client drops the binding's facts here, so a fresh session starts from nothing.
      base.releaseBinding();
    },
    // The session's own claimant (0.13+). `pairedWallets: []` models a session nobody claimed —
    // the client leaves `claimedWallet` undefined until a claim binds one.
    get claimedWallet(): TPartnerPairedWallet | undefined {
      const paired = overrides.pairedWallets ?? [
        { ...PAIRED_WALLET, pairedAt: (pairedAtTicks += 1) },
      ];
      return paired[0];
    },
    getPairedWallets: async (): Promise<TPartnerPairedWallet[]> =>
      overrides.pairedWallets ?? [{ ...PAIRED_WALLET, pairedAt: (pairedAtTicks += 1) }],
    // `createSession` binds the session and stages its initial turn, accepting the facts it is
    // about to return along the way — so those facts are published too, not merely returned.
    createSession: async (input: ICreateSessionInput): Promise<ICreatedPartnerSession> => {
      const created = await createSession(input);
      base.publishFacts(created.facts);
      return created;
    },
    notifyWalletForInitialClaim:
      overrides.notifyWalletForInitialClaim ?? (async () => ({ delivered: true })),
    // Unless a test scripts one, the result wait never settles: the flow endings under test are
    // the ones that arrive through events instead.
    waitForValidatedResult:
      overrides.waitForValidatedResult ??
      (() => new Promise<TValidatedSessionResult<unknown>>(() => {})),
    acknowledgeAndClose: base.verb(acknowledgeAndClose, { selfInitiated: true }),
    closePhaseSafe: base.verb(closePhaseSafe, { selfInitiated: true }),
  };
  return { client, emit: base.emit };
}

const PREPARED: IMobileBridgePreparedAction = {
  sdkRequest: { id: "meteor_wallet_core::transfer_accounts", expandedInput: {} } as never,
  actionRequest: { domain: "meteor_wallet_core", id: "transfer_accounts" } as never,
  actionInput: {},
  kind: { domain: "meteor_wallet_core", sharedActionId: "transfer_accounts" },
};

type TSessionInput = ConstructorParameters<typeof MobileBridgeSession>[0];

function sessionInputFor(
  client: ReturnType<typeof createClientDouble>["client"],
  input: {
    pushWallet?: TPartnerPairedWallet;
    localDevLinkRewrite?: { baseUrl: string; mcBackendHintUrl: string };
  } = {},
): TSessionInput {
  return {
    token: "test-session",
    client: client as unknown as PartnerSessionClient,
    prepared: PREPARED,
    targetMeteorAppIds: [EMeteorAppId.meteor_wallet_web_dev],
    localDevLinkRewrite: input.localDevLinkRewrite,
    pushWallet: input.pushWallet,
    buildConnection: () => ({
      executionTarget: "v2_bridge_mobile",
      schemaVersion: 1,
      bridgeEnvironmentId: "env",
      meteorAppId: EMeteorAppId.meteor_wallet_web_dev,
      partnerClientId: "partner-1",
      walletVerifyPublicKey: PAIRED_WALLET.walletVerifyPublicKey,
    }),
    isCurrent: () => true,
    assertIdentityGeneration: async () => {},
    acquireFirstPairingLease: async () => ({
      ownerToken: "lease",
      assertOwned: async () => {},
      release: async () => {},
    }),
    registerLiveSession: async () => ({ stop: async () => {} }),
  };
}

function createSession(
  input: {
    pushWallet?: TPartnerPairedWallet;
    client?: ReturnType<typeof createClientDouble>["client"];
    localDevLinkRewrite?: { baseUrl: string; mcBackendHintUrl: string };
  } = {},
) {
  const client = input.client ?? createClientDouble().client;
  return new MobileBridgeSession(sessionInputFor(client, input));
}

const linkStatusFor = (
  phase: ISessionLinkStatus["phase"],
  redial?: { attempt: number; retryInMs: number },
): ISessionLinkStatus => ({
  phase,
  attempt: redial?.attempt ?? 0,
  retryInMs: redial?.retryInMs,
  lastDownForMs: undefined,
  attachError: undefined,
  diagnostics: {},
});

const rejectionOf = (session: MobileBridgeSession): Promise<Error | undefined> =>
  session.awaitResult().then(
    () => undefined,
    (error: Error) => error,
  );

describe("MobileBridgeSession push presentation state", () => {
  it("starts in sending state when a paired wallet will receive a push", () => {
    expect(createSession({ pushWallet: PAIRED_WALLET }).getSnapshot().push).toBe("sending");
  });

  it("does not claim to be sending a push during first-time QR pairing", () => {
    expect(createSession().getSnapshot().push).toBe("not_attempted");
  });

  it("settles an abandoned result and disposes the bridge only once", async () => {
    let disconnectCalls = 0;
    const { client } = createClientDouble({
      disconnectBridge: async () => {
        disconnectCalls += 1;
      },
    });
    const session = createSession({ client });
    const result = rejectionOf(session);

    await Promise.all([session.dispose(), session.dispose()]);

    expect((await result)?.message).toBe("mobile_bridge_session_disposed");
    expect(disconnectCalls).toBe(1);
  });
});

describe("MobileBridgeSession session-facts projection", () => {
  it("projects every non-terminal session phase, including the two new ones", () => {
    const double = createClientDouble();
    const session = createSession({ client: double.client });
    // `wallet_verification` is owned by the first-pairing lease and is asserted separately.
    const projected: Array<[ESessionPhase, TMobileBridgePhase]> = [
      [ESessionPhase.waiting_for_wallet, "waiting_for_wallet"],
      [ESessionPhase.wallet_action, "wallet_action"],
      [ESessionPhase.result_ready, "result_ready"],
      [ESessionPhase.external_work, "external_work"],
    ];
    for (const [sessionPhase, flowPhase] of projected) {
      double.emit("factsChanged", { facts: sessionFactsFor(sessionPhase), source: "realm" });
      expect(session.getSnapshot().phase).toBe(flowPhase);
    }
  });

  it("treats result_ready and external_work as committed — a refresh may not discard them", () => {
    const double = createClientDouble();
    const session = createSession({ client: double.client });
    double.emit("factsChanged", {
      facts: sessionFactsFor(ESessionPhase.result_ready),
      source: "realm",
    });
    expect(session.isCommitted()).toBe(true);
    double.emit("factsChanged", {
      facts: sessionFactsFor(ESessionPhase.external_work),
      source: "realm",
    });
    expect(session.isCommitted()).toBe(true);
  });

  it("publishes both deadlines so the countdown and the hard wall stay distinguishable", () => {
    const double = createClientDouble();
    const session = createSession({ client: double.client });
    const live = sessionFactsFor(ESessionPhase.waiting_for_wallet);
    double.emit("factsChanged", { facts: live, source: "realm" });
    const snapshot = session.getSnapshot();
    expect(snapshot.idleExpiresAt).toBe(live.idleExpiresAt);
    expect(snapshot.absoluteExpiresAt).toBe(live.absoluteExpiresAt);
    expect(snapshot.absoluteExpiresAt).toBeGreaterThan(snapshot.idleExpiresAt ?? 0);
  });

  it("carries the facts verbatim so the UI derives its close verb from the SDK's own matrix", () => {
    const double = createClientDouble();
    const session = createSession({ client: double.client });

    // Live facts: the panel labels its close button from `describeCloseOptions(facts, "partner")`
    // rather than from the projected flow phase, so the facts themselves have to be on offer.
    const live = sessionFactsFor(ESessionPhase.result_ready);
    double.emit("factsChanged", { facts: live, source: "realm" });
    const liveFacts = session.getSnapshot().facts;
    expect(liveFacts).toBe(live);
    expect(liveFacts == null ? null : isTerminalPhase(liveFacts)).toBe(false);
    expect(liveFacts == null ? null : describeCloseOptions(liveFacts, "partner")).toEqual({
      operation: "abandon_result_and_close",
      destructive: true,
      requiresReceipt: true,
    });

    const closed = sessionFactsFor(ESessionPhase.closed);
    double.emit("factsChanged", { facts: closed, source: "realm" });
    const closedFacts = session.getSnapshot().facts;
    expect(closedFacts == null ? null : isTerminalPhase(closedFacts)).toBe(true);
    expect(
      closedFacts == null ? null : describeCloseOptions(closedFacts, "partner").operation,
    ).toBe(null);
  });

  it("ends a session the counterparty closed as cancelled, not failed", async () => {
    const double = createClientDouble();
    const session = createSession({ client: double.client });
    const result = rejectionOf(session);
    double.emit("factsChanged", { facts: sessionFactsFor(ESessionPhase.closed), source: "realm" });
    expect(session.getSnapshot().phase).toBe("cancelled");
    expect((await result)?.message).toBe("mobile_bridge_cancelled");
  });

  it("ends a session that terminalized in failed as failed", async () => {
    const double = createClientDouble();
    const session = createSession({ client: double.client });
    const result = rejectionOf(session);
    double.emit("factsChanged", { facts: sessionFactsFor(ESessionPhase.failed), source: "realm" });
    expect(session.getSnapshot().phase).toBe("failed");
    expect((await result)?.message).toBe("mobile_bridge_failed");
  });
});

describe("MobileBridgeSession link status projection", () => {
  it("projects the SDK's own link phase and its bounded redial ladder", () => {
    const double = createClientDouble();
    const session = createSession({ client: double.client });

    double.emit("linkStatusChanged", { status: linkStatusFor("live") });
    expect(session.getSnapshot()).toMatchObject({ linkPhase: "live", linkRedialAttempt: 0 });

    // The attempt/countdown come straight off the SDK — nothing here counts redials itself.
    double.emit("linkStatusChanged", {
      status: linkStatusFor("reconnecting", { attempt: 3, retryInMs: 4_000 }),
    });
    expect(session.getSnapshot()).toMatchObject({
      linkPhase: "reconnecting",
      linkRedialAttempt: 3,
      linkRetryInMs: 4_000,
    });

    // `offline` is the bounded-retry release, not a terminal state — the panel offers Reconnect.
    double.emit("linkStatusChanged", { status: linkStatusFor("offline") });
    expect(session.getSnapshot()).toMatchObject({ linkPhase: "offline" });
  });

  it("fails closed with a reset prompt when the backend rejects this identity's handshake", async () => {
    const double = createClientDouble();
    const session = createSession({ client: double.client });
    const result = rejectionOf(session);
    double.emit("linkStatusChanged", {
      status: { ...linkStatusFor("rejected"), attachError: "pinned key mismatch" },
    });
    expect(session.getSnapshot()).toMatchObject({ phase: "failed", identityResetRequired: true });
    expect((await result)?.message).toBe("mobile_bridge_identity_pin_mismatch");
  });
});

describe("MobileBridgeSession terminal outcomes", () => {
  it("maps a released bridge to expiry", async () => {
    const double = createClientDouble();
    const session = createSession({ client: double.client });
    const result = rejectionOf(session);
    double.emit("terminal", { outcome: { reason: "bridge_gone", selfInitiated: false } });
    expect(session.getSnapshot().terminalReason).toBe("bridge_gone");
    expect((await result)?.message).toBe("mobile_bridge_expired");
  });

  it("maps an exhausted redial budget to failure", async () => {
    const double = createClientDouble();
    const session = createSession({ client: double.client });
    const result = rejectionOf(session);
    double.emit("terminal", { outcome: { reason: "retry_budget", selfInitiated: false } });
    expect(session.getSnapshot().terminalReason).toBe("retry_budget");
    expect((await result)?.message).toBe("mobile_bridge_failed");
  });

  it("maps a closed terminal status to cancellation", async () => {
    const double = createClientDouble();
    const session = createSession({ client: double.client });
    const result = rejectionOf(session);
    double.emit("terminal", {
      // Counterparty close: NOT self-initiated — that distinction is the whole point here.
      outcome: { reason: "terminal_status", statusId: ESessionPhase.closed, selfInitiated: false },
    });
    expect((await result)?.message).toBe("mobile_bridge_cancelled");
  });
});

describe("MobileBridgeSession session creation", () => {
  it("takes the created facts from inside createSession, before the link is published", async () => {
    // `createSession` is a facts-accepting verb too: it binds the session and stages its initial
    // turn, publishing the facts it is about to return from inside its own still-pending await.
    // The projection is therefore already live while the presented link is still being built —
    // the ordering this session must tolerate, and the one a returns-only double never produces.
    const double = createClientDouble();
    const session = createSession({ client: double.client });
    const seen: Array<{ facts: string; deepLink: string | undefined }> = [];
    double.client.events.on("factsChanged", ({ facts, source }) =>
      seen.push({ facts: `${facts.phase}:${source}`, deepLink: session.getSnapshot().deepLink }),
    );

    await session.startPreparation();

    expect(seen).toEqual([
      { facts: `${ESessionPhase.waiting_for_wallet}:action`, deepLink: undefined },
    ]);
    expect(session.getSnapshot()).toMatchObject({ phase: "waiting_for_wallet" });
    expect(session.getSnapshot().deepLink).toBeDefined();
  });

  it("keeps the SDK-echoed partnerRequestId as the exact-retry handle", async () => {
    const double = createClientDouble();
    const session = createSession({ client: double.client });
    await session.startPreparation();
    // The SDK generates and echoes the idempotency id; the session never mints its own.
    expect(session.getPartnerRequestId()).toBe("sdk-generated-request-id");
    expect(session.getBridgeId()).toBe("b1");
  });

  it("selects `single_turn_v1` explicitly for every action except the external-work start turn", async () => {
    const seen: ICreateSessionInput[] = [];
    const build = (domain: string, sharedActionId: string) => {
      const double = createClientDouble({
        createSession: async (createInput) => {
          seen.push({ ...createInput });
          return createdSessionFor(ESessionPhase.waiting_for_wallet);
        },
      });
      const session = new MobileBridgeSession({
        ...sessionInputFor(double.client),
        prepared: { ...PREPARED, kind: { domain, sharedActionId } as never },
      });
      return session;
    };
    await build("meteor_wallet_core", "transfer_accounts").startPreparation();
    await build("meteor_wallet_core", "new_key_account_transfer_start").startPreparation();
    await build("meteor_wallet_core", "new_key_account_transfer_verify_active").startPreparation();
    // NEAR policy permits both single_turn_v1 and interactive_v1 — the SDK's one-request-per-
    // session model always selects single_turn_v1, so creation never hits the ambiguity guard.
    await build("near", "sign_in").startPreparation();
    expect(seen.map((input) => input.resourceProfile)).toEqual([
      ESessionResourceProfile.single_turn_v1,
      undefined,
      ESessionResourceProfile.single_turn_v1,
      ESessionResourceProfile.single_turn_v1,
    ]);
    // Never hand-computed: the policy owns the authorization mode and capability set.
    for (const input of seen) {
      expect(input.authorizationMode).toBeUndefined();
      expect(input.requiredWalletCapabilities).toBeUndefined();
      expect(input.onContextConflict).toBe("discard-unbound");
    }
  });

  it("builds the presented link through buildWalletLinkUrl, secret in the fragment", async () => {
    const double = createClientDouble();
    const session = createSession({ client: double.client });
    await session.startPreparation();
    const deepLink = session.getSnapshot().deepLink ?? "";
    expect(deepLink.startsWith(`${WEB_LINK_STRING}#partnerSecret=`)).toBe(true);
    // Percent-encoded, so a secret containing "/" or "+" survives the round trip.
    expect(deepLink).not.toContain("secret value/with+chars");
    expect(session.getSelectedWalletLink()?.linkString).toBe(WEB_LINK_STRING);
  });

  it("rebases a web link onto the local dev origin before the secret fragment is appended", async () => {
    const double = createClientDouble();
    const session = createSession({
      client: double.client,
      localDevLinkRewrite: {
        baseUrl: "https://localhost:3001",
        mcBackendHintUrl: "https://mc.meteorwallet.app",
      },
    });
    await session.startPreparation();
    const deepLink = session.getSnapshot().deepLink ?? "";
    const url = new URL(deepLink.slice(0, deepLink.indexOf("#")));
    expect(url.origin).toBe("https://localhost:3001");
    expect(url.searchParams.get("bridgeLease")).toBe("lease1");
    // 0.13: the backend hint moved out of the query and into the fragment, where the wallet must
    // resolve it against its own allowlist rather than trusting the link.
    expect(url.searchParams.get("mcBackend")).toBeNull();
    // The option is `backendUrlHint`; on the wire it is the fragment key `backendUrl`.
    expect(new URLSearchParams(deepLink.slice(deepLink.indexOf("#") + 1)).get("backendUrl")).toBe(
      "https://mc.meteorwallet.app",
    );
    // The opener allowlist follows the rewritten link, not the backend-issued one.
    expect(session.getSelectedWalletLink()?.linkString).toBe(url.toString());
  });

  it("fails closed when no configured app id has a backend-issued link", async () => {
    const double = createClientDouble({
      createSession: async () => {
        const created = createdSessionFor(ESessionPhase.waiting_for_wallet);
        return { ...created, walletLinks: [] };
      },
    });
    const session = createSession({ client: double.client });
    await expect(session.startPreparation()).rejects.toThrow("mobile_bridge_app_link_missing");
  });
});

describe("MobileBridgeSession push wake classification", () => {
  it("treats a web wallet's missing push token as expected and keeps the link presented", async () => {
    // A web wallet has no push registration at all, so `no_token` is the NORMAL path — the QR /
    // link is the delivery channel, not a fallback. Nothing here may branch on `delivered` alone.
    const double = createClientDouble({
      notifyWalletForInitialClaim: async () => ({
        delivered: false,
        reason: ESessionNotifyWalletReason.no_token,
      }),
    });
    const session = createSession({ client: double.client, pushWallet: PAIRED_WALLET });
    expect(session.getSnapshot().push).toBe("sending");
    await session.startPreparation();
    const snapshot = session.getSnapshot();
    expect(snapshot.push).toBe("not_delivered");
    expect(snapshot.pushReason).toBe(ESessionNotifyWalletReason.no_token);
    expect(snapshot.pushOutcome).toMatchObject({
      delivered: false,
      expected: true,
      category: "informational",
    });
    expect(snapshot.deepLink).toBeDefined();
  });

  it("marks a failed send as an unexpected warning, not a silent non-delivery", async () => {
    const double = createClientDouble({
      notifyWalletForInitialClaim: async () => ({
        delivered: false,
        reason: ESessionNotifyWalletReason.send_failed,
      }),
    });
    const session = createSession({ client: double.client, pushWallet: PAIRED_WALLET });
    await session.startPreparation();
    expect(session.getSnapshot().pushOutcome).toMatchObject({
      expected: false,
      category: "warning",
    });
  });

  it("classifies a wake request that threw rather than swallowing it", async () => {
    const double = createClientDouble({
      notifyWalletForInitialClaim: async () => {
        throw new Error("network down");
      },
    });
    const session = createSession({ client: double.client, pushWallet: PAIRED_WALLET });
    await session.startPreparation();
    const snapshot = session.getSnapshot();
    expect(snapshot.push).toBe("not_delivered");
    expect(snapshot.pushOutcome).toMatchObject({ expected: false, category: "warning" });
    // The QR stays presented — a failed wake never removes the user-mediated path.
    expect(snapshot.deepLink).toBeDefined();
  });
});

describe("MobileBridgeSession failure surfacing", () => {
  it("publishes the typed ids beside classified copy, never a matched message", async () => {
    const refusal = merr_bridge_session.fromId(EErr_Bridge_Session.wallet_update_required, {
      requiredWalletProtocolVersion: 2,
      requiredWalletCapabilities: [],
    });
    const double = createClientDouble({
      createSession: async () => {
        throw refusal;
      },
    });
    const session = createSession({ client: double.client });
    const result = rejectionOf(session);
    await expect(session.startPreparation()).rejects.toThrow();
    // Classification happens exactly once, here: the panel renders headline/detail, decides the
    // "update your wallet" remedy off this exact id, and keeps the raw message as fine print.
    const snapshot = session.getSnapshot();
    expect(snapshot).toMatchObject({
      phase: "failed",
      errorIds: [EErr_Bridge_Session.wallet_update_required],
    });
    expect(snapshot.errorHeadline).toBeTruthy();
    expect(snapshot.errorDetail).toBeTruthy();
    // Fine print is the classifier's untouched message, not a re-worded one.
    expect(snapshot.error).toBe(describeSessionError(refusal).originalMessage);
    // The ORIGINAL typed error is what the outcome mapper receives — never a flattened string.
    expect(await result).toBe(refusal);
  });

  it("surfaces any other failure with its untouched original message", async () => {
    const double = createClientDouble({
      createSession: async () => {
        throw new Error("something specific went wrong");
      },
    });
    const session = createSession({ client: double.client });
    void rejectionOf(session);
    await expect(session.startPreparation()).rejects.toThrow("something specific went wrong");
    expect(session.getSnapshot().error).toBe("something specific went wrong");
  });
});

/**
 * DX2: `waitForValidatedResult` never acknowledges anything itself, and a session left parked in
 * `result_ready` blocks the wallet. Every arm below — success, decline, mismatch, and a
 * business-level mapping failure — must therefore end in one explicit verb.
 */
describe("MobileBridgeSession explicit close verbs", () => {
  const RECEIPT: ISessionResultReceipt = {
    bridgeId: "b1",
    sequence: 1,
    turnId: "turn-id-0123456789ab",
    requestHash: "request-hash",
    resultHash: "result-hash",
  };

  const runWith = async (
    outcome: TValidatedSessionResult<unknown>,
    prepared: IMobileBridgePreparedAction = PREPARED,
  ) => {
    const acknowledged: ISessionResultReceipt[] = [];
    const double = createClientDouble({
      waitForValidatedResult: async () => outcome,
      acknowledgeAndClose: async (receipt) => {
        acknowledged.push(receipt);
        return sessionFactsFor(ESessionPhase.closed);
      },
    });
    const session = new MobileBridgeSession({
      ...sessionInputFor(double.client),
      prepared,
    });
    const settled = session.awaitResult().then(
      (value) => ({ value }),
      (error: Error) => ({ error }),
    );
    await session.startPreparation();
    return { acknowledged, settled: await settled, session };
  };

  it("acknowledges and closes on the ok arm, resolving the mapped output", async () => {
    const run = await runWith({ status: "ok", output: { success: true }, receipt: RECEIPT });
    expect(run.acknowledged).toEqual([RECEIPT]);
    expect(run.settled).toEqual({ value: { success: true } });
    expect(run.session.getSnapshot().phase).toBe("completed");
    expect(run.session.getResultReceipt()).toEqual(RECEIPT);
  });

  it("acknowledges a declined result as received, never as accepted", async () => {
    const run = await runWith({
      status: "declined",
      errorIds: ["import_failed"],
      errorMessage: "could not import",
      receipt: RECEIPT,
    });
    expect(run.acknowledged).toEqual([RECEIPT]);
    expect("error" in run.settled && run.settled.error.message).toContain(
      "mobile_bridge_wallet_declined: import_failed",
    );
    expect(run.session.getSnapshot().phase).toBe("failed");
  });

  it("acknowledges a mismatched result receipt-only rather than parking result_ready", async () => {
    const run = await runWith({ status: "mismatch", receipt: RECEIPT, detail: "wrong action" });
    expect(run.acknowledged).toEqual([RECEIPT]);
    expect("error" in run.settled && run.settled.error.message).toBe(
      "mobile_bridge_action_result_mismatch",
    );
  });

  it("still sends the verb when the SDK-level output mapping itself throws", async () => {
    // A schema-valid output can still fail the SDK's business-level binding (here: a new-key
    // start output that does not answer the requested account set). The wallet has nonetheless
    // answered, so the verb goes first and the local failure is ours alone to raise.
    const run = await runWith(
      { status: "ok", output: { formatVersion: 1, accounts: [] }, receipt: RECEIPT },
      {
        ...PREPARED,
        kind: {
          domain: "meteor_wallet_core",
          sharedActionId: "new_key_account_transfer_start",
        },
      },
    );
    expect(run.acknowledged).toEqual([RECEIPT]);
    expect("error" in run.settled).toBe(true);
    expect(run.session.getSnapshot().phase).toBe("failed");
  });

  it("does not read the terminal facts of its OWN close verb as a counterparty cancel", async () => {
    // The seam `createSessionClientDoubleBase` models: `acknowledgeAndClose` records the
    // closed facts synchronously, so `factsChanged` + `terminal` reach this session INSIDE the
    // still-pending await — before the turn has been marked settled. Read as a counterparty
    // close, that rejects a fully successful transfer as `mobile_bridge_cancelled`.
    const observed: string[] = [];
    const double = createClientDouble({
      waitForValidatedResult: async () => ({
        status: "ok",
        output: { success: true },
        receipt: RECEIPT,
      }),
    });
    double.client.events.on("factsChanged", ({ facts }) => observed.push(`facts:${facts.phase}`));
    double.client.events.on("terminal", ({ outcome }) =>
      observed.push(`terminal:${outcome.statusId}`),
    );
    const session = new MobileBridgeSession(sessionInputFor(double.client));
    const settled = session.awaitResult().then(
      (value) => ({ value }),
      (error: Error) => ({ error }),
    );
    await session.startPreparation();

    expect(await settled).toEqual({ value: { success: true } });
    expect(observed).toContain(`facts:${ESessionPhase.closed}`);
    expect(observed).toContain(`terminal:${ESessionPhase.closed}`);
    expect(session.getSnapshot().phase).toBe("completed");
  });

  it("still fails the turn when a real failure lands while its own close verb is in flight", async () => {
    // The flag above suppresses exactly one reading — "the `closed` we asked for is a cancel".
    // A bridge that fails underneath the acknowledgement is a genuine ending and must still be
    // raised as one, with its own reason rather than a cancellation.
    const double = createClientDouble({
      waitForValidatedResult: async () => ({
        status: "ok",
        output: { success: true },
        receipt: RECEIPT,
      }),
    });
    const session = new MobileBridgeSession(sessionInputFor(double.client));
    const settled = session.awaitResult().then(
      () => undefined,
      (error: Error) => error,
    );
    double.client.events.on("factsChanged", ({ facts, source }) => {
      // The realm-sourced failure arrives while the acknowledgement is still awaiting.
      if (source !== "action" || facts.phase !== ESessionPhase.closed) return;
      double.emit("terminal", { outcome: { reason: "bridge_gone", selfInitiated: false } });
    });
    await session.startPreparation();

    expect((await settled)?.message).toBe("mobile_bridge_expired");
  });
});

describe("MobileBridgeSession phase-safe close", () => {
  it("settles its own phase-safe close as one cancellation", async () => {
    // `cancel()` sends the ONE verb the §5.7 matrix permits, and the client accepts the closed
    // facts inside that verb's own still-pending await — so this session hears about its own
    // close before `closePhaseSafe` resolves, and again from the local `markCancelled()` after.
    // It must settle exactly once, as a cancellation.
    const closes: Array<ISessionResultReceipt | undefined> = [];
    const double = createClientDouble({
      closePhaseSafe: async (receipt) => {
        closes.push(receipt);
        return sessionFactsFor(ESessionPhase.closed);
      },
    });
    const session = createSession({ client: double.client });
    const result = rejectionOf(session);
    await session.startPreparation();

    expect(await session.cancel()).toBe("cancelled_before_commit");

    // The verb is chosen from the live facts the client is holding, never by hand: nothing is
    // claimable in `waiting_for_wallet`, so it is a plain `close_session` and needs no receipt.
    expect(closes).toEqual([undefined]);
    expect(session.getSnapshot()).toMatchObject({
      phase: "cancelled",
      terminalReason: "terminal_status",
    });
    expect((await result)?.message).toBe("mobile_bridge_cancelled");
  });

  it("refuses to cancel a committed turn, so no verb discards the wallet's work", async () => {
    // `result_ready`'s permitted operation is the DESTRUCTIVE `abandon_result_and_close`. Cancel
    // must not reach for it: the request the wallet already answered stays alive for another
    // execution target to adopt.
    const closes: Array<ISessionResultReceipt | undefined> = [];
    const double = createClientDouble({
      closePhaseSafe: async (receipt) => {
        closes.push(receipt);
        return sessionFactsFor(ESessionPhase.closed);
      },
    });
    const session = createSession({ client: double.client });
    await session.startPreparation();
    double.emit("factsChanged", {
      facts: sessionFactsFor(ESessionPhase.result_ready),
      source: "realm",
    });

    expect(await session.cancel()).toBe("target_already_committed");

    expect(closes).toEqual([]);
    expect(session.getSnapshot().phase).toBe("result_ready");
  });
});

describe("MobileBridgeSession claimed-wallet resolution", () => {
  const RECEIPT: ISessionResultReceipt = {
    bridgeId: "b1",
    sequence: 1,
    turnId: "turn-id-0123456789ab",
    requestHash: "request-hash",
    resultHash: "result-hash",
  };
  const START_PREPARED: IMobileBridgePreparedAction = {
    ...PREPARED,
    kind: { domain: "meteor_wallet_core", sharedActionId: "new_key_account_transfer_start" },
  };

  it("names the wallet whose paired record this session's claim refreshed", async () => {
    const double = createClientDouble({
      waitForValidatedResult: async () => ({
        status: "ok",
        output: { formatVersion: 1, accounts: [] },
        receipt: RECEIPT,
      }),
    });
    const session = new MobileBridgeSession({
      ...sessionInputFor(double.client),
      prepared: START_PREPARED,
    });
    const settled = session.awaitResult().then(
      () => undefined,
      (error: Error) => error,
    );
    await session.startPreparation();
    await settled;
    // The mapping still rejects this deliberately empty output — what matters here is that the
    // wallet identity was resolved and pinned before that happened.
    expect(session.getCompletedConnection()).toMatchObject({
      walletVerifyPublicKey: PAIRED_WALLET.walletVerifyPublicKey,
      meteorAppId: EMeteorAppId.meteor_wallet_web_dev,
    });
  });

  it("fails closed when the client names no claimant for the session", async () => {
    // No claim is bound, so the claimant cannot be named. Guessing would bind a later
    // `..._verify_active` turn to the wrong wallet, so it must throw instead. (Pre-0.13 this was
    // detected by diffing the paired ledger against a pre-session baseline; the client now answers
    // it directly, but the fail-closed rule is unchanged.)
    const double = createClientDouble({
      pairedWallets: [],
      waitForValidatedResult: async () => ({
        status: "ok",
        output: { formatVersion: 1, accounts: [] },
        receipt: RECEIPT,
      }),
    });
    const session = new MobileBridgeSession({
      ...sessionInputFor(double.client),
      prepared: START_PREPARED,
    });
    const settled = session.awaitResult().then(
      () => undefined,
      (error: Error) => error,
    );
    await session.startPreparation();
    expect((await settled)?.message).toBe("mobile_bridge_active_wallet_unavailable");
    expect(session.getCompletedConnection()).toBeUndefined();
  });
});
