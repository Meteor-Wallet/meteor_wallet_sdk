import type { PartialBy } from "../../ported_common/utils/special_typescript_types";
import type {
  IMeteorConnectAccount,
  IMeteorConnectAccountIdentifier,
  IMeteorConnectNetworkTarget,
} from "../MeteorConnect.types.ts";

export type TMCActionDomainId = "near";

export type TMCActionId<D extends TMCActionDomainId = TMCActionDomainId> = `${D}::${string}`;

export type TMCActionInputTransform = "targeted_account" | "custom_expansion";
export type TMCActionExecutionTargetSource = "on_execution" | "targeted_account";

export interface IMCActionMeta {
  inputTransform?: TMCActionInputTransform[];
  executionTargetSource?: TMCActionExecutionTargetSource;
}

export interface IMCActionSchema {
  input: Record<string, any>;
  output: Record<string, any>;
  expandedInput: Record<string, any>;
  meta?: IMCActionMeta;
  // clientOutput?: Record<string, any>;
}

// A helper type to convert your Registry into a Union of all possible requests
export type TMCActionRequestUnion<T extends Record<string, IMCActionSchema>> = {
  [K in keyof T]: {
    id: K;
    input: T[K]["input"];
  };
}[keyof T];

export type TMCActionRequestUnionExpandedInput<T extends Record<string, IMCActionSchema>> = {
  [K in keyof T]: {
    id: K;
    expandedInput: T[K]["expandedInput"];
  };
}[keyof T];

// export interface IMCAction_WithConnection {
//   connection: TMeteorConnectionTarget;
// }

export interface IMCAction_WithNetworkTarget {
  target: IMeteorConnectNetworkTarget;
}

export interface IMCAction_WithOptionalAccountTarget {
  target: PartialBy<IMeteorConnectAccountIdentifier, "accountId">;
}

export interface IMCAction_WithExactAccountTarget {
  target: IMeteorConnectAccountIdentifier;
}

export interface IMCAction_WithFullAccount {
  account: IMeteorConnectAccount;
}
