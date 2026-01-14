import type { SignedMessage } from "@near-js/signers";
import type { FinalExecutionOutcome } from "@near-js/types";
import type { IORequestSignTransactions_Inputs } from "../../ported_common/dapp/dapp.types.ts";
import type {
  IMeteorConnectAccount,
  IMeteorConnectAccountIdentifier,
} from "../MeteorConnect.types.ts";
import type {
  IMCAction_WithConnection,
  IMCAction_WithExactAccountTarget,
  IMCAction_WithFullAccount,
  IMCAction_WithNetworkTarget,
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

// ------------------------------
//
// ACTIONS WITH SIGNED-IN ACCOUNT
//
// ------------------------------

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

//
// SIGN TRANSACTIONS
//

export interface IMCAInput_Near_SignTransactions
  extends IMCAction_WithExactAccountTarget,
    IORequestSignTransactions_Inputs {}

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
    expandedInput: {} as IMCAction_WithFullAccount,
    output: {} as IMeteorConnectAccountIdentifier,
    meta: {
      account: "exact-exists",
    },
  },
  "near::sign_message": {
    input: {} as IMCAInput_Near_SignMessage,
    expandedInput: {} as IMCAInput_Near_SignMessage & IMCAction_WithFullAccount,
    output: {} as SignedMessage,
    meta: {
      account: "exact-exists",
    },
  },
  "near::sign_transactions": {
    input: {} as IMCAInput_Near_SignTransactions,
    expandedInput: {} as IMCAInput_Near_SignTransactions & IMCAction_WithFullAccount,
    output: {} as FinalExecutionOutcome[],
    meta: {
      account: "exact-exists",
    },
  },
} satisfies Record<TMCActionId<"near">, IMCActionSchema>;
