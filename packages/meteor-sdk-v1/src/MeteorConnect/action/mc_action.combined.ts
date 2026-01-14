import {
  type IMCActionDef_Near_SignIn,
  type IMCActionDef_Near_SignMessage,
  type IMCActionDef_Near_SignOut,
  MCNearActions,
} from "./mc_action.near.ts";

export type TMCActionDefinition =
  | IMCActionDef_Near_SignIn
  | IMCActionDef_Near_SignOut
  | IMCActionDef_Near_SignMessage;

export const MCActionRegistryMap = {
  ...MCNearActions,
};

export type TMCActionRegistry = typeof MCActionRegistryMap;
