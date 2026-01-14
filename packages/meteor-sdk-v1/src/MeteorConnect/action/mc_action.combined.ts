import { MCNearActions } from "./mc_action.near.ts";

export const MCActionRegistryMap = {
  ...MCNearActions,
};

export type TMCActionRegistry = typeof MCActionRegistryMap;
