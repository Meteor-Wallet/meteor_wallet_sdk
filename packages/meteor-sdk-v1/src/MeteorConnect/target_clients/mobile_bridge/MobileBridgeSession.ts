import {
  EPartnerBridgeStep,
  EPartnerClientStatus,
  type PartnerBridgeClient,
  PartnerBridgeStore,
  type TPartnerPairedWallet,
} from "@meteorwallet/connect";
import {
  EBridgeLinkType,
  type EMeteorAppId,
  METEOR_WALLET_PROTOCOL_VERSION,
  type TMeteorBridgeWalletLink,
} from "@meteorwallet/connect-shared";

/**
 * Dev-only: rebase a backend-issued web wallet link onto a local dev origin, preserving the
 * link's path and query (bridgeId, protocolVersion). "https://wallet-dev…/bridge_request?x=y"
 * + "https://localhost:3001" → "https://localhost:3001/bridge_request?x=y".
 *
 * `mcBackendHintUrl` (the partner's bridge backend) rides along as an `mcBackend` query param:
 * a locally served wallet derives its backend from its own hostname, which is wrong whenever the
 * partner used any other backend — dev wallet builds honor the hint so the claim lands on the
 * bridge that actually exists. Never added to non-rebased (deployed) links.
 */
export function rebaseWalletLinkToLocalDev(
  linkString: string,
  localBaseUrl: string,
  mcBackendHintUrl?: string,
): string {
  const link = new URL(linkString);
  const base = new URL(localBaseUrl);
  if (mcBackendHintUrl != null) {
    link.searchParams.set("mcBackend", mcBackendHintUrl);
  }
  return `${base.origin}${link.pathname}${link.search}`;
}
import type {
  IMeteorConnectBridgeLeaseHandle,
  IMeteorConnection_V2_BridgeMobile,
} from "../../MeteorConnect.types";
import type { IMobileBridgePreparedAction } from "./MeteorConnectMobileBridgeClient.types";
import { mobileBridgeResultToSdk } from "./mobileBridgeResultToSdk";
import { getActionRequiredWalletCapabilities } from "./sdkActionToMobileBridge";

export type TMobileBridgePhase =
  | "initializing"
  | "busy_other_tab"
  | "creating_bridge"
  | "waiting_for_wallet"
  | "wallet_verification"
  | "wallet_action"
  | "completed"
  | "failed"
  | "cancelled";

export interface IMobileBridgeSnapshot {
  phase: TMobileBridgePhase;
  push: "not_attempted" | "sending" | "delivered" | "not_delivered";
  pushReason?: string;
  deepLink?: string;
  expiresAt?: number;
  pinAttemptsUsed: number;
  pinError?: string;
  error?: string;
  reconnecting: boolean;
  identityResetRequired?: boolean;
}

interface IMobileBridgeSessionInput {
  token: string;
  client: PartnerBridgeClient;
  prepared: IMobileBridgePreparedAction;
  /** Ordered app-id preference: create_bridge/push targeting + wallet-link selection (first match wins). */
  targetMeteorAppIds: EMeteorAppId[];
  /** Dev-only: rebase the selected web wallet link onto a local origin (transfer "web_local_dev"). */
  localDevLinkRewrite?: { baseUrl: string; mcBackendHintUrl: string };
  pushWallet?: TPartnerPairedWallet;
  buildConnection(): IMeteorConnection_V2_BridgeMobile;
  persistFunctionCallKey?: (network: string, accountId: string, keyPair: any) => Promise<void>;
  isCurrent(token: string): boolean;
  assertIdentityGeneration(): Promise<void>;
  acquireFirstPairingLease(): Promise<IMeteorConnectBridgeLeaseHandle>;
  registerLiveSession(): Promise<{ stop(): Promise<void> }>;
}

export class MobileBridgeSession {
  readonly token: string;
  readonly prepared: IMobileBridgePreparedAction;
  private readonly input: IMobileBridgeSessionInput;
  private readonly listeners = new Set<(snapshot: IMobileBridgeSnapshot) => void>();
  private unsubscribeStore?: () => void;
  private visibilityListener?: () => void;
  private partnerRequestId = crypto.randomUUID();
  private selectedWalletLink?: TMeteorBridgeWalletLink;
  private resultSettled = false;
  private resolveResult!: (value: any) => void;
  private rejectResult!: (reason: unknown) => void;
  private readonly resultPromise = new Promise<any>((resolve, reject) => {
    this.resolveResult = resolve;
    this.rejectResult = reject;
  });
  private preparationPromise?: Promise<void>;
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
    pinAttemptsUsed: 0,
    reconnecting: false,
  };

  constructor(input: IMobileBridgeSessionInput) {
    this.input = input;
    this.token = input.token;
    this.prepared = input.prepared;
    if (input.pushWallet != null) {
      this.snapshot = { ...this.snapshot, push: "sending" };
    }
    void this.resultPromise.catch(() => {});
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
    this.unsubscribeStore = PartnerBridgeStore.watch(
      (state) => state.client,
      (client) => void this.applyPartnerState(client),
    );
    const onVisibility = () => {
      if (document.visibilityState === "visible" && this.input.isCurrent(this.token)) {
        void this.input.client.connectBridgeLink().catch(() => {
          this.update({ reconnecting: true });
        });
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    this.visibilityListener = () => document.removeEventListener("visibilitychange", onVisibility);

    try {
      const requiredWalletCapabilities = getActionRequiredWalletCapabilities(
        this.prepared.actionRequest,
      );
      if (this.input.pushWallet != null) {
        const pushWallet = this.input.pushWallet;
        const push = await this.runRecoverableMutation(
          () =>
            this.input.client.request_action_via_push({
              partnerRequestId: this.partnerRequestId,
              walletVerifyPublicKey: pushWallet.walletVerifyPublicKey,
              actionRequest: this.prepared.actionRequest,
              meteorAppIds: [...this.input.targetMeteorAppIds],
              requiredWalletProtocolVersion: METEOR_WALLET_PROTOCOL_VERSION,
              requiredWalletCapabilities,
            }),
          "push",
        );
        this.update({
          push: push.delivered ? "delivered" : "not_delivered",
          pushReason: push.reason,
        });
      } else {
        await this.runRecoverableMutation(
          () =>
            this.input.client.create_bridge({
              partnerRequestId: this.partnerRequestId,
              actionRequest: this.prepared.actionRequest,
              meteorAppIds: [...this.input.targetMeteorAppIds],
              requiredWalletProtocolVersion: METEOR_WALLET_PROTOCOL_VERSION,
              requiredWalletCapabilities,
            }),
          "create",
        );
      }
      await this.applyPartnerState(PartnerBridgeStore.state.client);
    } catch (error) {
      this.fail(error);
      throw error;
    }
  }

  private async runWithTimeout<T>(operation: Promise<T>, operationName: string): Promise<T> {
    const timeoutMs = 15_000;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const abortPromise = new Promise<never>((_, reject) => {
      const abort = () => reject(new Error("mobile_bridge_session_aborted"));
      if (this.abortController.signal.aborted) abort();
      else this.abortController.signal.addEventListener("abort", abort, { once: true });
      timer = setTimeout(
        () => reject(new Error(`mobile_bridge_${operationName}_timeout`)),
        timeoutMs,
      );
    });
    try {
      return await Promise.race([operation, abortPromise]);
    } finally {
      if (timer != null) clearTimeout(timer);
    }
  }

  private async runRecoverableMutation<T>(operation: () => Promise<T>, name: string): Promise<T> {
    try {
      return await this.runWithTimeout(operation(), name);
    } catch (error) {
      if (!(error instanceof Error) || error.message !== `mobile_bridge_${name}_timeout`)
        throw error;
      this.update({ reconnecting: true });
      await this.input.assertIdentityGeneration();
      // Creation and push are idempotent by partnerRequestId; retrying reconciles an ambiguous
      // dispatched outcome with the same authoritative bridge instead of creating a competitor.
      const result = await this.runWithTimeout(operation(), `${name}_recovery`);
      this.update({ reconnecting: false });
      return result;
    }
  }

  private async applyPartnerState(
    client: (typeof PartnerBridgeStore.state)["client"],
  ): Promise<void> {
    if (!this.input.isCurrent(this.token)) return;
    if (client.status === EPartnerClientStatus.error) {
      this.fail(new Error(client.error));
      return;
    }
    if (client.status !== EPartnerClientStatus.ready) return;
    const bridge = client.bridge;
    if (bridge.step === EPartnerBridgeStep.idle) return;
    const common = { expiresAt: bridge.info.expiresAt };
    this.scheduleExpiry(bridge.info.expiresAt);
    if (this.snapshot.deepLink == null) {
      // Ordered preference: the first configured app id that has a backend-issued link wins.
      const backendLink = this.input.targetMeteorAppIds
        .map((appId) => bridge.info.walletLinks.find((candidate) => candidate.appId === appId))
        .find((candidate) => candidate != null);
      if (backendLink == null) {
        this.fail(new Error("mobile_bridge_app_link_missing"));
        return;
      }
      // Dev-only local rewrite — web links only, deep links are never rebased. The rewritten
      // link becomes the selected link so the opener allowlist follows it too.
      const link =
        this.input.localDevLinkRewrite != null &&
        backendLink.linkType === EBridgeLinkType.web_app_url
          ? {
              ...backendLink,
              linkString: rebaseWalletLinkToLocalDev(
                backendLink.linkString,
                this.input.localDevLinkRewrite.baseUrl,
                this.input.localDevLinkRewrite.mcBackendHintUrl,
              ),
            }
          : backendLink;
      this.selectedWalletLink = link;
      const separator = link.linkString.includes("#") ? "&" : "#";
      this.update({
        deepLink: `${link.linkString}${separator}partnerSecret=${encodeURIComponent(bridge.info.partnerSecret)}`,
      });
    }
    switch (bridge.step) {
      case EPartnerBridgeStep.waiting_for_wallet:
        this.update({ phase: "waiting_for_wallet", ...common });
        break;
      case EPartnerBridgeStep.wallet_verification:
        void this.ensureFirstPairingLease(common);
        break;
      case EPartnerBridgeStep.wallet_action:
        await this.releaseFirstPairingLease();
        this.update({ phase: "wallet_action", ...common });
        break;
      case EPartnerBridgeStep.completed:
        if (this.resultSettled) return;
        try {
          const result = await mobileBridgeResultToSdk(this.prepared, bridge.actionResult, {
            getConnection: () => this.input.buildConnection(),
            persistFunctionCallKey: this.input.persistFunctionCallKey,
          });
          this.resultSettled = true;
          this.update({ phase: "completed", ...common });
          this.resolveResult(result);
        } catch (error) {
          this.fail(error);
        }
        break;
      case EPartnerBridgeStep.failed:
        await this.releaseFirstPairingLease();
        this.fail(
          new Error(
            bridge.failureCode === "wallet_update_required"
              ? "wallet_update_required"
              : bridge.failureCode === "pin_attempts_exceeded"
                ? "PIN attempts exceeded"
                : "mobile_bridge_failed",
          ),
        );
        break;
      case EPartnerBridgeStep.cancelled:
        await this.releaseFirstPairingLease();
        this.update({ phase: "cancelled", ...common });
        if (!this.resultSettled) {
          this.resultSettled = true;
          this.rejectResult(new Error("mobile_bridge_cancelled"));
        }
        break;
    }
  }

  private scheduleExpiry(expiresAt: number): void {
    if (this.expiryTimer != null) clearTimeout(this.expiryTimer);
    const delay = Math.max(0, expiresAt - Date.now());
    this.expiryTimer = setTimeout(
      () => {
        if (!["completed", "failed", "cancelled"].includes(this.snapshot.phase)) {
          this.fail(new Error("mobile_bridge_expired"));
        }
      },
      Math.min(delay, 2_147_483_647),
    );
  }

  private async ensureFirstPairingLease(common: { expiresAt: number }): Promise<void> {
    if (this.pairingLease != null) {
      this.update({ phase: "wallet_verification", ...common });
      return;
    }
    if (this.pairingLeasePromise != null) return this.pairingLeasePromise;
    this.update({ phase: "busy_other_tab", ...common });
    this.pairingLeasePromise = (async () => {
      try {
        const lease = await this.input.acquireFirstPairingLease();
        await lease.assertOwned();
        if (!this.input.isCurrent(this.token)) {
          await lease.release();
          return;
        }
        this.pairingLease = lease;
        this.update({ phase: "wallet_verification", error: undefined, ...common });
      } catch {
        if (!this.input.isCurrent(this.token)) return;
        this.update({ phase: "busy_other_tab", error: "Meteor Mobile is busy in another tab." });
        this.pairingRetryTimer = setTimeout(() => {
          this.pairingLeasePromise = undefined;
          void this.ensureFirstPairingLease(common);
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

  private fail(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.update({ phase: "failed", error: message });
    if (!this.resultSettled) {
      this.resultSettled = true;
      this.rejectResult(error);
    }
  }

  setReconnecting(reconnecting: boolean, error?: unknown): void {
    const message =
      error == null ? undefined : error instanceof Error ? error.message : String(error);
    if (message?.includes("identity_pin_mismatch")) {
      this.update({
        phase: "failed",
        reconnecting: false,
        error: "mobile_bridge_identity_pin_mismatch",
        identityResetRequired: true,
      });
      return;
    }
    this.update({
      reconnecting,
      ...(message == null ? {} : { error: message }),
    });
  }

  async submitPin(pinCode: string): Promise<void> {
    if (!/^\d{4}$/.test(pinCode)) throw new Error("Enter the 4-digit PIN shown in Meteor Mobile");
    if (this.snapshot.pinAttemptsUsed >= 3) throw new Error("PIN attempts exceeded");
    const attempts = this.snapshot.pinAttemptsUsed + 1;
    this.update({ pinAttemptsUsed: attempts, pinError: undefined });
    try {
      await this.input.assertIdentityGeneration();
      await this.runWithTimeout(this.input.client.verify_pin({ pinCode }), "pin");
    } catch (error) {
      const message = attempts >= 3 ? "PIN attempts exceeded" : "Incorrect PIN";
      this.update({ pinError: message });
      throw error;
    }
  }

  /** The backend-issued wallet link the deep link / QR was built from (undefined pre-bridge). */
  getSelectedWalletLink(): TMeteorBridgeWalletLink | undefined {
    return this.selectedWalletLink;
  }

  isCommitted(): boolean {
    return ["wallet_action", "completed"].includes(this.snapshot.phase);
  }

  async cancel(): Promise<"cancelled_before_commit" | "target_already_committed"> {
    if (this.snapshot.phase === "cancelled" || this.snapshot.phase === "failed") {
      return "cancelled_before_commit";
    }
    await this.preparationPromise;
    if (this.snapshot.phase === "wallet_action" || this.snapshot.phase === "completed") {
      return "target_already_committed";
    }
    await this.input.assertIdentityGeneration();
    const outcome = await this.runRecoverableMutation(
      () => this.input.client.cancel_bridge(),
      "cancel",
    );
    if (outcome.outcome === "mobile_committed") {
      this.update({ phase: "wallet_action" });
      return "target_already_committed";
    }
    this.update({ phase: outcome.status === "cancelled" ? "cancelled" : this.snapshot.phase });
    if (outcome.status === "cancelled" && !this.resultSettled) {
      this.resultSettled = true;
      this.rejectResult(new Error("mobile_bridge_cancelled"));
    }
    return "cancelled_before_commit";
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
    this.unsubscribeStore?.();
    this.visibilityListener?.();
    if (this.expiryTimer != null) clearTimeout(this.expiryTimer);
    if (this.pairingRetryTimer != null) clearTimeout(this.pairingRetryTimer);
    if (!this.resultSettled) {
      this.resultSettled = true;
      this.rejectResult(new Error("mobile_bridge_session_disposed"));
    }
    await this.releaseFirstPairingLease();
    await this.liveSession?.stop();
    this.listeners.clear();
    await this.input.client.disconnect_bridge();
  }

  dispose(): Promise<void> {
    this.disposePromise ??= this.disposeInternal();
    return this.disposePromise;
  }
}
