import type { PartialBy } from "../../ported_common/utils/special_typescript_types.ts";
import type {
  IMeteorConnectAccountIdentifier,
  IMeteorConnectNetworkTarget,
  TMeteorConnection,
} from "../MeteorConnect.types.ts";

export type TMCActionDomainId = "near";

export type TMCActionId = `${TMCActionDomainId}::${string}`;

export interface IMCAction_Base<ID extends TMCActionId = TMCActionId> {
  actionId: ID;
}

export interface IMCActionDef<R extends IMCAction_Base, P> {
  request: R;
  response: P;
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
