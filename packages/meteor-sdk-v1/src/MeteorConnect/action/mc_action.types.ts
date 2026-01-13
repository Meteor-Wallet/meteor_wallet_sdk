import type { TMeteorConnection } from "../MeteorConnect.types.ts";

export interface IMCAction_Base<ID extends string> {
  actionId: ID;
}

export interface IMCActionDef<R, P> {
  request: R;
  responsePayload: P;
}

export interface IMCAction_WithConnection {
  connection: TMeteorConnection;
}
