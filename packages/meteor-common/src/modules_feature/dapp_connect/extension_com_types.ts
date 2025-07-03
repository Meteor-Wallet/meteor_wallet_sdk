import {
  IMeteorExtensionDirectAction_Input,
  TClientPostMessageResponse,
  TMeteorExtensionDirectAction_CheckSyncStatus_Input,
  TMeteorExtensionDirectAction_OpenPage_Input,
  TMeteorExtensionDirectAction_SyncAccounts_Input,
  TPostMessageSend,
} from "./types_dappConnect";

export interface IPageMeta {
  x: number;
  y: number;
  w: number;
  h: number;
  pageUri: string;
}

export interface IAction<I extends string, P> {
  action: I;
  params: P;
  pageMeta: IPageMeta;
}

export interface IDirectAction<
  P extends IMeteorExtensionDirectAction_Input<any, any> = IMeteorExtensionDirectAction_Input<
    any,
    any
  >,
> {
  action: "wallet_com_direct";
  params: P;
}

export type TWalletComDirectAction<P extends IMeteorExtensionDirectAction_Input<any, any>> =
  IDirectAction<P>;
export type TWalletComDirectAction_CheckPasswordHashesMatch =
  TWalletComDirectAction<TMeteorExtensionDirectAction_CheckSyncStatus_Input>;
export type TWalletComDirectAction_SyncAccounts =
  TWalletComDirectAction<TMeteorExtensionDirectAction_SyncAccounts_Input>;
export type TWalletComDirectAction_OpenPage =
  TWalletComDirectAction<TMeteorExtensionDirectAction_OpenPage_Input>;

export type TOpenPopup_Action = IAction<"open_popup", IPageMeta>;
export type TSendWalletCom = IAction<"wallet_com" | "wallet_com_client", TPostMessageSend>;
export type TResponseWalletCom = IAction<"wallet_com_response", TClientPostMessageResponse>;
