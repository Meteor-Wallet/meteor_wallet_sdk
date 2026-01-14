import type { TMCActionDefinition } from "../../action/mc_action.combined.types.ts";
import { MeteorConnectClientBase } from "../base/MeteorConnectClientBase.ts";
import { createFakeAccount } from "./utils/testClientFakeData.ts";

export class MeteorConnectTestClient extends MeteorConnectClientBase {
  clientName = "MeteorConnect TEST Client";

  async resolveRequest<R extends TMCActionDefinition = TMCActionDefinition>(
    request: R["request"],
  ): Promise<R["response"]> {
    if (request.actionId === "near::sign_in") {
      return createFakeAccount(request.target, request.connection);
    }

    if (request.actionId === "near::sign_out") {
      return request.target as R["response"];
    }

    throw new Error(`MeteorConnectTestClient: Action ID [${request["actionId"]}] not implemented`);
  }
}
