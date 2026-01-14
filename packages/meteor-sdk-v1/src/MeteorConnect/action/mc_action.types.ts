import type { PartialBy } from "../../ported_common/utils/special_typescript_types.ts";
import type {
  IMeteorConnectAccountIdentifier,
  IMeteorConnectNetworkTarget,
  TMeteorConnection,
} from "../MeteorConnect.types.ts";

export type TMCActionDomainId = "near";

export type TMCActionId<D extends TMCActionDomainId = TMCActionDomainId> = `${D}::${string}`;

export type TMCActionMetaAccount = "connected" | "new-connection";

export interface IMCActionMeta {
  account?: TMCActionMetaAccount;
}

export interface IMCActionSchema {
  input: Record<string, any>;
  output: Record<string, any>;
  meta?: IMCActionMeta;
  clientInput?: Record<string, any>;
}

// A helper type to convert your Registry into a Union of all possible requests
export type TMCActionRequestUnion<T extends Record<string, IMCActionSchema>> = {
  [K in keyof T]: {
    id: K;
    input: T[K]["input"];
  };
}[keyof T];

export interface IMCAction_Base<ID extends TMCActionId = TMCActionId> {
  actionId: ID;
}

export interface IMCActionDef<R extends IMCAction_Base, P> {
  request: R;
  outcome: P;
}

export interface IMCAction_WithConnection {
  connection: TMeteorConnection;
}

export interface IMCAction_WithNetworkTarget {
  target: IMeteorConnectNetworkTarget;
}

export interface IMCAction_WithOptionalAccountTarget {
  target: PartialBy<IMeteorConnectAccountIdentifier, "accountId">;
}

export interface IMCAction_WithExactAccountTarget {
  target: IMeteorConnectAccountIdentifier;
}
