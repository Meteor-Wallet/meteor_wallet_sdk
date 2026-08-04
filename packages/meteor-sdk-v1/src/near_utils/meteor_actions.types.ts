import type { Action, AddKeyAction } from "@near-wallet-selector/core";

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
