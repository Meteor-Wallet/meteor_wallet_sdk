import {
  METEOR_CONNECT_BACKENDS,
  PartnerSessionClient,
  PartnerSessionResumeError,
  SessionLocalGuardError,
  type TMeteorConnectBackendEnvironment,
  type TPartnerPairedWallet,
} from "@meteorwallet/connect";
import {
  EBridgeLinkType,
  EMeteorAppId,
  hasRequiredWalletCapabilities,
  METEOR_WALLET_PROTOCOL_VERSION,
} from "@meteorwallet/connect-shared";
import { SIGN_POPUP_HEIGHT, SIGN_POPUP_WIDTH } from "../../../ported_common/constants_theme";
import type { ILocalStorageInterface } from "../../../ported_common/utils/storage/storage.types";
import type { TMCActionOutput, TMCActionRegistry } from "../../action/mc_action.combined";
import type { TMCActionRequestUnionExpandedInput } from "../../action/mc_action.types";
import { isMobile } from "../../action_ui/utils/isMobile";
import { MeteorLogger } from "../../logging/MeteorLogger";
import type {
  IMeteorConnectAccount,
  IMeteorConnectAccountIdentifier_Near,
  IMeteorConnectBridgeLeaseProvider,
  IMeteorConnection_V2_BridgeMobile,
  IMeteorConnectMobileBridgeConfig,
  IMeteorConnectRecoveredActionResult,
  IMeteorConnectRecoveringRequest,
  TMeteorConnectionExecutionTarget,
  TMeteorConnectRecoveredActionResultListener,
  TMeteorConnectRecoveredOutcome,
  TMeteorExecutionTargetConfig,
} from "../../MeteorConnect.types";
import {
  isExtensionNewKeyTransferAvailable,
  openExtensionNewKeyTransfer,
} from "../../utils/extensionNewKeyTransfer";
import { MeteorConnectClientBase } from "../base/MeteorConnectClientBase";
import type {
  IMobileBridgePreparedAction,
  IMobileBridgeRequestTarget,
  IMobileBridgeSensitiveTransferSource,
  TTransferTargetPlatform,
} from "./MeteorConnectMobileBridgeClient.types";
import { MOBILE_BRIDGE_ENDING, MobileBridgeSession } from "./MobileBridgeSession";
import {
  AUTO_OPEN_CONFIRMATION_MS,
  canOpenAppWithoutNewTap,
  isSameDeviceAutoOpenEligible,
  waitForPageToHide,
} from "./mobileAppAutoOpen";
import {
  directBrowserNativeAppOpener,
  StorageBakeryBridgeLeaseProvider,
  WebLockBridgeLeaseProvider,
} from "./mobileBridgeLease";
import {
  createBridgeEnvironmentId,
  createMobileBridgeStorage,
  createPendingRequestStore,
  type IMobileBridgePendingRequestRecord,
  type IMobileBridgePendingRequestStore,
  type IMobileBridgeStorageContext,
  normalizeBridgeBackendUrl,
  normalizePartnerMetadata,
} from "./mobileBridgeStorage";
import {
  createPendingRequestHandle,
  getActionRequiredWalletCapabilities,
  pendingActionMessageParams,
  pendingRequestToPreparedAction,
  sdkActionToMobileBridge,
} from "./sdkActionToMobileBridge";

const activeClientsByStorage = new WeakMap<object, Map<string, MeteorConnectMobileBridgeClient>>();

/** Wall-clock deadline for each HTTP carrier request — a hung fetch must never park a prompt. */
const BRIDGE_HTTP_REQUEST_TIMEOUT_MS = 15_000;
/**
 * Client-side bounded-retry policy: after this many consecutive redials in one outage the SDK
 * releases the link itself (`linkStatus` → "offline") instead of dialing until the library floor.
 * `connectBridgeLink()` revives it.
 */
const BRIDGE_MAX_REDIAL_ATTEMPTS = 8;

/**
 * The only custom schemes an `app_deep_link` wallet link may open. The link itself is
 * backend-issued and matched exactly before this check; the set is the second gate that stops any
 * other scheme (`javascript:`, `data:`, …) from reaching the native opener.
 */
const ALLOWED_NATIVE_APP_SCHEMES: ReadonlySet<string> = new Set([
  "meteorwallet:",
  "meteorwalletdev:",
]);

/**
 * The mobile wallet build that claims from each deployed environment's backend, for the dev-only
 * mobile wallet switch. Backend and app id always move together: the wallet app derives both from
 * ONE environment (meteor-v2-apps `meteorConnectBridgeClient.ts`), so a session created on one
 * backend but linked to the other build's scheme can never be claimed.
 */
const DEV_SWITCH_MOBILE_APP_IDS = {
  production: EMeteorAppId.meteor_wallet_mobile,
  development: EMeteorAppId.meteor_wallet_mobile_dev,
} as const satisfies Record<TMeteorConnectBackendEnvironment, EMeteorAppId>;

/**
 * How long a new request lets a request recovered after a reload keep its claim on the one session
 * client before replacing it. Long enough for the reloaded page's bridge link to come up and show
 * where the wallet is; a request the wallet already holds is always waited for, never replaced.
 */
export const RECOVERY_SUPERSEDE_GRACE_MS = 10_000;

type TMobileBridgeSessionInput = ConstructorParameters<typeof MobileBridgeSession>[0];

/** The parts of a session's input that differ per request; everything else is this client's. */
type TRequestSessionInput = Pick<
  TMobileBridgeSessionInput,
  | "prepared"
  | "targetMeteorAppIds"
  | "localDevLinkRewrite"
  | "pushWallet"
  | "pinnedWallet"
  | "expectedWalletVerifyPublicKey"
  | "journalBeforeExternalWorkHold"
  | "autoOpen"
  | "pendingRequest"
>;

/** Resolve after `ms`, clearing the timer when `settled` wins first. */
const settledWithin = async (settled: Promise<unknown>, ms: number): Promise<boolean> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      settled.then(() => true),
      new Promise<boolean>((resolve) => {
        timer = setTimeout(() => resolve(false), ms);
      }),
    ]);
  } finally {
    if (timer != null) clearTimeout(timer);
  }
};

/**
 * The outcome a recovered request ended in. The flow endings are the session's own shared
 * constants (`MOBILE_BRIDGE_ENDING`) and a refused resume is typed, so nothing here reads prose.
 */
export function recoveredOutcomeOf(error: unknown): TMeteorConnectRecoveredOutcome {
  if (error instanceof PartnerSessionResumeError) {
    return error.reason === "expired" ? "expired" : "failed";
  }
  const message = error instanceof Error ? error.message : "";
  if (message.startsWith(MOBILE_BRIDGE_ENDING.walletDeclined)) return "declined";
  if (message === MOBILE_BRIDGE_ENDING.expired) return "expired";
  if (message === MOBILE_BRIDGE_ENDING.cancelled || message === MOBILE_BRIDGE_ENDING.disposed) {
    return "cancelled";
  }
  return "failed";
}

/** The targeted account a recorded account action names, read back without trusting its shape. */
function recordedAccountIdentifier(
  record: IMobileBridgePendingRequestRecord,
): IMeteorConnectAccountIdentifier_Near | undefined {
  const account = record.action.expandedInput.account;
  if (typeof account !== "object" || account == null || !("identifier" in account))
    return undefined;
  const identifier = account.identifier;
  if (typeof identifier !== "object" || identifier == null) return undefined;
  if (!("accountId" in identifier) || !("network" in identifier)) return undefined;
  const { accountId, network } = identifier;
  if (typeof accountId !== "string" || (network !== "mainnet" && network !== "testnet")) {
    return undefined;
  }
  return { blockchain: "near", network, accountId };
}

interface IMobileBridgeTarget {
  backendUrl: string;
  meteorAppId: EMeteorAppId.meteor_wallet_mobile | EMeteorAppId.meteor_wallet_mobile_dev;
}

/**
 * The same centered wallet-popup geometry the V1 web actions use (MeteorPostMessenger), so the
 * Meteor Web wallet opened over the bridge looks identical to one opened for a regular action.
 * Centering reads `window.top`, which a cross-origin frame cannot — there the browser places the
 * popup itself; the geometry is cosmetic, never load-bearing.
 * `noopener` is NOT part of the returned features — with it, `window.open` returns null, which
 * the placeholder-window flow (`openPendingWalletWindow`) cannot live with. Direct opens append
 * it themselves; the placeholder flow severs `opener` on the handle instead.
 */
const centeredWalletPopupFeatures = (): string => {
  const w = SIGN_POPUP_WIDTH;
  const h = SIGN_POPUP_HEIGHT;
  let features = `popup=1,width=${w},height=${h}`;
  try {
    const host = window.top ?? window;
    const y = host.outerHeight / 2 + host.screenY - h / 2;
    const x = host.outerWidth / 2 + host.screenX - w / 2;
    if (Number.isFinite(y) && Number.isFinite(x)) features += `,top=${y},left=${x}`;
  } catch {
    // Cross-origin ancestor: no centering, sized popup only.
  }
  return features;
};

export class MeteorConnectMobileBridgeClient extends MeteorConnectClientBase {
  readonly clientName = "Meteor Connect Mobile Bridge Client";
  readonly executionTargets: TMeteorConnectionExecutionTarget[] = ["v2_bridge_mobile"];
  protected readonly logger = MeteorLogger.createLogger("MeteorConnect:MobileBridgeClient");
  private config?: Required<
    Pick<IMeteorConnectMobileBridgeConfig, "enabled" | "backendUrl" | "meteorAppId">
  > &
    IMeteorConnectMobileBridgeConfig;
  /**
   * The backend + mobile wallet this bridge actually runs against, resolved on initialization: the
   * host's config, or the dev switch's pair (`setDevMobileWalletEnvironment`).
   */
  private bridgeTarget?: IMobileBridgeTarget;
  private storage?: IMobileBridgeStorageContext;
  private sessionClient?: PartnerSessionClient;
  private initializePromise?: Promise<void>;
  private currentSession?: MobileBridgeSession;
  private currentToken?: string;
  private currentTransferTargetPlatform?: TTransferTargetPlatform;
  private sessionDisposalPromise?: Promise<void>;
  private coordinatorKey?: string;
  private leaseProvider?: IMeteorConnectBridgeLeaseProvider;
  private fencingGeneration?: number;
  private storageImplementation?: ILocalStorageInterface;
  private storageIdentity?: object;
  // Reload recovery (`recoverPendingRequest`), which runs at most once per client; the session it
  // is collecting from while it is; and the recovered results, with those no listener has seen
  // yet (handed to the first one that subscribes).
  private recoveryPromise?: Promise<void>;
  private recoverySession?: MobileBridgeSession;
  // What `getRecoveringRequest` describes while `recoverySession` is set, and the moment it can:
  // once that session has been re-entered (its wallet link published), or recovery has ended.
  private recoveringRequest?: { requestId: string; actionId: string; expiresAt: number };
  private recoveryEntered?: Promise<void>;
  private markRecoveryEntered?: () => void;
  // The one cancel of the recovered request (`IMeteorConnectRecoveringRequest.cancel`).
  private recoveryCancel?: Promise<void>;
  private readonly recoveredResults: IMeteorConnectRecoveredActionResult[] = [];
  private undeliveredRecoveredResults: IMeteorConnectRecoveredActionResult[] = [];
  private readonly recoveredResultListeners =
    new Set<TMeteorConnectRecoveredActionResultListener>();

  configure(
    config: IMeteorConnectMobileBridgeConfig | undefined,
    storage: ILocalStorageInterface,
  ): void {
    const enabled = config?.enabled ?? false;
    const storageGetKeys = storage.getKeys;
    this.storageIdentity = storage;
    this.storageImplementation = {
      getItem: (key) => storage.getItem(key),
      setItem: (key, value) => storage.setItem(key, value),
      removeItem: (key) => storage.removeItem(key),
      ...(storageGetKeys == null
        ? {}
        : {
            getKeys: (prefix?: string) => storageGetKeys.call(storage, prefix),
          }),
    };
    this.config = {
      ...config,
      enabled,
      backendUrl: config?.backendUrl ?? "https://mc.meteorwallet.app",
      meteorAppId:
        config?.meteorAppId ??
        (this.meteorConnect.isDevelopment
          ? EMeteorAppId.meteor_wallet_mobile_dev
          : EMeteorAppId.meteor_wallet_mobile),
    };
  }

  private async initializeBridgeClient(): Promise<void> {
    if (!this.config?.enabled) throw new Error("mobile_bridge_disabled");
    if (this.initializePromise != null) return this.initializePromise;
    this.initializePromise = (async () => {
      const storageImplementation = this.storageImplementation;
      const storageIdentity = this.storageIdentity;
      if (storageImplementation == null || storageIdentity == null) {
        throw new Error("mobile_bridge_storage_not_configured");
      }
      this.bridgeTarget = await this.resolveBridgeTarget();
      this.storage = createMobileBridgeStorage(storageImplementation, this.bridgeTarget.backendUrl);
      const activeClients = activeClientsByStorage.get(storageIdentity) ?? new Map();
      activeClientsByStorage.set(storageIdentity, activeClients);
      this.coordinatorKey = `${this.storage.environmentId}:${this.storage.backendUrl}`;
      const existingClient = activeClients.get(this.coordinatorKey);
      if (existingClient != null && existingClient !== this) {
        throw new Error("mobile_bridge_client_already_initialized_for_realm");
      }
      activeClients.set(this.coordinatorKey, this);
      const leaseProvider =
        this.config!.leaseProvider ??
        (typeof navigator !== "undefined" && navigator.locks != null
          ? new WebLockBridgeLeaseProvider()
          : this.createStorageLeaseProvider(storageImplementation));
      if (leaseProvider == null) throw new Error("mobile_bridge_coordination_unsupported");
      this.leaseProvider = leaseProvider;
      const maintenanceGate = await leaseProvider.acquire(
        `${this.storage.environmentId}:maintenance-gate`,
      );
      try {
        await maintenanceGate.assertOwned();
        const identityLease = await leaseProvider.acquire(
          `${this.storage.environmentId}:identity-provision`,
        );
        try {
          await identityLease.assertOwned();
          this.fencingGeneration = await this.storage.getFencingGeneration();
          // One plain client per environment — no subclass (0.12 has none): observation is
          // `client.events`, and the bounded-redial ladder the SDK used to hand-roll is
          // `maxRedialAttempts` + `client.linkStatus`. `backendStorageScope` stays unset: the
          // default `deriveBackendStorageScope(backendUrl)` already isolates identity per
          // backend, and the adapter's own `met_bridge_partner::<env>::` prefix nests under it.
          this.sessionClient = new PartnerSessionClient({
            backendUrl: this.storage.backendUrl,
            httpRequestTimeoutMs: BRIDGE_HTTP_REQUEST_TIMEOUT_MS,
            maxRedialAttempts: BRIDGE_MAX_REDIAL_ATTEMPTS,
            partnerMetadata: normalizePartnerMetadata(this.config!.partnerMetadata),
            storageAdapter: this.storage.storageAdapter,
            // Both durable-mutation locks route through the SDK's own lease provider: the Web
            // Locks default the client would otherwise pick is unavailable on the AsyncStorage-like
            // and opaque-origin hosts this client also runs on.
            withPairedWalletMutationLock: (operation) =>
              this.withBridgeLease(`${this.storage!.environmentId}:paired-wallets`, operation),
            withSessionMutationLock: (operation) =>
              this.withBridgeLease(`${this.storage!.environmentId}:session-context`, operation),
          });
          // `initializeClient()` registers the action runtime itself; the separate deprecated
          // `apply()` call this used to make was a no-op keeping a retired lifecycle alive in the
          // SDK's first consumer (REVIEW-consumer-implementation M-05).
          await this.sessionClient.initializeClient();
        } finally {
          await identityLease.release();
        }
      } finally {
        await maintenanceGate.release();
      }
    })().catch((error) => {
      this.releaseCoordinatorOwnership();
      this.sessionClient = undefined;
      this.initializePromise = undefined;
      throw error;
    });
    return this.initializePromise;
  }

  /** The mobile wallet this bridge links to — the dev switch's choice once initialized. */
  private get targetMeteorAppId(): IMobileBridgeTarget["meteorAppId"] {
    return this.bridgeTarget?.meteorAppId ?? this.config!.meteorAppId;
  }

  private async resolveBridgeTarget(): Promise<IMobileBridgeTarget> {
    const environment = await this.getDevMobileWalletEnvironmentOverride();
    if (environment == null) {
      return { backendUrl: this.config!.backendUrl, meteorAppId: this.config!.meteorAppId };
    }
    return {
      backendUrl: METEOR_CONNECT_BACKENDS[environment],
      meteorAppId: DEV_SWITCH_MOBILE_APP_IDS[environment],
    };
  }

  /**
   * The development gate shared with the V1 client's "Dev Web (Localhost)" target: a development
   * build, or the persisted force-dev flag.
   */
  private async isDevGateOpen(): Promise<boolean> {
    const forceDev = (await this.meteorConnect.storage.getJsonOrDef("dev_000_met", 0)) === 1;
    return forceDev || process.env.NODE_ENV === "development";
  }

  /**
   * The deployed environment whose backend the host configured, if any. The dev switch is only
   * offered on a deployed backend, so it can never silently replace a local or custom one (e.g. the
   * demo's `?backend=local`).
   */
  private configuredDeployedEnvironment(): TMeteorConnectBackendEnvironment | undefined {
    if (this.config == null) return undefined;
    const configured = normalizeBridgeBackendUrl(this.config.backendUrl);
    return (Object.keys(METEOR_CONNECT_BACKENDS) as TMeteorConnectBackendEnvironment[]).find(
      (environment) =>
        normalizeBridgeBackendUrl(METEOR_CONNECT_BACKENDS[environment]) === configured,
    );
  }

  private async isDevMobileWalletSwitchAvailable(): Promise<boolean> {
    return (
      this.config?.enabled === true &&
      this.configuredDeployedEnvironment() != null &&
      (await this.isDevGateOpen())
    );
  }

  private async getDevMobileWalletEnvironmentOverride(): Promise<
    TMeteorConnectBackendEnvironment | undefined
  > {
    if (!(await this.isDevMobileWalletSwitchAvailable())) return undefined;
    const stored = await this.meteorConnect.storage.getJson("devMobileWalletEnvironment");
    return stored === "production" || stored === "development" ? stored : undefined;
  }

  /**
   * Dev-only mobile wallet switch, offered beside the Connect popup's mobile QR like the V1
   * "Dev Web (Localhost)" target: which environment's mobile wallet build the bridge links to.
   * `undefined` when the switch is not offered — outside the dev gate, with the bridge disabled,
   * or on a local/custom backend.
   */
  async getDevMobileWalletEnvironment(): Promise<TMeteorConnectBackendEnvironment | undefined> {
    if (!(await this.isDevMobileWalletSwitchAvailable())) return undefined;
    const target = this.bridgeTarget ?? (await this.resolveBridgeTarget());
    return target.meteorAppId === EMeteorAppId.meteor_wallet_mobile ? "production" : "development";
  }

  /**
   * Persist the dev switch's environment and tear down the current, uncommitted bridge: the
   * session client, its storage scope and its coordinator slot all belong to one backend. The next
   * `prepareRequest` re-initializes against the chosen backend + mobile wallet pair.
   */
  async setDevMobileWalletEnvironment(
    environment: TMeteorConnectBackendEnvironment,
  ): Promise<void> {
    if (!(await this.isDevMobileWalletSwitchAvailable())) {
      throw new Error("mobile_bridge_dev_switch_unavailable");
    }
    if (this.currentSession?.isCommitted()) throw new Error("mobile_bridge_switch_after_commit");
    await this.meteorConnect.storage.setJson("devMobileWalletEnvironment", environment);
    await this.teardownBridge();
  }

  /**
   * Serialize one durable mutation behind a named lease, re-checking the identity fence inside it.
   * A stale generation must never write through a lease it acquired before the reset.
   */
  private async withBridgeLease<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const lease = await this.leaseProvider!.acquire(name);
    try {
      await lease.assertOwned();
      await this.assertCurrentGeneration();
      return await operation();
    } finally {
      await lease.release();
    }
  }

  private createStorageLeaseProvider(
    storage: ILocalStorageInterface,
  ): StorageBakeryBridgeLeaseProvider | undefined {
    const getKeys = storage.getKeys;
    if (getKeys == null) return undefined;
    return new StorageBakeryBridgeLeaseProvider({
      getItem: (key) => storage.getItem(key),
      setItem: (key, value) => storage.setItem(key, value),
      removeItem: (key) => storage.removeItem(key),
      getKeys: (prefix) => getKeys.call(storage, prefix),
    });
  }

  private async assertCurrentGeneration(): Promise<void> {
    if (this.storage == null || this.fencingGeneration == null) return;
    if ((await this.storage.getFencingGeneration()) !== this.fencingGeneration) {
      throw new Error("mobile_bridge_stale_identity_generation");
    }
  }

  private releaseCoordinatorOwnership(): void {
    const storageIdentity = this.storageIdentity;
    if (storageIdentity == null) return;
    const activeClients = activeClientsByStorage.get(storageIdentity);
    if (this.coordinatorKey != null && activeClients?.get(this.coordinatorKey) === this) {
      activeClients.delete(this.coordinatorKey);
      if (activeClients.size === 0) activeClientsByStorage.delete(storageIdentity);
    }
    this.coordinatorKey = undefined;
  }

  async getEnvironmentSupportedPlatforms(): Promise<TMeteorConnectionExecutionTarget[]> {
    if (
      !this.config?.enabled ||
      typeof window === "undefined" ||
      globalThis.crypto?.subtle == null
    ) {
      return [];
    }
    return ["v2_bridge_mobile"];
  }

  async getExecutionTargetConfigs<R extends TMCActionRequestUnionExpandedInput<TMCActionRegistry>>(
    request: R,
  ): Promise<TMeteorExecutionTargetConfig[]> {
    if (!this.config?.enabled) return [];
    const accountConnection = (request.expandedInput as any).account?.connection;
    if (accountConnection != null && accountConnection.executionTarget !== "v2_bridge_mobile") {
      return [];
    }
    if (accountConnection?.executionTarget === "v2_bridge_mobile") {
      return [accountConnection];
    }
    if (request.id === "near::sign_in" || request.id === "near::sign_in_and_sign_message") {
      return [this.connectionShell()];
    }
    if (
      request.id === "meteor_wallet_core::transfer_accounts" ||
      request.id === "meteor_wallet_core::new_key_account_transfer_start" ||
      request.id === "meteor_wallet_core::new_key_account_transfer_verify_active"
    ) {
      // Account-less action targeting the web wallet(s) — dark by default (§ rollout gating).
      if (this.config?.transferAccounts?.enabled !== true) return [];
      return [this.connectionShell()];
    }
    return [];
  }

  /**
   * Ordered app-id preference for a prepared action. NEAR actions keep the single configured
   * mobile wallet id (behavior unchanged). Transfer targets the platform the user chose on the
   * popup's platform screen: "mobile" → the configured mobile wallet id; "web" (default) → the
   * web wallet matching this config's environment (meteor-frontend identifies as
   * meteor_wallet_web / meteor_wallet_web_dev, env-selected). Integrations testing against the
   * mc_backend demo wallet override the web list via transferAccounts.meteorAppIds.
   */
  private targetMeteorAppIdsFor(
    prepared: IMobileBridgePreparedAction,
    transferTargetPlatform?: TTransferTargetPlatform,
    targetWalletConnection?: IMeteorConnection_V2_BridgeMobile,
  ): EMeteorAppId[] {
    if (prepared.kind.domain !== "meteor_wallet_core") return [this.targetMeteorAppId];
    if (targetWalletConnection != null) return [targetWalletConnection.meteorAppId];
    // The installed V1 extension uses the production web wallet identity.
    if (transferTargetPlatform === "extension") return [EMeteorAppId.meteor_wallet_web];
    if (transferTargetPlatform === "mobile") return [this.targetMeteorAppId];
    if (transferTargetPlatform === "web_local_dev") {
      // A locally served meteor-frontend always identifies as the dev web identity.
      return [EMeteorAppId.meteor_wallet_web_dev];
    }
    const configured = this.config?.transferAccounts?.meteorAppIds;
    if (configured != null && configured.length > 0) return [...configured];
    return this.targetMeteorAppId === EMeteorAppId.meteor_wallet_mobile_dev
      ? [EMeteorAppId.meteor_wallet_web_dev]
      : [EMeteorAppId.meteor_wallet_web];
  }

  /**
   * Whether the transfer popup offers "Meteor Web (Local Dev)" — same gate as the V1 client's
   * "Dev Web (Localhost)" target: a development build, or the persisted force-dev flag.
   */
  async isTransferLocalDevWebAvailable(): Promise<boolean> {
    return this.isDevGateOpen();
  }

  /** The origin a "web_local_dev" transfer link is rebased onto (shared with the V1 dev target). */
  private async localDevLinkBaseUrl(): Promise<string> {
    return this.meteorConnect.storage.getJsonOrDef(
      "webDevLocalhostBaseUrl",
      "https://localhost:3001",
    );
  }

  private connectionShell(): IMeteorConnection_V2_BridgeMobile {
    return {
      executionTarget: "v2_bridge_mobile",
      schemaVersion: 1,
      bridgeEnvironmentId: this.storage?.environmentId ?? "pending",
      meteorAppId: this.targetMeteorAppId,
      partnerClientId: this.partnerClientId() ?? "pending",
      walletVerifyPublicKey: "pending",
    };
  }

  private async selectPushWallet(
    request: TMCActionRequestUnionExpandedInput<TMCActionRegistry>,
    prepared: IMobileBridgePreparedAction,
    targetWalletConnection?: IMeteorConnection_V2_BridgeMobile,
  ) {
    const connection = targetWalletConnection ?? (request.expandedInput as any).account?.connection;
    if (connection?.executionTarget !== "v2_bridge_mobile") return undefined;
    if (
      connection.schemaVersion !== 1 ||
      connection.bridgeEnvironmentId !== this.storage!.environmentId ||
      connection.partnerClientId !== this.partnerClientId()
    ) {
      return undefined;
    }
    const paired = await this.sessionClient!.getPairedWallets();
    return paired.find(
      (wallet) =>
        wallet.walletVerifyPublicKey === connection.walletVerifyPublicKey &&
        wallet.meteorAppId === connection.meteorAppId &&
        hasRequiredWalletCapabilities(
          wallet.walletProtocolVersion,
          wallet.walletCapabilities,
          METEOR_WALLET_PROTOCOL_VERSION,
          getActionRequiredWalletCapabilities(prepared.actionRequest),
        ),
    );
  }

  async prepareRequest(
    request: TMCActionRequestUnionExpandedInput<TMCActionRegistry>,
    sensitiveTransferSource?: IMobileBridgeSensitiveTransferSource,
    target: IMobileBridgeRequestTarget = {},
  ): Promise<MobileBridgeSession> {
    const { transferTargetPlatform, walletConnection: targetWalletConnection } = target;
    if (transferTargetPlatform === "extension") {
      if (
        request.id !== "meteor_wallet_core::new_key_account_transfer_start" &&
        request.id !== "meteor_wallet_core::new_key_account_transfer_verify_active"
      ) {
        throw new Error("extension_transfer_action_unsupported");
      }
      if (!isExtensionNewKeyTransferAvailable()) throw new Error("extension_update_required");
    }
    await this.initializeBridgeClient();
    await this.sessionDisposalPromise?.catch((error) => {
      this.logger.err("Previous mobile bridge session disposal failed", error);
    });
    await this.settleRecoveryBeforeNewRequest();
    // That wait can be long; a request cancelled during it must not create a session or wake the
    // wallet only to be closed again.
    if (target.isCancelled?.() === true) throw new Error("Action was cancelled");
    const continued = await this.continueExternalWorkHold(request, target);
    if (continued != null) return continued;
    if (this.currentSession != null) {
      const existing = this.currentSession.getSnapshot();
      if (!["completed", "failed", "cancelled"].includes(existing.phase)) {
        throw new Error("mobile_bridge_session_already_active");
      }
      await this.currentSession.dispose();
    }
    const prepared = await sdkActionToMobileBridge(request, sensitiveTransferSource);
    const pushWallet = await this.selectPushWallet(request, prepared, targetWalletConnection);
    const autoOpen = (await this.isSameDeviceAutoOpenEligible(request, pushWallet, target))
      ? (session: MobileBridgeSession) => this.autoOpenSession(session)
      : undefined;
    // Stabilization SDK-3: a wallet-targeted request whose paired-wallet record is gone (identity
    // reset, ledger eviction, changed backend scope) is NOT a dead end. The session is created
    // without push or a backend pin — QR/link delivery, copy directing the user to the exact
    // wallet — while the claimed wallet is still locally checked against the stored verify key
    // and the wallet's own (partner, transferSessionId) binding stays the authoritative gate.
    const token = crypto.randomUUID();
    this.currentToken = token;
    const pendingRequestStore = this.pendingRequestStore();
    const targetMeteorAppIds = this.targetMeteorAppIdsFor(
      prepared,
      transferTargetPlatform,
      targetWalletConnection,
    );
    const session = this.createMobileBridgeSession(token, {
      prepared,
      targetMeteorAppIds,
      localDevLinkRewrite:
        // Deliberately keyed on the persisted platform alone (stabilization SDK-14 review): a
        // wallet-pinned verify turn under `web_local_dev` targets the SAME localhost wallet that
        // claimed the start, so its link must be rebased exactly like the start's was.
        transferTargetPlatform === "web_local_dev"
          ? {
              baseUrl: await this.localDevLinkBaseUrl(),
              // Tell the local wallet which backend this bridge actually lives on — its own
              // hostname-derived default is wrong for any non-local backend.
              mcBackendHintUrl: this.storage!.backendUrl,
            }
          : undefined,
      pushWallet,
      // Only a wallet-pinned request binds the session to one claimant server-side; an ordinary
      // push wake is an optimisation and must never narrow who may claim the bridge.
      pinnedWallet: targetWalletConnection == null ? undefined : pushWallet,
      expectedWalletVerifyPublicKey: targetWalletConnection?.walletVerifyPublicKey,
      journalBeforeExternalWorkHold: target.journalBeforeExternalWorkHold,
      autoOpen,
      pendingRequest:
        pendingRequestStore == null
          ? undefined
          : createPendingRequestHandle({
              store: pendingRequestStore,
              requestId: target.requestId ?? crypto.randomUUID(),
              prepared,
              meteorAppIds: targetMeteorAppIds,
              // The same claimant pin `MobileBridgeSession.resolveClaimedWallet` applies here.
              expectedWalletVerifyPublicKey:
                pushWallet?.walletVerifyPublicKey ?? targetWalletConnection?.walletVerifyPublicKey,
            }),
    });
    // Bind the freshly minted transfer key handle to exactly this session before anything can
    // observe it — a key generated for one bridge can never meet another bridge's wallet_action.
    sensitiveTransferSource?.bindPendingHandleToSession(session);
    this.currentSession = session;
    this.currentTransferTargetPlatform = transferTargetPlatform;
    void session.startPreparation().catch(() => {});
    return session;
  }

  /** One session on this client's session client, wired to this client's own seams. */
  private createMobileBridgeSession(
    token: string,
    request: TRequestSessionInput,
  ): MobileBridgeSession {
    return new MobileBridgeSession({
      ...request,
      token,
      client: this.sessionClient!,
      isCurrent: (candidate) => candidate === this.currentToken,
      buildConnection: (wallet) => this.buildConnection(wallet),
      persistFunctionCallKey: async (network, accountId, keyPair) => {
        await this.meteorConnect.nearKeyStoreProvider
          .getKeyStore()
          .setKey(network, accountId, keyPair);
      },
      assertIdentityGeneration: () => this.assertCurrentGeneration(),
      sameDevice: {
        remember: (walletVerifyPublicKey) => {
          void this.storage?.rememberSameDeviceWallet(walletVerifyPublicKey).catch((error) => {
            this.logger.err("Could not record the same-device wallet", error);
          });
        },
        forget: (walletVerifyPublicKey) => {
          this.logger.log("Automatic open was not taken; waiting for a tap next time");
          void this.storage?.forgetSameDeviceWallet(walletVerifyPublicKey).catch((error) => {
            this.logger.err("Could not forget the same-device wallet", error);
          });
        },
      },
      acquireFirstPairingLease: () =>
        this.leaseProvider!.acquire(`${this.storage!.environmentId}:first-pairing`, {
          timeoutMs: 1_000,
        }),
      registerLiveSession: async () => {
        const gate = await this.leaseProvider!.acquire(
          `${this.storage!.environmentId}:maintenance-gate`,
        );
        try {
          await gate.assertOwned();
          await this.assertCurrentGeneration();
          return await this.storage!.registerLiveSession(token);
        } finally {
          await gate.release();
        }
      },
    });
  }

  // This tab's pending-request store, unless reload recovery is switched off.
  private pendingRequestStore(): IMobileBridgePendingRequestStore | undefined {
    if (this.config?.recoverAfterReload === false || this.storage == null) return undefined;
    return createPendingRequestStore(this.storage.environmentId);
  }

  //
  // Reload recovery
  //

  // Collect the answer to a request this tab started before the page reloaded (see
  // `IMeteorConnectMobileBridgeConfig.recoverAfterReload`). Runs at most once per client:
  // `MeteorConnect.initialize` starts it, and every new request waits for it first, because the one
  // session client carries one session at a time. Never rejects; its result is reported through
  // `onRecoveredActionResult` and `getRecoveredResults`.
  recoverPendingRequest(): Promise<void> {
    if (this.recoveryPromise == null) {
      this.recoveryEntered = new Promise<void>((resolve) => {
        this.markRecoveryEntered = resolve;
      });
      this.recoveryPromise = this.runRecovery()
        .catch((error) => {
          this.logger.err("Recovering the request from before the reload failed", error);
        })
        .finally(() => this.markRecoveryEntered?.());
    }
    return this.recoveryPromise;
  }

  private async runRecovery(): Promise<void> {
    const config = this.config;
    if (config == null) return;
    if (config.enabled !== true || config.recoverAfterReload === false) {
      // Off, by the switch or with the bridge itself: withdraw what an earlier page kept for it
      // (the session secret and maybe a function-call key), which nothing would read again.
      const environmentIds = new Set([createBridgeEnvironmentId(config.backendUrl)]);
      if (config.enabled === true) {
        environmentIds.add(
          createBridgeEnvironmentId((await this.resolveBridgeTarget()).backendUrl),
        );
      }
      for (const environmentId of environmentIds) createPendingRequestStore(environmentId).clear();
      return;
    }
    const target = await this.resolveBridgeTarget();
    const store = createPendingRequestStore(createBridgeEnvironmentId(target.backendUrl));
    const record = store.read();
    if (record == null) return;
    const messageParams = pendingActionMessageParams(record.action);
    const base = {
      requestId: record.requestId,
      actionId: record.action.sdkActionId,
      ...(messageParams == null ? {} : { messageParams }),
    };
    // An answer the page before the reload already verified is delivered whatever the deadline:
    // the wallet gave it inside the session's lifetime.
    if (record.answer == null && Date.now() >= record.expiresAt) {
      store.clear(record.requestId);
      this.publishRecoveredResult({
        ...base,
        outcome: "expired",
        error: new Error(MOBILE_BRIDGE_ENDING.expired),
      });
      return;
    }
    let session: MobileBridgeSession;
    try {
      await this.initializeBridgeClient();
      if (this.currentSession != null) {
        // The one session client already carries a request (new requests wait for recovery, so
        // this is only a guard). Its slot is never taken over, and the record is left to expire.
        this.logger.log("A request is already running; the one from before the reload is left");
        return;
      }
      const token = crypto.randomUUID();
      const prepared = pendingRequestToPreparedAction(record);
      session = this.createMobileBridgeSession(token, {
        prepared,
        targetMeteorAppIds: [...record.meteorAppIds],
        expectedWalletVerifyPublicKey: record.expectedWalletVerifyPublicKey,
        pendingRequest: createPendingRequestHandle({
          store,
          requestId: record.requestId,
          prepared,
          meteorAppIds: record.meteorAppIds,
          expectedWalletVerifyPublicKey: record.expectedWalletVerifyPublicKey,
        }),
      });
      this.currentToken = token;
      this.currentSession = session;
      this.recoverySession = session;
      this.recoveringRequest = {
        requestId: record.requestId,
        actionId: record.action.sdkActionId,
        expiresAt: record.expiresAt,
      };
    } catch (error) {
      // A local setup failure: nothing was re-entered, so the record stays for a later load (it
      // expires on its own) and an answer the wallet may already hold is not given up.
      this.publishRecoveredResult(this.recoveredFailure(base, error));
      return;
    }
    // A recorded answer means the page before the reload had already collected it and sent the
    // acknowledgement that closes the session, so that session is never re-entered: it could
    // only report its `closed` phase as a cancel, with the wallet's answer gone from it.
    if (record.answer != null) {
      void session.startFromRecordedAnswer(record.answer).catch(() => {});
    } else {
      void session
        .startResume(record.token, record.walletLink)
        .catch(() => {})
        .finally(() => this.markRecoveryEntered?.());
    }
    let result: IMeteorConnectRecoveredActionResult;
    let output: unknown;
    let delivered = false;
    try {
      output = await session.awaitResult();
      delivered = true;
      result = { ...base, outcome: "success", output };
    } catch (error) {
      result = this.recoveredFailure(base, error);
    } finally {
      this.recoverySession = undefined;
      this.recoveringRequest = undefined;
    }
    if (delivered) {
      // The wallet's answer is already collected and acknowledged; a failure to update the stored
      // accounts must never turn it into a failure the DApp would act on.
      try {
        await this.applyRecoveredAccountChange(record, session, output);
      } catch (error) {
        this.logger.err("Applying the recovered answer to the stored accounts failed", error);
      }
    }
    // The session is over either way: release it (and its bridge) before anyone hears of it.
    await this.releaseSession(session).catch((error) => {
      this.logger.err("Releasing the recovered mobile bridge session failed", error);
    });
    if (
      result.error instanceof PartnerSessionResumeError &&
      result.error.reason === "owned_elsewhere"
    ) {
      // Another live tab (a duplicate) or instance holds this request and delivers its answer.
      this.logger.log("The request from before the reload is held by another live page");
      return;
    }
    this.publishRecoveredResult(result);
  }

  private recoveredFailure(
    base: Pick<IMeteorConnectRecoveredActionResult, "requestId" | "actionId">,
    error: unknown,
  ): IMeteorConnectRecoveredActionResult {
    return {
      ...base,
      outcome: recoveredOutcomeOf(error),
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  // The stored-account effect the original page's `ExecutableAction` would have applied: a sign-in
  // adds the account (its function-call key is already in the key store, written by the result
  // mapping), a sign-out removes it, and any other account action refreshes the connection.
  private async applyRecoveredAccountChange(
    record: IMobileBridgePendingRequestRecord,
    session: MobileBridgeSession,
    output: any,
  ): Promise<void> {
    const actionId = record.action.sdkActionId;
    if (actionId === "near::sign_in" || actionId === "near::sign_in_and_sign_message") {
      const account: IMeteorConnectAccount = {
        connection: output.connection,
        identifier: output.identifier,
        publicKeys: output.publicKeys,
      };
      // Replaced rather than appended: the account may already be stored from an earlier sign-in.
      await this.meteorConnect.removeSignedInAccount(account.identifier);
      await this.meteorConnect.addSignedInAccount(account);
      return;
    }
    if (actionId === "near::sign_out") {
      await this.meteorConnect.removeSignedInAccount(output);
      return;
    }
    const connection = session.getCompletedConnection();
    const identifier = recordedAccountIdentifier(record);
    if (connection == null || identifier == null) return;
    const account = await this.meteorConnect.getAccount(identifier);
    if (account != null) {
      await this.meteorConnect.updateSignedInAccountConnection({ ...account, connection });
    }
  }

  // Let a request recovered after a reload finish before a new one takes the session client. A
  // recovered request the wallet has not picked up within `RECOVERY_SUPERSEDE_GRACE_MS` is closed
  // instead — the user has moved on to a new request — and reported as `"cancelled"`.
  private async settleRecoveryBeforeNewRequest(): Promise<void> {
    // Started here when `MeteorConnect.initialize` has not reached it yet (an unawaited
    // initialize, or one that failed after configuring): recovery must always claim the one
    // session client before a new request can.
    const recovery = this.recoverPendingRequest();
    if (await settledWithin(recovery, RECOVERY_SUPERSEDE_GRACE_MS)) return;
    const session = this.recoverySession;
    if (session != null && !session.isCommitted()) {
      this.logger.log("A new request replaces the recovered one the wallet had not picked up");
      await session.abandon().catch((error) => {
        this.logger.err("Closing the recovered mobile bridge request failed", error);
      });
    }
    await recovery;
  }

  /** See `MeteorConnect.getRecoveringRequest`. */
  async getRecoveringRequest(): Promise<IMeteorConnectRecoveringRequest | undefined> {
    if (this.recoveryPromise == null) return undefined;
    await this.recoveryEntered;
    const session = this.recoverySession;
    const recovering = this.recoveringRequest;
    if (session == null || recovering == null) return undefined;
    const snapshot = session.getSnapshot();
    if (["completed", "failed", "cancelled"].includes(snapshot.phase)) return undefined;
    return {
      requestId: recovering.requestId,
      actionId: recovering.actionId,
      // Read live: the idle deadline moves with every transition the session makes.
      get expiresAt() {
        const live = session.getSnapshot();
        return Math.min(
          live.idleExpiresAt ?? Number.POSITIVE_INFINITY,
          live.absoluteExpiresAt ?? recovering.expiresAt,
        );
      },
      canOpenInWallet: snapshot.deepLink != null,
      openInWallet: () => {
        if (this.recoverySession !== session || this.currentSession !== session) {
          throw new Error("mobile_bridge_recovered_request_settled");
        }
        return this.openCurrentSessionInApp();
      },
      // Recovery runs once per client, so one memo covers every handle: a double tap sends one
      // close verb.
      cancel: () => (this.recoveryCancel ??= this.cancelRecoveringRequest(session)),
    };
  }

  // The user gave up on a recovered request: close it as closing the Connect popup would
  // (`abandon`), which reports it as `"cancelled"`. A close that cannot be sent still ends it
  // locally — the session expires server-side on its own, like any undeliverable close verb. A
  // request whose wallet answer is already being acknowledged is not cancelled: `abandon` leaves
  // it be, and that answer is what gets reported.
  private async cancelRecoveringRequest(session: MobileBridgeSession): Promise<void> {
    if (this.recoverySession !== session) return;
    try {
      await session.abandon();
    } catch (error) {
      this.logger.err("Closing the recovered mobile bridge request failed", error);
      if (!session.isDeliveringAnswer()) await session.dispose().catch(() => {});
    }
    await this.recoveryPromise;
  }

  /** See `MeteorConnect.onRecoveredActionResult`. */
  onRecoveredActionResult(listener: TMeteorConnectRecoveredActionResultListener): () => void {
    this.recoveredResultListeners.add(listener);
    for (const result of this.undeliveredRecoveredResults.splice(0)) {
      this.deliverRecoveredResult(listener, result);
    }
    return () => {
      this.recoveredResultListeners.delete(listener);
    };
  }

  /** See `MeteorConnect.getRecoveredResults`. */
  async getRecoveredResults(): Promise<IMeteorConnectRecoveredActionResult[]> {
    await this.recoveryPromise;
    return [...this.recoveredResults];
  }

  private publishRecoveredResult(result: IMeteorConnectRecoveredActionResult): void {
    this.recoveredResults.push(result);
    if (this.recoveredResultListeners.size === 0) {
      this.undeliveredRecoveredResults.push(result);
      return;
    }
    for (const listener of [...this.recoveredResultListeners]) {
      this.deliverRecoveredResult(listener, result);
    }
  }

  private deliverRecoveredResult(
    listener: TMeteorConnectRecoveredActionResultListener,
    result: IMeteorConnectRecoveredActionResult,
  ): void {
    try {
      listener(result);
    } catch (error) {
      this.logger.err("A recovered-result listener threw", error);
    }
  }

  /** See `mobileAppAutoOpen.ts` for why each condition is required. */
  private async isSameDeviceAutoOpenEligible(
    request: TMCActionRequestUnionExpandedInput<TMCActionRegistry>,
    pushWallet: TPartnerPairedWallet | undefined,
    target: IMobileBridgeRequestTarget,
  ): Promise<boolean> {
    const base = {
      enabled: this.config?.autoOpenPairedWallet !== false,
      hostSuppliedOpener: this.config?.nativeAppOpener != null,
      actionId: request.id,
      transferTargetPlatform: target.transferTargetPlatform,
      pushWalletVerifyPublicKey: pushWallet?.walletVerifyPublicKey,
      mobileDevice: typeof navigator !== "undefined" && isMobile(),
    };
    // The storage read is the only cost, so it runs last and only when it can still matter.
    const walletKey = base.pushWalletVerifyPublicKey;
    const storage = this.storage;
    if (
      walletKey == null ||
      storage == null ||
      !isSameDeviceAutoOpenEligible({ ...base, knownOnThisDevice: true })
    ) {
      return false;
    }
    const knownOnThisDevice = await storage.hasSameDeviceWallet(walletKey).catch(() => false);
    return isSameDeviceAutoOpenEligible({ ...base, knownOnThisDevice });
  }

  /**
   * The automatic open itself: only while the starting tap is still live, the page is in the
   * foreground, this is still the current request, and the wallet has not already picked it up.
   * Resolves whether the app demonstrably came up (the page went to the background).
   */
  private async autoOpenSession(session: MobileBridgeSession): Promise<boolean> {
    if (this.currentSession !== session || !canOpenAppWithoutNewTap()) return false;
    if (session.getSnapshot().phase !== "waiting_for_wallet") return false;
    try {
      await this.openCurrentSessionInApp(undefined, { automatic: true });
    } catch (error) {
      this.logger.err("Automatic open of the paired wallet failed", error);
      return false;
    }
    const opened = await waitForPageToHide(AUTO_OPEN_CONFIRMATION_MS);
    this.logger.log(
      opened
        ? "Opened the paired wallet automatically"
        : "Automatic open not confirmed; sending the push notification as usual",
    );
    return opened;
  }

  /**
   * Install a request as the next turn of the retained external-work hold. Only the exact session
   * that is still holding the named bridge may carry it: anything else (a disposed session, a
   * spent hold, a different bridge) falls through to a fresh session, which is the documented
   * recovery path — a lease is never replayed.
   */
  private async continueExternalWorkHold(
    request: TMCActionRequestUnionExpandedInput<TMCActionRegistry>,
    target: IMobileBridgeRequestTarget,
  ): Promise<MobileBridgeSession | undefined> {
    const requested = target.continueExternalWorkHold;
    if (requested == null) return undefined;
    const session = this.currentSession;
    const held = session?.getExternalWorkHold();
    if (session == null || held == null || held.bridgeId !== requested.bridgeId) return undefined;
    const prepared = await sdkActionToMobileBridge(request);
    await session.beginNextTurn(prepared);
    return session;
  }

  /**
   * The persistent client id, or undefined before one has been assigned. The getter throws a
   * typed local guard when the identity has not been provisioned yet, so it is always fenced.
   */
  private partnerClientId(): string | undefined {
    if (this.sessionClient == null || !this.sessionClient.hasPersistentClientId()) return undefined;
    try {
      return this.sessionClient.clientPersistentId;
    } catch (error) {
      if (error instanceof SessionLocalGuardError) return undefined;
      throw error;
    }
  }

  /** The connection describing one paired wallet — 0.12 has no "active paired wallet" of its own. */
  private buildConnection(
    wallet: Pick<TPartnerPairedWallet, "meteorAppId" | "walletVerifyPublicKey">,
  ): IMeteorConnection_V2_BridgeMobile {
    const partnerClientId = this.partnerClientId();
    if (partnerClientId == null || this.storage == null || this.config == null) {
      throw new Error("mobile_bridge_active_wallet_unavailable");
    }
    return {
      executionTarget: "v2_bridge_mobile",
      schemaVersion: 1,
      bridgeEnvironmentId: this.storage.environmentId,
      meteorAppId: wallet.meteorAppId,
      partnerClientId,
      walletVerifyPublicKey: wallet.walletVerifyPublicKey,
    };
  }

  getCurrentSession(): MobileBridgeSession | undefined {
    return this.currentSession;
  }

  async releaseSession(
    session: MobileBridgeSession,
    beforeDispose?: Promise<unknown>,
  ): Promise<void> {
    if (this.currentSession === session) {
      // Fence the abandoned session immediately. A new DApp prompt may open at once, while
      // prepareRequest waits below for the previous bridge disconnect to drain.
      this.currentToken = undefined;
      this.currentSession = undefined;
    }
    const previousDisposal = this.sessionDisposalPromise;
    const disposal = (async () => {
      await previousDisposal?.catch(() => {});
      await beforeDispose?.catch(() => {});
      await session.dispose();
    })();
    this.sessionDisposalPromise = disposal;
    try {
      await disposal;
    } finally {
      if (this.sessionDisposalPromise === disposal) this.sessionDisposalPromise = undefined;
    }
  }

  async refreshRequest(
    request: TMCActionRequestUnionExpandedInput<TMCActionRegistry>,
    sensitiveTransferSource?: IMobileBridgeSensitiveTransferSource,
    target: IMobileBridgeRequestTarget = {},
  ): Promise<MobileBridgeSession> {
    const current = this.currentSession;
    if (current == null) {
      return this.prepareRequest(request, sensitiveTransferSource, target);
    }
    const cancellation = await current.cancel();
    if (cancellation === "target_already_committed") {
      throw new Error("mobile_bridge_refresh_after_commit");
    }
    await current.dispose();
    this.currentSession = undefined;
    this.currentToken = undefined;
    return this.prepareRequest(request, sensitiveTransferSource, target);
  }

  /**
   * The connection of the wallet that completed the current session. Only the NEAR account
   * actions consume it; an account-less transfer never reaches here.
   */
  getActiveConnection(): IMeteorConnection_V2_BridgeMobile {
    const connection = this.currentSession?.getCompletedConnection();
    if (connection == null) throw new Error("mobile_bridge_active_wallet_unavailable");
    return connection;
  }

  /**
   * Synchronously claim the sized wallet popup window during a user gesture, before the bridge
   * session (and thus the wallet URL) exists. Browsers only reliably allow `window.open` inside
   * the gesture's own call stack, so a caller that must first await session creation opens this
   * placeholder immediately on click and hands it to `openCurrentSessionInApp` once the link is
   * published. The popup's `opener` is severed right away — navigation happens through the handle
   * this side keeps, and the wallet page never sees `window.opener` (the same isolation the
   * direct-open path gets from `noopener`). Returns null when the browser blocks the popup;
   * callers then fall back to the connect panel's Open button / QR.
   */
  openPendingWalletWindow(): Window | null {
    try {
      const pending = window.open("about:blank", "_blank", centeredWalletPopupFeatures());
      if (pending == null) return null;
      pending.opener = null;
      try {
        pending.document.title = "Meteor Wallet";
        pending.document.body.style.cssText =
          "margin:0;display:grid;place-items:center;min-height:100vh;background:#0e0e17;color:#bebee6;font-family:sans-serif;font-size:14px;";
        pending.document.body.textContent = "Opening Meteor Wallet…";
      } catch {
        // Cosmetic only — a browser that refuses writes to the about:blank document still
        // navigates the window fine.
      }
      return pending;
    } catch {
      return null;
    }
  }

  /**
   * @param pendingWindow A placeholder window from `openPendingWalletWindow`, claimed inside the
   * user gesture that chose a web wallet. When given, a web link navigates it instead of opening
   * a fresh popup; a placeholder the user already closed is respected as a decline. Native deep
   * links never navigate it — it is closed rather than stranded.
   */
  openCurrentSessionInApp(
    pendingWindow?: Window,
    options: {
      /**
       * A same-device auto-open rather than a tap: only ever the paired app's custom-scheme link
       * — never a web-wallet window, which would be an unrequested popup.
       */
      automatic?: boolean;
    } = {},
  ): void | Promise<void> {
    const opener = this.config?.nativeAppOpener ?? directBrowserNativeAppOpener;
    const session = this.currentSession;
    if (session == null) {
      pendingWindow?.close();
      return;
    }
    let extensionOpen: Promise<void> | undefined;
    const nativeOpen = session.openInApp((link) => {
      // Both branches allow exactly the backend-issued wallet URL, extended only by the SDK's own
      // `#partnerSecret` fragment. The allowlist derives from the SELECTED walletLink — never
      // from a partner-supplied URL, and never from `config.meteorAppId`, which describes the
      // configured mobile wallet rather than the wallet this particular session targets.
      const selectedLink = session.getSelectedWalletLink();
      if (selectedLink == null || !link.startsWith(selectedLink.linkString)) {
        throw new Error("mobile_bridge_native_scheme_not_allowed");
      }
      const protocol = new URL(link).protocol;
      if (options.automatic === true && selectedLink.linkType !== EBridgeLinkType.app_deep_link) {
        throw new Error("mobile_bridge_auto_open_not_app_link");
      }
      if (selectedLink.linkType === EBridgeLinkType.web_app_url) {
        if (protocol !== "https:" && protocol !== "http:") {
          throw new Error("mobile_bridge_native_scheme_not_allowed");
        }
        if (this.currentTransferTargetPlatform === "extension") {
          pendingWindow?.close();
          extensionOpen = openExtensionNewKeyTransfer(
            link,
            this.bridgeTarget?.backendUrl ?? this.config!.backendUrl,
          );
          return;
        }
        if (pendingWindow != null) {
          if (!pendingWindow.closed) pendingWindow.location.href = link;
          return;
        }
        window.open(link, "_blank", `${centeredWalletPopupFeatures()},noopener`);
        return;
      }
      if (!ALLOWED_NATIVE_APP_SCHEMES.has(protocol)) {
        throw new Error("mobile_bridge_native_scheme_not_allowed");
      }
      pendingWindow?.close();
      // A relaying opener (the NEAR Connect sandbox) answers asynchronously; the session counts the
      // hand-off only once it has, and the rejection reaches the UI through the returned promise.
      return opener.open(link);
    }, options);
    return extensionOpen ?? nativeOpen;
  }

  async resetPartnerIdentity(): Promise<void> {
    await this.initializeBridgeClient();
    if (this.currentSession?.isCommitted()) throw new Error("mobile_bridge_reset_after_commit");
    const lease = await this.leaseProvider!.acquire(
      `${this.storage!.environmentId}:maintenance-gate`,
    );
    try {
      await lease.assertOwned();
      await this.currentSession?.dispose();
      if (await this.storage!.hasOtherLiveSessions())
        throw new Error("mobile_bridge_other_tab_active");
      const nextGeneration = (await this.storage!.getFencingGeneration()) + 1;
      await this.sessionClient!.resetClient();
      // `resetClient()` clears only the client's own identity subtree; the comprehensive wipe of
      // this SDK's namespace (paired wallets, session contexts, lease registers) is ours to do,
      // and the bumped fencing generation is written back after it.
      await this.storage!.clearIdentityStorage();
      await this.storage!.setFencingGeneration(nextGeneration);
      this.fencingGeneration = nextGeneration;
      this.currentSession = undefined;
      this.currentToken = undefined;
      await this.sessionClient!.initializeClient();
    } finally {
      await lease.release();
    }
  }

  async makeRequest<R extends TMCActionRequestUnionExpandedInput<TMCActionRegistry>>(
    request: R,
    connection: TMeteorExecutionTargetConfig,
  ): Promise<TMCActionOutput<R>> {
    if (connection.executionTarget !== "v2_bridge_mobile") {
      throw new Error("mobile_bridge_invalid_execution_target");
    }
    let session = this.currentSession;
    if (
      session == null ||
      session.prepared.sdkRequest.id !== request.id ||
      session.prepared.sdkRequest.expandedInput !== request.expandedInput
    ) {
      session = await this.prepareRequest(request);
    }
    return session.awaitResult();
  }

  async dispose(): Promise<void> {
    await this.teardownBridge();
    this.storageImplementation = undefined;
    this.storageIdentity = undefined;
  }

  /** Drop the live bridge but keep `configure()`'s state, so the next request re-initializes. */
  private async teardownBridge(): Promise<void> {
    // Tearing down would dispose a request recovered after a reload, deleting its record — and
    // with a sign-in, the only copy of its new function-call key. `getRecoveredResults()` resolves
    // once that request has settled; dispose after it.
    if (this.recoverySession != null) throw new Error("mobile_bridge_dispose_during_recovery");
    this.currentToken = undefined;
    await this.currentSession?.dispose();
    await this.sessionDisposalPromise?.catch(() => {});
    this.currentSession = undefined;
    await this.sessionClient?.disconnectBridge().catch(() => {});
    this.sessionClient = undefined;
    this.initializePromise = undefined;
    this.releaseCoordinatorOwnership();
    this.leaseProvider = undefined;
    this.fencingGeneration = undefined;
    this.bridgeTarget = undefined;
  }
}
