import type {
  IMeteorConnectAccount,
  IMeteorConnectAccountIdentifier,
  IMeteorConnectNetworkTarget,
} from "../MeteorConnect.types.ts";
import type { IMCAction_Base, IMCAction_WithConnection, IMCActionDef } from "./mc_action.types.ts";

export interface IMCAction_Near_SignIn
  extends IMCAction_Base<"near::sign_in">,
    IMCAction_WithConnection {
  networkTarget: IMeteorConnectNetworkTarget;
}

export interface IMCAction_Near_SignOut extends IMCAction_Base<"near::sign_out"> {
  accountIdentifier: IMeteorConnectAccountIdentifier;
}

export interface IMCActionDef_Account_SignIn
  extends IMCActionDef<IMCAction_Near_SignIn, IMeteorConnectAccount> {}

export interface IMCActionDef_Account_SignOut
  extends IMCActionDef<IMCAction_Near_SignOut, IMeteorConnectAccountIdentifier> {}
