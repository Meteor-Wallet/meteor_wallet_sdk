import type { Action as NearJsNativeAction } from "@near-js/transactions";
import type { Action, AddKeyAction } from "@near-wallet-selector/core";
import type { Action as MeteorNativeAction } from "./actionCreator/actions";

/**
 * A native NEAR action instance accepted by SDK transaction inputs: either a standard
 * @near-js/transactions action or one built by the SDK's extended action creators
 * (gas keys, ML-DSA). The two are structurally compatible on every standard action, but
 * TypeScript cannot unify them across @near-js copies/versions in the monorepo, so SDK
 * boundaries accept the union and narrow with a cast where a specific family is required.
 */
export type TNearNativeAction = NearJsNativeAction | MeteorNativeAction;

/** Gas-key metadata carried by Meteor's extended actions. JSON-safe: yoctoNEAR balance as string. */
export interface IMeteorGasKeyInfo {
  balance: string;
  numNonces: number;
}

export interface IMeteorTransferToGasKeyAction {
  type: "TransferToGasKey";
  params: {
    publicKey: string;
    /** yoctoNEAR amount as string */
    deposit: string;
  };
}

export interface IMeteorWithdrawFromGasKeyAction {
  type: "WithdrawFromGasKey";
  params: {
    publicKey: string;
    /** yoctoNEAR amount as string */
    amount: string;
  };
}

/** The wallet-selector AddKeyAction plus Meteor's optional gas-key metadata. */
export interface IMeteorAddKeyAction {
  type: "AddKey";
  params: AddKeyAction["params"] & { gasKeyInfo?: IMeteorGasKeyInfo };
}

/**
 * The wallet-selector Action union extended with Meteor's gas-key actions. Wallet-selector's
 * Action type has no knowledge of these NEAR protocol extensions — they are serialized through
 * the patched @near-js/transactions borsh schema (see patches/) — so this union is the SDK's
 * public action type wherever gas-key actions can appear. A plain wallet-selector Action is
 * assignable to it, so existing callers keep working unchanged.
 */
export type TMeteorAction =
  | Exclude<Action, AddKeyAction>
  | IMeteorAddKeyAction
  | IMeteorTransferToGasKeyAction
  | IMeteorWithdrawFromGasKeyAction;
