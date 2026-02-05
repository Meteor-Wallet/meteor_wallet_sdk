import type {
  IMeteorConnection_V1_Ext,
  IMeteorConnection_V1_Web,
  IMeteorConnection_V1_Web_Localhost,
} from "../../MeteorConnect.types";

export type TMeteorConnectV1ExecutionTargetConfig =
  | IMeteorConnection_V1_Web
  | IMeteorConnection_V1_Web_Localhost
  | IMeteorConnection_V1_Ext;
