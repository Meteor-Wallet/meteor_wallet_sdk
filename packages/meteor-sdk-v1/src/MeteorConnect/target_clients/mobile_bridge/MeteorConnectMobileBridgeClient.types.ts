import type {
  EMeteorAppId,
  EWalletProtocolCapability,
  TAllAccountsTransferDataEncrypted,
} from "@meteorwallet/connect-shared";
import type { KeyPair } from "@near-js/crypto";
import type { IActionPayload_Request_JsonObject } from "@nice-code/action";
import type { TMCActionRegistry } from "../../action/mc_action.combined";
import type { TMCActionRequestUnionExpandedInput } from "../../action/mc_action.types";
import type { IMeteorConnection_V2_BridgeMobile } from "../../MeteorConnect.types";
import type { MobileBridgeSession } from "./MobileBridgeSession";

export type TMobileNearActionId =
  | "sign_in"
  | "sign_in_and_sign_message"
  | "sign_out"
  | "sign_message"
  | "sign_and_send_transaction"
  | "sign_and_send_transactions"
  | "sign_delegate_actions"
  | "verify_owner";

/**
 * Which Meteor Wallet platform a transfer bridge targets. Chosen by the user on the transfer
 * popup's platform screen; decides the app ids sent to create_bridge and therefore which wallet
 * links come back. NEAR actions always target the configured mobile wallet.
 */
export type TTransferTargetPlatform = "web" | "mobile";

export type TMobileBridgePreparedActionKind =
  | {
      domain: "near";
      sharedActionId: TMobileNearActionId;
      pendingFunctionCallKey?: KeyPair;
      retainedMessageState?: string;
    }
  | { domain: "meteor_wallet_core"; sharedActionId: "transfer_accounts" };

export interface IMobileBridgePreparedAction {
  sdkRequest: TMCActionRequestUnionExpandedInput<TMCActionRegistry>;
  actionRequest: IActionPayload_Request_JsonObject;
  kind: TMobileBridgePreparedActionKind;
}

/**
 * The transfer flow's regeneration hook, threaded prepareMobileBridge → prepareRequest → adapter.
 * Every bridge (initial and refreshed) gets a freshly generated key + ciphertext; the pending
 * key handle is bound to the new session immediately after construction, inside prepareRequest.
 * The source itself must never be stored on IMobileBridgePreparedAction — `session.prepared` is
 * publicly reachable.
 */
export interface IMobileBridgeSensitiveTransferSource {
  /** Re-encrypts the retained decrypted snapshot under a brand-new key; wipes any previous handle. */
  buildFreshBridgePayload(): Promise<TAllAccountsTransferDataEncrypted>;
  /** Binds the handle minted by the latest buildFreshBridgePayload() to its owning session. */
  bindPendingHandleToSession(session: MobileBridgeSession): void;
}

export interface IMobileBridgeResultContext {
  /**
   * Lazily resolves the active paired-wallet connection. Only the NEAR account actions consume
   * it — calling it for an account-less action (transfer) would throw
   * `mobile_bridge_active_wallet_unavailable` when no paired wallet exists.
   */
  getConnection: () => IMeteorConnection_V2_BridgeMobile;
  persistFunctionCallKey?: (network: string, accountId: string, keyPair: KeyPair) => Promise<void>;
}

export interface IMobileBridgeSessionTargeting {
  /** Ordered app-id preference: wallet-link selection takes the first match; also sent to create_bridge/push. */
  targetMeteorAppIds: EMeteorAppId[];
  /** Per-action capability set (base ∪ server-required for the action's domain/id). */
  requiredWalletCapabilities: EWalletProtocolCapability[];
}
