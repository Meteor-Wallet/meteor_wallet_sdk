import type { IMeteorConnectNetworkTarget, TMeteorConnection } from "./MeteorConnect.types.ts";

// export type TMCRequestId = "met_req:sign_in" | "met_req:sign_out";
export enum EMCRequestId {
  add_account = "add_account",
  remove_account = "remove_account",
}

export interface IMCRequest_Base<ID extends EMCRequestId> {
  id: ID;
  connection: TMeteorConnection;
}

export interface IMCRequest_Account_Base<ID extends EMCRequestId> extends IMCRequest_Base<ID> {
  networkTarget: IMeteorConnectNetworkTarget;
}

export interface IMCRequest_AddAccount extends IMCRequest_Account_Base<EMCRequestId.add_account> {}
export interface IMCRequest_RemoveAccount
  extends IMCRequest_Account_Base<EMCRequestId.remove_account> {}

export type TMCRequest = IMCRequest_AddAccount | IMCRequest_RemoveAccount;
