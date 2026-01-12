import type {
  IMeteorConnectAccount,
  IMeteorConnectAccountIdentifier,
  IMeteorConnectNetworkTarget,
  TMeteorConnection,
} from "./MeteorConnect.types.ts";

// export type TMCRequestId = "met_req:sign_in" | "met_req:sign_out";
export enum EMCActionId {
  account_sign_in = "account_sign_in",
  account_sign_out = "account_sign_out",
}

export interface IMCRequest_Base<ID extends EMCActionId> {
  actionId: ID;
  connection: TMeteorConnection;
}

export interface IMCRequest_Account_Base<ID extends EMCActionId> extends IMCRequest_Base<ID> {
  networkTarget: IMeteorConnectNetworkTarget;
}

export interface IMCRequest_Account_SignIn
  extends IMCRequest_Account_Base<EMCActionId.account_sign_in> {}

export interface IMCRequest_Account_SignOut
  extends IMCRequest_Account_Base<EMCActionId.account_sign_out> {
  accountIdentifier?: IMeteorConnectAccountIdentifier;
}

export type TMCActionRequest = IMCRequest_Account_SignIn | IMCRequest_Account_SignOut;

export interface IMCActionResponse<R extends TMCActionRequest, P> {
  request: R;
  responsePayload: P;
}

export interface IMCResponse_Account_SignIn
  extends IMCActionResponse<IMCRequest_Account_SignIn, IMeteorConnectAccount> {}

export interface IMCResponse_Account_SignOut
  extends IMCActionResponse<IMCRequest_Account_SignOut, IMeteorConnectAccountIdentifier> {}

export type TMCActionResponse = IMCResponse_Account_SignIn | IMCResponse_Account_SignOut;
