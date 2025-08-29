import { KeyPair, KeyType } from "@near-js/crypto";
import {
  DelegateAction,
  Transaction as NearFullTransaction,
  SignedDelegate,
  SignedTransaction,
} from "@near-js/transactions";
import type { FinalExecutionOutcome } from "@near-js/types";
import type { Action, Optional, Transaction } from "@near-wallet-selector/core";
import { z } from "zod";
import { ENearNetwork } from "../near/near_basic_types.ts";
import type { PartialBy } from "../utils/special_typescript_types.ts";
import {
  EDappActionConnectionStatus,
  EDappActionSource,
  EExternalActionType,
  EMeteorInjectedFeature,
  EMeteorWalletSignInType,
  EWalletExternalActionStatus,
} from "./dapp.enums.ts";
import { EDappActionErrorTag, getExternalActionErrorMessageForEndTag } from "./dapp.errors.ts";
import {
  ZO_DappSignInAction_AllMethods,
  ZO_DappSignInAction_SelectedMethods,
} from "./dapp.validation.ts";

export interface IRejectReason {
  message: string;
  endTags: (EDappActionErrorTag | string)[];
}

export class MeteorActionError extends Error {
  _reason: IRejectReason;
  cause?: Error;

  constructor(reason: PartialBy<IRejectReason, "message">, previousError?: Error) {
    super();

    if (reason.message == null) {
      reason.message = getExternalActionErrorMessageForEndTag(
        reason.endTags?.[reason.endTags.length - 1] ?? "unknown",
      );
    }

    this._reason = reason as IRejectReason;
    this.message = reason.message;
    this.name = "MeteorActionError";
    this.cause = previousError;
  }
}

export type TMeteorWalletExternalAction_SignIn_AllMethods = z.infer<
  typeof ZO_DappSignInAction_AllMethods
>;

export type TMeteorWalletExternalAction_SignIn_SelectedMethods = z.infer<
  typeof ZO_DappSignInAction_SelectedMethods
>;

export type TDappAction_SignIn_Data =
  | TMeteorWalletExternalAction_SignIn_AllMethods
  | TMeteorWalletExternalAction_SignIn_SelectedMethods;

export interface IOMeteorWalletSdk_RequestSignIn_Inputs {
  keyPair?: KeyPair;
  type: EMeteorWalletSignInType;
  methods?: string[];
  contract_id: string;
}

export interface IODappAction_SignMessage_Input {
  message: string;
  nonce:
    | Buffer
    | {
        [key: number]: number;
      };
  recipient: string;
  callbackUrl?: string;
  state?: string;
  accountId?: string;
}

export interface IODappAction_SignMessage_Output {
  accountId: string;
  publicKey: string;
  signature: string;
  state?: string;
}

export interface IOMeteorWalletSdkAccount_SignAndSendTransaction_Input {
  receiverId: string;
  actions: Action[];
}

export interface IWithCallbackUrl {
  callback_url: string;
}

export interface IOMeteorWalletSdk_SignIn_Output {
  accessKey: KeyPair;
  accountId: string;
}

export interface IODappAction_PostMessage_SignIn_Output {
  accountId: string;
  allKeys: string[];
}

export interface IODappAction_VerifyOwner_Input {
  message: string;
  accountId?: string;
}

export interface IODappAction_VerifyOwner_Output {
  accountId: string;
  message: string;
  blockId: string;
  publicKey: string;
  signature: string;
  keyType: KeyType;
}

/**
 * Sign and publish transactions
 */
export interface IODappAction_PostMessage_SignTransactions_Input {
  transactions: string;
}

export interface IODappAction_PostMessage_SignTransactions_Output {
  executionOutcomes: FinalExecutionOutcome[];
}

export interface IOMeteorRequest_SignTransactions_Inputs {
  /** list of transactions to sign */
  transactions: Array<Optional<Transaction, "signerId">>;
}

/**
 * Just sign transactions, don't publish them
 */

export interface IOMeteorRequest_SignTransactionsNoPublish_Inputs {
  /** list of transactions to sign */
  transactions: Optional<NearFullTransaction, "signerId">[];
}

/**
 * Create signed transactions (no publish)
 */
export interface IDappAction_CreateSignedTransactionItem {
  receiverId: string;
  // base64 encoded
  actions: string[];
}

export interface IODappAction_PostMessage_CreateSignTransactions_Input {
  transactionsToCreate: IDappAction_CreateSignedTransactionItem[];
}

export interface IODappAction_PostMessage_CreateSignTransactions_Output {
  transactions: string[];
}

export interface ICreateSignedTransactionItem {
  receiverId: string;
  // base64 encoded
  actions: Action[];
}

export interface IOMeteorRequest_CreateSignedTransactions_Input {
  transactionsToCreate: ICreateSignedTransactionItem[];
}

export interface IOMeteorRequest_CreateSignedTransactions_Output {
  transactions: SignedTransaction[];
}

/**
 * Sign Delegate Action
 */
export interface IODappAction_PostMessage_SignDelegate_Input {
  // base64 encoded delegate actions
  delegateActions: string;
}

export interface IDappAction_SignedDelegate {
  // base64 encoded
  hash: string;
  // borsh encoded and base64
  signedDelegate: string;
}

export interface IODappAction_PostMessage_SignDelegate_Output {
  signedDelegateActions: IDappAction_SignedDelegate[];
}

export interface IOMeteorRequest_SignDelegate_Input {
  delegateActions: DelegateAction[];
}

interface IMeteorRequest_SignDelegate_Output {
  // base64 encoded
  hash: Uint8Array;
  // borsh encoded
  signedDelegate: SignedDelegate;
}

export interface IOMeteorRequest_SignDelegate_Output {
  signedDelegateActions: IMeteorRequest_SignDelegate_Output[];
}

/**
 * Information to send NEAR wallet for signing transactions and redirecting the browser back to the calling application
 */
export interface IORequestSignTransactionsRedirect_Inputs {
  /** list of transactions to sign */
  transactions: Transaction[];
  /** url NEAR Wallet will redirect to after transaction signing is complete */
  callback_url?: string;
  /** meta information NEAR Wallet will send back to the application. `meta` will be attached to the `callbackUrl` as a url search param */
  meta?: string;
}

export interface IDappAction_SignTransactions_Data {
  status: EWalletExternalActionStatus;
  transactions: NearFullTransaction[];
}

export interface IDappAction_SignDelegateActions_HydratedData {
  delegateActions: DelegateAction[];
}

export interface IOWalletExternalLinkedContract {
  contract_id: string;
  public_key: string;
}

export interface IDappAction_Logout_Data {
  accountId: string;
  contractInfo: IOWalletExternalLinkedContract;
}

export type TMeteorComListener<D> = (data: D) => void;

export enum EMeteorExtensionDirectActionType {
  check_sync_status = "check_sync_status",
  sync_accounts = "sync_accounts",
  open_page = "open_page",
}

export interface IMeteorExtensionDirectAction_Input<A extends EMeteorExtensionDirectActionType, I> {
  actionType: A;
  inputs: I;
}

export type TMeteorExtensionDirectAction_OpenPage_Input = IMeteorExtensionDirectAction_Input<
  EMeteorExtensionDirectActionType.open_page,
  {
    path: string;
    queryParams: object;
    hash: string;
  }
>;

export interface IMeteorExtensionDirectAction_OpenPage_Output {
  opened: boolean;
}

export interface IMeteorComInjectedObject {
  sendMessageData: (data: any) => void;
  addMessageDataListener: (listener: TMeteorComListener<any>) => void;
  directAction: <
    I extends IMeteorExtensionDirectAction_Input<any, any> = IMeteorExtensionDirectAction_Input<
      any,
      any
    >,
    O = any,
  >(
    data: I,
  ) => Promise<O>;
  features?: EMeteorInjectedFeature[];
}

export interface IExternalAction_Base {
  uid: string;
  connectionStatus: EDappActionConnectionStatus;
  source: EDappActionSource;
  network: ENearNetwork;
  referrerHost?: string;
  referrerOrigin?: string;
  referrerFull?: string;
}

export interface IDappAction_Login extends IExternalAction_Base {
  actionType: EExternalActionType.login;
  inputs: TDappAction_SignIn_Data;
  // login: TMeteorWalletExternalAction_SignIn_Data;
  // sign?: undefined;
}

export interface IDappAction_SignMessage extends IExternalAction_Base {
  actionType: EExternalActionType.sign_message;
  inputs: IODappAction_SignMessage_Input;
}

export interface IDappAction_SignTransaction extends IExternalAction_Base {
  actionType: EExternalActionType.sign;
  inputs: IDappAction_SignTransactions_Data;
  callbackUrl?: string;
  meta?: string;
  // login?: undefined;
  // sign?: IMeteorWalletExternalAction_SignTransactions_Data;
}

export interface IDappAction_Logout extends IExternalAction_Base {
  actionType: EExternalActionType.logout;
  inputs: IDappAction_Logout_Data;
}

export interface IDappAction_VerifyOwner extends IExternalAction_Base {
  actionType: EExternalActionType.verify_owner;
  inputs: IODappAction_VerifyOwner_Input;
}

export interface IDappAction_CreateSignedTransaction extends IExternalAction_Base {
  actionType: EExternalActionType.create_signed_transaction;
  inputs: IODappAction_PostMessage_CreateSignTransactions_Input;
}

export interface IDappAction_SignDelegateAction extends IExternalAction_Base {
  actionType: EExternalActionType.sign_delegate_action;
  inputs: IDappAction_SignDelegateActions_HydratedData;
}

export interface IDappAction_SignTransactionNoPublish extends IExternalAction_Base {
  actionType: EExternalActionType.sign_transaction_no_publish;
  inputs: IODappAction_PostMessage_SignTransactions_Input;
}

export type TKeypomAction_Claim_Data = {
  contractId: string;
  privKey: string;
  redirectUrl?: string;
};

export interface IKeypomAction_Claim extends IExternalAction_Base {
  actionType: EExternalActionType.keypom_claim;
  inputs: TKeypomAction_Claim_Data;
}

export type TExternalAction =
  | IDappAction_Login
  | IDappAction_SignMessage
  | IDappAction_SignTransaction
  | IDappAction_Logout
  | IDappAction_VerifyOwner
  | IDappAction_CreateSignedTransaction
  | IDappAction_SignDelegateAction
  | IDappAction_SignTransactionNoPublish
  | IKeypomAction_Claim;

export type IMeteorActionResponse_Output<T> =
  | {
      success: true;
      payload: T;
      message?: string;
      endTags: string[];
    }
  | {
      success: false;
      payload?: undefined;
      message: string;
      endTags: string[];
    };

export interface IPostMessageConnection {
  uid: string;
  actionType: EExternalActionType;
  status: EDappActionConnectionStatus;
  promise: Promise<IMeteorActionResponse_Output<any>>;
  resolve: (output: IMeteorActionResponse_Output<any>) => void;
  reject: (reason: MeteorActionError) => void;
  currentPayload: any;
  endTags: (string | EDappActionErrorTag)[];
  inputs: any;
  lastAttemptedConnection: number;
  lastConnection: number;
  network: ENearNetwork;
}

export type TPostMessageSend = Pick<
  IPostMessageConnection,
  "uid" | "status" | "actionType" | "endTags" | "network"
> & {
  tabId?: number;
  inputs?: any;
};

export type TClientPostMessageResponse = Pick<
  IPostMessageConnection,
  "uid" | "status" | "endTags"
> & {
  tabId?: number;
  payload?: any;
};

export type TReferrerBits =
  | {
      knownRef: true;
      referrerHost: string;
      referrerOrigin: string;
      referrerFull: string;
    }
  | {
      knownRef: false;
      referrerHost?: string;
      referrerOrigin?: string;
      referrerFull?: string;
    };
