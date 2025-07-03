import Big from "big.js";
import { NearApiJsClient, getNearApi } from "../clients/near_api_js/NearApiJsClient";
import { ENearNetwork } from "../types/near_basic_types";
import {
  IOGetAccountState_Inputs,
  IOGetAccountState_Outputs,
} from "../types/services/account_service_types";
import { convertStorageToNearCost } from "../utils/near_storage_utils";

import { TypedError } from "@near-js/types";
import { TFRFailureDefaults } from "../../../modules_utility/api_utilities/task_function/TaskFunctionResponses";
import { ETaskFunctionEndId } from "../../../modules_utility/api_utilities/task_function/TaskFunctionTypes";
import { TaskFunctionError } from "../../../modules_utility/api_utilities/task_function/TaskFunctionUtils";

export class NearAccountService {
  nearApi: NearApiJsClient;

  constructor(network: ENearNetwork) {
    this.nearApi = getNearApi(network);
  }

  async getAccountState({
    accountId,
  }: IOGetAccountState_Inputs): Promise<IOGetAccountState_Outputs> {
    const account = await this.nearApi.nativeApi.account(accountId);

    try {
      const accountState = await account.state();

      const amount_usable: string = Big(accountState.amount)
        .minus(convertStorageToNearCost(accountState.storage_usage))
        .toFixed();

      return {
        ...accountState,
        amount_usable,
      };
    } catch (e: unknown) {
      console.error(e);
      if (e instanceof TypedError) {
        if (e.message.includes("does not exist")) {
          throw new TaskFunctionError(
            TFRFailureDefaults({
              endTags: ["AccountDoesNotExist", e.type],
              errorPayload: e,
              endId: ETaskFunctionEndId.NOT_FOUND,
              endMessage: "No Near account found for provided ID",
            }),
          );
        } else {
          throw new TaskFunctionError(
            TFRFailureDefaults({
              endTags: [e.type],
              errorPayload: e,
            }),
          );
        }
      }

      throw new TaskFunctionError(
        TFRFailureDefaults({
          errorPayload: e,
        }),
      );
    }
  }
}

const services: {
  [key in ENearNetwork]?: NearAccountService;
} = {};

export function getNearAccountService(network: ENearNetwork): NearAccountService {
  if (services[network] == null) {
    services[network] = new NearAccountService(network);
  }

  return services[network]!;
}
