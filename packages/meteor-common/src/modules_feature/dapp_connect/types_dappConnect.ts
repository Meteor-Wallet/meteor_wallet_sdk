import { KeyPair, KeyType } from "@near-js/crypto";
import { Transaction as NearFullTransaction } from "@near-js/transactions";
import { FinalExecutionOutcome } from "@near-js/types";
import { Action, Optional, Transaction } from "@near-wallet-selector/core";
import { z } from "zod";
import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";
import { PartialBy } from "../../modules_utility/typescript_utils/special_types";
import { IAccount_Old } from "../accounts/account_types";
import {
  EDappActionErrorTag,
  getExternalActionErrorMessageForEndTag,
} from "./error_handling_dappConnect";
import {
  ZO_DappSignInAction_AllMethods,
  ZO_DappSignInAction_SelectedMethods,
} from "./validation_dappConnect";

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

export enum EExternalActionType {
  login = "login",
  sign = "sign",
  logout = "logout",
  verify_owner = "verify_owner",
  keypom_claim = "keypom_claim",
  sign_message = "sign_message",
}

export enum EMeteorWalletSignInType {
  ALL_METHODS = "ALL_METHODS",
  SELECTED_METHODS = "SELECTED_METHODS",
  FULL_ACCESS = "FULL_ACCESS",
}

export enum EWalletExternalAction_SignIn_AccessType {
  FULL_ACCESS = "fullAccess",
  LIMITED_ACCESS = "limitedAccess",
}

export enum EWalletExternalActionStatus {
  UNCONFIRMED = "UNCONFIRMED",
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILURE = "FAILURE",
}

/*export interface IWalletExternalAction_Login {
  success_url?: string;
  failure_url?: string;
  contract_id: string;
  public_key: string;
}*/

/*interface IWalletExternalAction_SignIn_Processed {
  accessType: EWalletExternalAction_SignIn_AccessType;
}*/

export type TMeteorWalletExternalAction_SignIn_AllMethods = z.infer<
  typeof ZO_DappSignInAction_AllMethods
>;
export type TMeteorWalletExternalAction_SignIn_SelectedMethods = z.infer<
  typeof ZO_DappSignInAction_SelectedMethods
>;
// export type TWalletExternalAction_SignIn = z.infer<typeof ZO_MeteorSignInAction_Combined>;
export type TDappAction_SignIn_Data =
  | TMeteorWalletExternalAction_SignIn_AllMethods
  | TMeteorWalletExternalAction_SignIn_SelectedMethods;

// export type TNearTransactionBase = Omit<
//   NearFullTransaction,
//   "nonce" | "publicKey" | "blockHash" | "encode"
// >;

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

export interface IODappAction_PostMessage_SignTransactions_Input {
  transactions: string;
}

export interface ITransactionHashOutput {
  hash: string;
  nonceString: string;
}

export interface IODappAction_PostMessage_SignTransactions_Output {
  // transactionHashes: ITransactionHashOutput[];
  executionOutcomes: FinalExecutionOutcome[];
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

export interface IORequestSignTransactions_Inputs {
  /** list of transactions to sign */
  transactions: Array<Optional<Transaction, "signerId">>;
}

export interface IDappAction_SignTransactions_Data {
  status: EWalletExternalActionStatus;
  transactions: NearFullTransaction[];
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

export type TMinimalCheckAccount = Pick<IAccount_Old, "id" | "network" | "label">;

export type TMeteorExtensionDirectAction_CheckSyncStatus_Input = IMeteorExtensionDirectAction_Input<
  EMeteorExtensionDirectActionType.check_sync_status,
  {
    hash: string;
    checkAccounts: TMinimalCheckAccount[];
  }
>;

export interface IAccountSyncStatus {
  extMissing: TMinimalCheckAccount[];
  webMissing: TMinimalCheckAccount[];
}

export interface IMeteorExtensionDirectAction_CheckSyncStatus_Output {
  matched: boolean;
  accountSync: IAccountSyncStatus;
}

export type TMeteorExtensionDirectAction_SyncAccounts_Input = IMeteorExtensionDirectAction_Input<
  EMeteorExtensionDirectActionType.sync_accounts,
  {
    passwordHash: string;
    accounts: IAccount_Old[];
  }
>;

export interface IMeteorExtensionDirectAction_SyncAccounts_Output {
  accounts: IAccount_Old[];
  success: boolean;
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

export enum EMeteorInjectedFeature {
  open_page = "open_page",
  batch_import = "batch_import",
  sync_check = "sync_check",
  account_sync = "account_sync",
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

export enum EDappActionSource {
  website_callback = "wcb",
  website_post_message = "wpm",
  website_visit = "wv",
  extension_injected = "ext",
}

export enum EDappActionConnectionStatus {
  initializing = "initializing",
  connected = "connected",
  attempting_reconnect = "attempting_reconnect",
  disconnected = "disconnected",
  closed_success = "closed_success",
  closed_fail = "closed_fail",
  closed_window = "closed_window",
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
