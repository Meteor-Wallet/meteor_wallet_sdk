import { KeyPair, KeyType } from "@near-js/crypto";
import {
  DelegateAction,
  Transaction as NearFullTransaction,
  SignedDelegate,
} from "@near-js/transactions";
import type { FinalExecutionOutcome } from "@near-js/types";
import type { Action, Transaction as WalletSelectorTransaction } from "@near-wallet-selector/core";
import { z } from "zod";
import type { TSimpleNearDelegateAction } from "../../MeteorConnect/action/mc_action.near";
import type { TMeteorConnectV1ExecutionTargetConfig } from "../../MeteorConnect/target_clients/v1_client/MeteorConnectV1Client.types";
import { ENearNetwork } from "../near/near_basic_types";
import type { PartialBy } from "../utils/special_typescript_types";
import {
  EDappActionConnectionStatus,
  EDappActionSource,
  EExternalActionType,
  EMeteorInjectedFeature,
  EMeteorWalletSignInType,
  EWalletExternalActionStatus,
} from "./dapp.enums";
import { EDappActionErrorTag, getExternalActionErrorMessageForEndTag } from "./dapp.errors";
import {
  ZO_DappSignInAction_AllMethods,
  ZO_DappSignInAction_SelectedMethods,
} from "./dapp.validation";

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
  transactions: WalletSelectorTransaction[];
  /** url NEAR Wallet will redirect to after transaction signing is complete */
  callback_url?: string;
  /** meta information NEAR Wallet will send back to the application. `meta` will be attached to the `callbackUrl` as a url search param */
  meta?: string;
}

export type TMeteorSdkV1Transaction = Omit<WalletSelectorTransaction, "signerId">;

export interface IORequestSignTransactions_Inputs {
  /** list of transactions to sign */
  transactions: TMeteorSdkV1Transaction[];
}

export interface IDappAction_SignTransactions_Data {
  status: EWalletExternalActionStatus;
  transactions: NearFullTransaction[];
}

/* DELEGATE ACTION SIGNING */

export interface IORequestSignDelegateActions_Input {
  /** list of delegate actions to sign */
  delegateActions: TSimpleNearDelegateAction[];
}

export interface ISignDelegateActionReturn {
  delegateHash: Uint8Array;
  signedDelegate: SignedDelegate;
}

export interface IORequestSignDelegateActions_Output {
  signedDelegatesWithHashes: ISignDelegateActionReturn[];
}

export interface IDappAction_SignDelegateActions_Data {
  delegateActions: DelegateAction[];
}

export interface ISignedDelegateWithHash {
  delegateHash: Uint8Array;
  signedDelegate: SignedDelegate;
}

export interface IODappAction_PostMessage_SignDelegateActions_Input {
  delegateActions: string;
}

export interface ISerializedSignedDelegateWithHashes {
  // base64 encoded hash
  delegateHash: string;
  // base64 encoding of the borsh serialized `SignedDelegateAction`
  signedDelegateAction: string;
}

export interface IODappAction_PostMessage_SignDelegateActions_Output {
  signedDelegatesWithHashes: ISerializedSignedDelegateWithHashes[];
}

// ---------------------------

export interface IOWalletExternalLinkedContract {
  contract_id: string;
  public_key: string;
}

export interface IDappAction_Logout_Data {
  accountId: string;
  contractInfo: IOWalletExternalLinkedContract;
}

export type TMeteorComListener<D> = (data?: D) => void;

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

export interface IMeteorComInjectedObjectV2 {
  version: "v2";
  sendMessageDataAndRespond: (data: any) => Promise<TClientPostMessageResponse>;
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
}

export interface IDappAction_Logout extends IExternalAction_Base {
  actionType: EExternalActionType.logout;
  inputs: IDappAction_Logout_Data;
}

export interface IDappAction_VerifyOwner extends IExternalAction_Base {
  actionType: EExternalActionType.verify_owner;
  inputs: IODappAction_VerifyOwner_Input;
}

export interface IDappAction_SignDelegateActions extends IExternalAction_Base {
  actionType: EExternalActionType.sign_delegate_actions;
  inputs: IDappAction_SignDelegateActions_Data;
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
  forceExecutionTargetConfig?: TMeteorConnectV1ExecutionTargetConfig;
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
