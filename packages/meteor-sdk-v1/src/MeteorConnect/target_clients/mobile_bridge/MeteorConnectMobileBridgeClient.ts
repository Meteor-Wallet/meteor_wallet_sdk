import {
  PartnerSessionClient,
  SessionLocalGuardError,
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
import { MeteorLogger } from "../../logging/MeteorLogger";
import type {
  IMeteorConnectBridgeLeaseProvider,
  IMeteorConnection_V2_BridgeMobile,
  IMeteorConnectMobileBridgeConfig,
  TMeteorConnectionExecutionTarget,
  TMeteorExecutionTargetConfig,
} from "../../MeteorConnect.types";
import { MeteorConnectClientBase } from "../base/MeteorConnectClientBase";
import type {
  IMobileBridgePreparedAction,
  IMobileBridgeRequestTarget,
  IMobileBridgeSensitiveTransferSource,
  TTransferTargetPlatform,
} from "./MeteorConnectMobileBridgeClient.types";
import { MobileBridgeSession } from "./MobileBridgeSession";
import {
  directBrowserNativeAppOpener,
  StorageBakeryBridgeLeaseProvider,
  WebLockBridgeLeaseProvider,
} from "./mobileBridgeLease";
import {
  createMobileBridgeStorage,
  type IMobileBridgeStorageContext,
  normalizePartnerMetadata,
} from "./mobileBridgeStorage";
import {
  getActionRequiredWalletCapabilities,
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
  private storage?: IMobileBridgeStorageContext;
  private sessionClient?: PartnerSessionClient;
  private initializePromise?: Promise<void>;
  private currentSession?: MobileBridgeSession;
  private currentToken?: string;
  private sessionDisposalPromise?: Promise<void>;
  private coordinatorKey?: string;
  private leaseProvider?: IMeteorConnectBridgeLeaseProvider;
  private fencingGeneration?: number;
  private storageImplementation?: ILocalStorageInterface;
  private storageIdentity?: object;

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
      this.storage = createMobileBridgeStorage(storageImplementation, this.config!.backendUrl);
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
    if (prepared.kind.domain !== "meteor_wallet_core") return [this.config!.meteorAppId];
    if (targetWalletConnection != null) return [targetWalletConnection.meteorAppId];
    if (transferTargetPlatform === "mobile") return [this.config!.meteorAppId];
    if (transferTargetPlatform === "web_local_dev") {
      // A locally served meteor-frontend always identifies as the dev web identity.
      return [EMeteorAppId.meteor_wallet_web_dev];
    }
    const configured = this.config?.transferAccounts?.meteorAppIds;
    if (configured != null && configured.length > 0) return [...configured];
    return this.config!.meteorAppId === EMeteorAppId.meteor_wallet_mobile_dev
      ? [EMeteorAppId.meteor_wallet_web_dev]
      : [EMeteorAppId.meteor_wallet_web];
  }

  /**
   * Whether the transfer popup offers "Meteor Web (Local Dev)" — same gate as the V1 client's
   * "Dev Web (Localhost)" target: a development build, or the persisted force-dev flag.
   */
  async isTransferLocalDevWebAvailable(): Promise<boolean> {
    const forceDev = (await this.meteorConnect.storage.getJsonOrDef("dev_000_met", 0)) === 1;
    return forceDev || process.env.NODE_ENV === "development";
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
      meteorAppId: this.config!.meteorAppId,
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
    await this.initializeBridgeClient();
    await this.sessionDisposalPromise?.catch((error) => {
      this.logger.err("Previous mobile bridge session disposal failed", error);
    });
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
    // Stabilization SDK-3: a wallet-targeted request whose paired-wallet record is gone (identity
    // reset, ledger eviction, changed backend scope) is NOT a dead end. The session is created
    // without push or a backend pin — QR/link delivery, copy directing the user to the exact
    // wallet — while the claimed wallet is still locally checked against the stored verify key
    // and the wallet's own (partner, transferSessionId) binding stays the authoritative gate.
    const token = crypto.randomUUID();
    this.currentToken = token;
    const session = new MobileBridgeSession({
      token,
      client: this.sessionClient!,
      prepared,
      targetMeteorAppIds: this.targetMeteorAppIdsFor(
        prepared,
        transferTargetPlatform,
        targetWalletConnection,
      ),
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
      isCurrent: (candidate) => candidate === this.currentToken,
      buildConnection: (wallet) => this.buildConnection(wallet),
      persistFunctionCallKey: async (network, accountId, keyPair) => {
        await this.meteorConnect.nearKeyStoreProvider
          .getKeyStore()
          .setKey(network, accountId, keyPair);
      },
      assertIdentityGeneration: () => this.assertCurrentGeneration(),
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
    // Bind the freshly minted transfer key handle to exactly this session before anything can
    // observe it — a key generated for one bridge can never meet another bridge's wallet_action.
    sensitiveTransferSource?.bindPendingHandleToSession(session);
    this.currentSession = session;
    void session.startPreparation().catch(() => {});
    return session;
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
  openCurrentSessionInApp(pendingWindow?: Window): void {
    const opener = this.config?.nativeAppOpener ?? directBrowserNativeAppOpener;
    const session = this.currentSession;
    if (session == null) {
      pendingWindow?.close();
      return;
    }
    session.openInApp((link) => {
      // Both branches allow exactly the backend-issued wallet URL, extended only by the SDK's own
      // `#partnerSecret` fragment. The allowlist derives from the SELECTED walletLink — never
      // from a partner-supplied URL, and never from `config.meteorAppId`, which describes the
      // configured mobile wallet rather than the wallet this particular session targets.
      const selectedLink = session.getSelectedWalletLink();
      if (selectedLink == null || !link.startsWith(selectedLink.linkString)) {
        throw new Error("mobile_bridge_native_scheme_not_allowed");
      }
      const protocol = new URL(link).protocol;
      if (selectedLink.linkType === EBridgeLinkType.web_app_url) {
        if (protocol !== "https:" && protocol !== "http:") {
          throw new Error("mobile_bridge_native_scheme_not_allowed");
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
      opener.open(link);
    });
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
    this.storageImplementation = undefined;
    this.storageIdentity = undefined;
  }
}
