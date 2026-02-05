import type { PublicKey } from "@near-js/crypto";
import type { SignedMessage } from "@near-js/signers";
import type { Action, SignedDelegate } from "@near-js/transactions";
import type { FinalExecutionOutcome } from "@near-js/types";
import type { IODappAction_VerifyOwner_Output } from "../../ported_common/dapp/dapp.types";
import type {
  IMeteorConnectAccount,
  IMeteorConnectAccountIdentifier,
} from "../MeteorConnect.types.ts";
import type {
  IMCAction_WithExactAccountTarget,
  IMCAction_WithFullAccount,
  IMCAction_WithNetworkTarget,
  IMCActionSchema,
  TMCActionId,
} from "./mc_action.types.ts";

//
// SIGN IN
//

export interface IMCAInput_Near_SignIn extends IMCAction_WithNetworkTarget {
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
// VERIFY OWNER
//

export interface IMCAInput_Near_VerifyOwner extends IMCAction_WithExactAccountTarget {
  message: string;
}

//
// SIGN TRANSACTIONS
//

export type TSimpleNearTransaction = {
  receiverId: string;
  actions: Action[];
};

// export type TSimpleNearTransaction_DelegateAction = {
//   receiverId: string;
//   actions: DelegateAction[];
// };

export interface IMCA_Near_SignTransactions_Input extends IMCAction_WithExactAccountTarget {
  transactions: TSimpleNearTransaction[];
}

//
// SIGN DELEGATE ACTIONS
//

export interface INearNativeDelegateAction {
  senderId: string;
  receiverId: string;
  actions: Array<Action>;
  nonce: bigint;
  maxBlockHeight: bigint;
  publicKey: PublicKey;
}

export type TSimpleNearDelegateAction = Omit<
  INearNativeDelegateAction,
  "senderId" | "publicKey" | "nonce" | "blockHash" | "maxBlockHeight"
>;

export interface IMCA_Near_SignDelegateActions_Input extends IMCAction_WithExactAccountTarget {
  delegateActions: TSimpleNearDelegateAction[];
}

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
      executionTargetSource: "on_execution",
    },
  },
  "near::sign_out": {
    input: {} as IMCAction_WithExactAccountTarget,
    expandedInput: {} as IMCAction_WithFullAccount,
    output: {} as IMeteorConnectAccountIdentifier,
    meta: {
      inputTransform: ["targeted_account"],
      executionTargetSource: "targeted_account",
    },
  },
  "near::sign_message": {
    input: {} as IMCAInput_Near_SignMessage,
    expandedInput: {} as IMCAInput_Near_SignMessage & IMCAction_WithFullAccount,
    output: {} as SignedMessage,
    meta: {
      inputTransform: ["targeted_account"],
      executionTargetSource: "targeted_account",
    },
  },
  "near::sign_transactions": {
    input: {} as IMCA_Near_SignTransactions_Input,
    expandedInput: {} as IMCA_Near_SignTransactions_Input & IMCAction_WithFullAccount,
    output: {} as FinalExecutionOutcome[],
    meta: {
      inputTransform: ["targeted_account"],
      executionTargetSource: "targeted_account",
    },
  },
  "near::sign_delegate_actions": {
    input: {} as IMCA_Near_SignDelegateActions_Input,
    expandedInput: {} as IMCA_Near_SignDelegateActions_Input & IMCAction_WithFullAccount,
    output: {} as {
      delegateHash: Uint8Array;
      signedDelegate: SignedDelegate;
    },
    meta: {
      inputTransform: ["targeted_account"],
      executionTargetSource: "targeted_account",
    },
  },
  "near::verify_owner": {
    input: {} as IMCAInput_Near_VerifyOwner,
    expandedInput: {} as IMCAInput_Near_VerifyOwner & IMCAction_WithFullAccount,
    output: {} as IODappAction_VerifyOwner_Output,
    meta: {
      inputTransform: ["targeted_account"],
      executionTargetSource: "targeted_account",
    },
  },
} as const satisfies Record<TMCActionId<"near">, IMCActionSchema>;
