import type { SignedMessage } from "@near-js/signers";
import type {
  IMeteorConnectAccount,
  IMeteorConnectAccountIdentifier,
} from "../MeteorConnect.types.ts";
import type {
  IMCAction_Base,
  IMCAction_WithConnection,
  IMCAction_WithExactAccountTarget,
  IMCAction_WithNetworkTarget,
  IMCActionDef,
} from "./mc_action.types.ts";

//
// SIGN IN
//

export interface IMCActionReq_Near_SignIn
  extends IMCAction_Base<"near::sign_in">,
    IMCAction_WithConnection,
    IMCAction_WithNetworkTarget {
  contract?: {
    id: string;
    methodNames?: string[];
  };
}

export interface IMCActionDef_Near_SignIn
  extends IMCActionDef<IMCActionReq_Near_SignIn, IMeteorConnectAccount> {}

//
// SIGN OUT (WITH ACCOUNT)
//

export interface IMCActionReq_Near_SignOut
  extends IMCAction_Base<"near::sign_out">,
    IMCAction_WithExactAccountTarget {}

export interface IMCActionDef_Near_SignOut
  extends IMCActionDef<IMCActionReq_Near_SignOut, IMeteorConnectAccountIdentifier> {}

//
// SIGN MESSAGE (WITH ACCOUNT)
//

export interface INearSignMessageParams {
  message: string;
  recipient: string;
  nonce: Uint8Array;
  callbackUrl?: string;
  state?: string;
}

export interface IMCActionReq_Near_SignMessage
  extends IMCAction_Base<"near::sign_message">,
    IMCAction_WithExactAccountTarget {
  messageParams: INearSignMessageParams;
}

export interface IMCActionDef_Near_SignMessage
  extends IMCActionDef<IMCActionReq_Near_SignMessage, SignedMessage> {}
