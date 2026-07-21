import type { IActionPayload_Request_JsonObject } from "@nice-code/action";
import type { KeyPair } from "@near-js/crypto";
import type { TMCActionRegistry } from "../../action/mc_action.combined";
import type { TMCActionRequestUnionExpandedInput } from "../../action/mc_action.types";
import type { IMeteorConnection_V2_BridgeMobile } from "../../MeteorConnect.types";

export type TMobileNearActionId =
  | "sign_in"
  | "sign_in_and_sign_message"
  | "sign_out"
  | "sign_message"
  | "sign_and_send_transaction"
  | "sign_and_send_transactions"
  | "sign_delegate_actions"
  | "verify_owner";

export interface IMobileBridgePreparedAction {
  sdkRequest: TMCActionRequestUnionExpandedInput<TMCActionRegistry>;
  actionRequest: IActionPayload_Request_JsonObject;
  sharedActionId: TMobileNearActionId;
  pendingFunctionCallKey?: KeyPair;
  retainedMessageState?: string;
}

export interface IMobileBridgeResultContext {
  connection: IMeteorConnection_V2_BridgeMobile;
  persistFunctionCallKey?: (network: string, accountId: string, keyPair: KeyPair) => Promise<void>;
}
