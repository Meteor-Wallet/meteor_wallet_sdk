import { EMCActionId, type TMCActionResponse } from "../../MeteorConnect.action.types.ts";
import type {
  IMeteorConnect_TargetClient,
  IMeteorConnectAccountIdentifier,
} from "../../MeteorConnect.types.ts";
import { createFakeAccount } from "./utils/testClientFakeData.ts";

export class MeteorConnectTestClient implements IMeteorConnect_TargetClient {
  async makeRequest<R extends TMCActionResponse = TMCActionResponse>(
    request: R["request"],
  ): Promise<R> {
    if (request.actionId === EMCActionId.account_sign_out) {
      const accountIdentifier: IMeteorConnectAccountIdentifier = {
        accountId: request.accountId!,
        ...request.networkTarget,
      };

      return {
        request,
        responsePayload: accountIdentifier,
      } as R;
    }

    if (request.actionId === EMCActionId.account_sign_in) {
      return {
        request,
        responsePayload: createFakeAccount(request.networkTarget, request.connection),
      } as R;
    }

    throw new Error(`MeteorConnectTestClient: Action ID [${request["actionId"]}] not implemented`);
  }
}
