import {
  EPartnerClientStatus,
  PartnerBridgeClient,
  PartnerBridgeStore,
} from "@meteorwallet/connect";
import {
  EBridgeLinkType,
  EMeteorAppId,
  hasRequiredWalletCapabilities,
  METEOR_WALLET_PROTOCOL_VERSION,
} from "@meteorwallet/connect-shared";
import type { TLinkEvent } from "@nice-code/action";
import type { TRealmDiagnosticEvent, TRealmStatus } from "@nice-code/realm";
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

class SdkPartnerBridgeClient extends PartnerBridgeClient {
  onConnectionChange?: (reconnecting: boolean, error?: unknown) => void;

  protected onBridgeLinkEvent(event: TLinkEvent): void {
    this.onConnectionChange?.(event.type !== "link_up");
  }

  protected onBridgeRealmStatus(status: TRealmStatus, meta: { hasBeenLive: boolean }): void {
    this.onConnectionChange?.(status === "connecting" && meta.hasBeenLive);
  }

  protected onBridgeRealmAttachError(error: unknown): void {
    this.onConnectionChange?.(false, error);
  }

  protected onBridgeRealmDiagnostic(event: TRealmDiagnosticEvent): void {
    this.onConnectionChange?.(true, new Error(`mobile_bridge_realm_${event.type}`));
  }
}

export class MeteorConnectMobileBridgeClient extends MeteorConnectClientBase {
  readonly clientName = "Meteor Connect Mobile Bridge Client";
  readonly executionTargets: TMeteorConnectionExecutionTarget[] = ["v2_bridge_mobile"];
  protected readonly logger = MeteorLogger.createLogger("MeteorConnect:MobileBridgeClient");
  private config?: Required<
    Pick<IMeteorConnectMobileBridgeConfig, "enabled" | "backendUrl" | "meteorAppId">
  > &
    IMeteorConnectMobileBridgeConfig;
  private storage?: IMobileBridgeStorageContext;
  private bridgeClient?: SdkPartnerBridgeClient;
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
          this.bridgeClient = new SdkPartnerBridgeClient({
            backendUrl: this.storage.backendUrl,
            partnerMetadata: normalizePartnerMetadata(this.config!.partnerMetadata),
            storageAdapter: this.storage.storageAdapter,
            clearIdentityStorage: this.storage.clearIdentityStorage,
            withPairedWalletMutationLock: async (operation) => {
              const lease = await leaseProvider.acquire(
                `${this.storage!.environmentId}:paired-wallets`,
              );
              try {
                await lease.assertOwned();
                await this.assertCurrentGeneration();
                return await operation();
              } finally {
                await lease.release();
              }
            },
          });
          this.bridgeClient.onConnectionChange = (reconnecting, error) =>
            this.currentSession?.setReconnecting(reconnecting, error);
          this.bridgeClient.apply();
          await this.bridgeClient.initialize_client();
        } finally {
          await identityLease.release();
        }
      } finally {
        await maintenanceGate.release();
      }
    })().catch((error) => {
      this.releaseCoordinatorOwnership();
      this.bridgeClient = undefined;
      this.initializePromise = undefined;
      throw error;
    });
    return this.initializePromise;
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
      partnerClientId: this.bridgeClient?.get_partner_client_id() ?? "pending",
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
      connection.partnerClientId !== this.bridgeClient!.get_partner_client_id()
    ) {
      return undefined;
    }
    const paired = await this.bridgeClient!.get_paired_wallets();
    return paired.pairedWallets.find(
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
    transferTargetPlatform?: TTransferTargetPlatform,
    targetWalletConnection?: IMeteorConnection_V2_BridgeMobile,
  ): Promise<MobileBridgeSession> {
    await this.initializeBridgeClient();
    await this.sessionDisposalPromise?.catch((error) => {
      this.logger.err("Previous mobile bridge session disposal failed", error);
    });
    if (this.currentSession != null) {
      const existing = this.currentSession.getSnapshot();
      if (!["completed", "failed", "cancelled"].includes(existing.phase)) {
        throw new Error("mobile_bridge_session_already_active");
      }
      await this.currentSession.dispose();
    }
    const prepared = await sdkActionToMobileBridge(request, sensitiveTransferSource);
    const pushWallet = await this.selectPushWallet(request, prepared, targetWalletConnection);
    if (targetWalletConnection != null && pushWallet == null) {
      throw new Error("new_key_transfer_paired_wallet_unavailable");
    }
    const token = crypto.randomUUID();
    this.currentToken = token;
    const session = new MobileBridgeSession({
      token,
      client: this.bridgeClient!,
      prepared,
      targetMeteorAppIds: this.targetMeteorAppIdsFor(
        prepared,
        transferTargetPlatform,
        targetWalletConnection,
      ),
      localDevLinkRewrite:
        transferTargetPlatform === "web_local_dev"
          ? {
              baseUrl: await this.localDevLinkBaseUrl(),
              // Tell the local wallet which backend this bridge actually lives on — its own
              // hostname-derived default is wrong for any non-local backend.
              mcBackendHintUrl: this.storage!.backendUrl,
            }
          : undefined,
      pushWallet,
      isCurrent: (candidate) => candidate === this.currentToken,
      buildConnection: () => this.buildConnection(),
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

  private buildConnection(): IMeteorConnection_V2_BridgeMobile {
    const wallet = this.bridgeClient?.get_active_paired_wallet();
    const partnerClientId = this.bridgeClient?.get_partner_client_id();
    if (wallet == null || partnerClientId == null || this.storage == null || this.config == null) {
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
    transferTargetPlatform?: TTransferTargetPlatform,
    targetWalletConnection?: IMeteorConnection_V2_BridgeMobile,
  ): Promise<MobileBridgeSession> {
    const current = this.currentSession;
    if (current == null) {
      return this.prepareRequest(
        request,
        sensitiveTransferSource,
        transferTargetPlatform,
        targetWalletConnection,
      );
    }
    const cancellation = await current.cancel();
    if (cancellation === "target_already_committed") {
      throw new Error("mobile_bridge_refresh_after_commit");
    }
    await current.dispose();
    this.currentSession = undefined;
    this.currentToken = undefined;
    return this.prepareRequest(
      request,
      sensitiveTransferSource,
      transferTargetPlatform,
      targetWalletConnection,
    );
  }

  getActiveConnection(): IMeteorConnection_V2_BridgeMobile {
    return this.buildConnection();
  }

  openCurrentSessionInApp(): void {
    const opener = this.config?.nativeAppOpener ?? directBrowserNativeAppOpener;
    const session = this.currentSession;
    session?.openInApp((link) => {
      const selectedLink = session.getSelectedWalletLink();
      if (selectedLink?.linkType === EBridgeLinkType.web_app_url) {
        // Web-wallet targets (e.g. transfer → meteor-frontend): allow exactly the
        // backend-issued wallet URL, extended only by our own #partnerSecret fragment. The
        // allowlist derives from walletLinks — never a partner-supplied URL.
        const protocol = new URL(link).protocol;
        if (
          (protocol !== "https:" && protocol !== "http:") ||
          !link.startsWith(selectedLink.linkString)
        ) {
          throw new Error("mobile_bridge_native_scheme_not_allowed");
        }
        window.open(link, "_blank", "noopener");
        return;
      }
      const protocol = new URL(link).protocol;
      const expectedProtocol =
        this.config?.meteorAppId === EMeteorAppId.meteor_wallet_mobile_dev
          ? "meteorwalletdev:"
          : "meteorwallet:";
      if (protocol !== expectedProtocol) throw new Error("mobile_bridge_native_scheme_not_allowed");
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
      await this.bridgeClient!.reset_partner_identity();
      await this.storage!.setFencingGeneration(nextGeneration);
      this.fencingGeneration = nextGeneration;
      this.currentSession = undefined;
      this.currentToken = undefined;
      await this.bridgeClient!.initialize_client();
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
    await this.bridgeClient?.disconnect_bridge().catch(() => {});
    this.bridgeClient = undefined;
    this.initializePromise = undefined;
    this.releaseCoordinatorOwnership();
    this.leaseProvider = undefined;
    this.fencingGeneration = undefined;
    this.storageImplementation = undefined;
    this.storageIdentity = undefined;
    PartnerBridgeStore.replace({ client: { status: EPartnerClientStatus.uninitialized } });
  }
}
