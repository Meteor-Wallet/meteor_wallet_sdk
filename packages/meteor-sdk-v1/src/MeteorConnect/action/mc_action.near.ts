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
  IMCActionSchema,
  TMCActionId,
} from "./mc_action.types.ts";

//
// SIGN IN
//

export interface IMCAInput_Near_SignIn
  extends IMCAction_WithConnection,
    IMCAction_WithNetworkTarget {
  contract?: {
    id: string;
    methodNames?: string[];
  };
}

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

// ------------------------------
//
// ACTIONS WITH SIGNED-IN ACCOUNT
//
// ------------------------------
//
// SIGN OUT
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

export interface IMCAInput_Near_SignMessage extends IMCAction_WithExactAccountTarget {
  messageParams: INearSignMessageParams;
}

export interface IMCActionReq_Near_SignMessage
  extends IMCAction_Base<"near::sign_message">,
    IMCAction_WithExactAccountTarget {
  messageParams: INearSignMessageParams;
}

export interface IMCActionDef_Near_SignMessage
  extends IMCActionDef<IMCActionReq_Near_SignMessage, SignedMessage> {}

//
// SIGN TRANSACTIONS
//

// --------------------------
//
// NEAR ACTION DEFINITION MAP
//
// --------------------------

export const MCNearActions = {
  "near::sign_in": {
    input: {} as IMCAInput_Near_SignIn,
    expandedInput: {} as IMCAInput_Near_SignIn,
    output: {} as IMeteorConnectAccount,
    meta: {
      account: "new-connection",
    },
  },
  "near::sign_out": {
    input: {} as IMCAction_WithExactAccountTarget,
    expandedInput: {} as IMeteorConnectAccount,
    output: {} as IMeteorConnectAccountIdentifier,
    meta: {
      account: "exact-exists",
    },
  },
  "near::sign_message": {
    input: {} as IMCAInput_Near_SignMessage,
    expandedInput: {} as IMCAInput_Near_SignMessage,
    output: {} as SignedMessage,
    meta: {
      account: "exact-exists",
    },
  },
} satisfies Record<TMCActionId<"near">, IMCActionSchema>;
