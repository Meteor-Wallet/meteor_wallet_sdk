/**
 * The NEAR Wallet Selector action shapes, declared locally.
 *
 * These were previously imported from `@near-wallet-selector/core`, which caused three problems in
 * the published package (REVIEW-consumer-implementation B-01):
 *
 *   1. `@near-wallet-selector/core` was never declared as a dependency — it only resolved through
 *      monorepo hoisting, so a fresh checkout or a consumer type-check had nothing to resolve.
 *   2. Its `FinalExecutionOutcome` re-export dragged `near-api-js/lib/providers/index.js` into the
 *      shipped `.d.ts`, forcing downstream wallets to patch the generated types.
 *   3. Bundling its declarations pulled in rxjs's `/// <reference path="operators/index.d.ts" />`
 *      triple-slash directives, which point at files that do not exist in `dist/` and made every
 *      consumer `tsc` run fail.
 *
 * The definitions are plain data shapes and are structurally identical to
 * `@near-wallet-selector/core@9.x`, so a caller can still pass wallet-selector actions straight in.
 * Keep them in sync if wallet selector ever extends the action union.
 */

export interface CreateAccountAction {
  type: "CreateAccount";
}

export interface DeployContractAction {
  type: "DeployContract";
  params: {
    code: Uint8Array;
  };
}

export interface FunctionCallAction {
  type: "FunctionCall";
  params: {
    methodName: string;
    args: object;
    gas: string;
    deposit: string;
  };
}

export interface TransferAction {
  type: "Transfer";
  params: {
    deposit: string;
  };
}

export interface StakeAction {
  type: "Stake";
  params: {
    stake: string;
    publicKey: string;
  };
}

export type AddKeyPermission =
  | "FullAccess"
  | {
      receiverId: string;
      allowance?: string;
      methodNames?: Array<string>;
    };

export interface AddKeyAction {
  type: "AddKey";
  params: {
    publicKey: string;
    accessKey: {
      nonce?: number;
      permission: AddKeyPermission;
    };
  };
}

export interface DeleteKeyAction {
  type: "DeleteKey";
  params: {
    publicKey: string;
  };
}

export interface DeleteAccountAction {
  type: "DeleteAccount";
  params: {
    beneficiaryId: string;
  };
}

export type Action =
  | CreateAccountAction
  | DeployContractAction
  | FunctionCallAction
  | TransferAction
  | StakeAction
  | AddKeyAction
  | DeleteKeyAction
  | DeleteAccountAction;

export type ActionType = Action["type"];

export interface Transaction {
  signerId: string;
  receiverId: string;
  actions: Array<Action>;
}
