import type {
  IMCActionDef_Near_SignIn,
  IMCActionDef_Near_SignMessage,
  IMCActionDef_Near_SignOut,
} from "./mc_action.near.types.ts";

export type TMCActionDefinition =
  | IMCActionDef_Near_SignIn
  | IMCActionDef_Near_SignOut
  | IMCActionDef_Near_SignMessage;
