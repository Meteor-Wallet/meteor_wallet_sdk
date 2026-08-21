import type {
  IActionPayload_Request_JsonObject,
  ISessionResultReceipt,
} from "@meteorwallet/connect";
import type { TAllAccountsTransferDataEncrypted } from "@meteorwallet/connect-shared";
import type { KeyPair } from "@near-js/crypto";
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
 *
 * "web_local_dev" (dev-gated, mirrors the V1 client's "Dev Web (Localhost)" target): a normal
 * dev-web-identity bridge, but the backend-issued wallet link is rebased onto the
 * `webDevLocalhostBaseUrl` origin (default https://localhost:3001) so QR/open-link land on a
 * locally running meteor-frontend.
 */
export type TTransferTargetPlatform = "web" | "mobile" | "web_local_dev";

export type TMobileBridgePreparedActionKind =
  | {
      domain: "near";
      sharedActionId: TMobileNearActionId;
      pendingFunctionCallKey?: KeyPair;
      retainedMessageState?: string;
    }
  | {
      domain: "meteor_wallet_core";
      sharedActionId:
        | "transfer_accounts"
        | "new_key_account_transfer_start"
        | "new_key_account_transfer_verify_active";
    };

export interface IMobileBridgePreparedAction {
  sdkRequest: TMCActionRequestUnionExpandedInput<TMCActionRegistry>;
  actionRequest: IActionPayload_Request_JsonObject;
  /**
   * The exact pre-serialization input `actionRequest` was built from — handed to
   * `waitForValidatedResult({ input })` so the signed result is bound back to the request we
   * actually staged. For transfer this is the attachment's fresh per-bridge payload (already
   * encrypted, and already carried inside `actionRequest`), never the initial
   * `sdkRequest.expandedInput` build.
   */
  actionInput: unknown;
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

/**
 * A live session parked in the bounded external-work hold. `new_key_account_transfer_start` is the
 * one contract whose recovery declaration permits one (`externalWorkHoldAllowed`): once the
 * wallet's signed start result is durably journaled, `acknowledgeAndBeginExternalWork` holds the
 * session open across the AddKey window so the verification turn rides the SAME bridge instead of
 * asking the wallet to mint a second destination key.
 */
export interface IMobileBridgeExternalWorkHold {
  bridgeId: string;
  /** The idempotency id this session was created under — reuse only for an exact retry. */
  partnerRequestId: string;
  /** Receipt of the held turn; the next turn is prepared against exactly this result. */
  receipt: ISessionResultReceipt;
  /** The exact wallet identity that authored the held result. */
  walletConnection: IMeteorConnection_V2_BridgeMobile;
}

/**
 * Journal-before-hold seam (D33 "journal-before-effect"). The host durably persists the wallet's
 * already-verified result and returns the EXACT `receipt.resultHash` it wrote; only then is the
 * hold verb sent. A drifted hash is refused by the backend as `external_work_journal_mismatch`,
 * so this callback must never invent one.
 */
export type TMobileBridgeExternalWorkJournal = (input: {
  receipt: ISessionResultReceipt;
  output: unknown;
}) => Promise<string>;

/** Everything that steers WHICH wallet, and which session, a prepared request lands on. */
export interface IMobileBridgeRequestTarget {
  /** Transfer only: the wallet platform the user chose on the popup's platform screen. */
  transferTargetPlatform?: TTransferTargetPlatform;
  /** Pin the session to one already-paired wallet (the new-key verification turn). */
  walletConnection?: IMeteorConnection_V2_BridgeMobile;
  /** Journal-before-hold seam; supplied only for `new_key_account_transfer_start`. */
  journalBeforeExternalWorkHold?: TMobileBridgeExternalWorkJournal;
  /**
   * Install this request as the NEXT turn of the retained external-work hold instead of creating
   * a new session. Refused unless the retained session is still holding exactly that bridge.
   */
  continueExternalWorkHold?: IMobileBridgeExternalWorkHold;
}

export interface IMobileBridgeResultContext {
  /**
   * Resolves the connection describing the wallet that claimed this session. Only the NEAR
   * account actions consume it — calling it for an account-less action (transfer) would throw
   * `mobile_bridge_active_wallet_unavailable` when the claimed wallet cannot be proven.
   */
  getConnection: () => IMeteorConnection_V2_BridgeMobile;
  persistFunctionCallKey?: (network: string, accountId: string, keyPair: KeyPair) => Promise<void>;
}
