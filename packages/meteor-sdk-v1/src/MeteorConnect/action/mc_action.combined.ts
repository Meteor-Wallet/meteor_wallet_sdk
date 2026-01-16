import { MCNearActions } from "./mc_action.near.ts";
import type { TMCActionRequestUnionExpandedInput } from "./mc_action.types.ts";

export const MCActionRegistryMap = {
  ...MCNearActions,
};

export type TMCActionRegistry = typeof MCActionRegistryMap;

export type TMCActionOutput<R extends TMCActionRequestUnionExpandedInput<TMCActionRegistry>> =
  TMCActionRegistry[R["id"]]["output"];
