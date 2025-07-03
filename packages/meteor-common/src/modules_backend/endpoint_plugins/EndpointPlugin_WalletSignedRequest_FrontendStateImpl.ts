import { z } from "zod";
import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";
import { account_async_functions } from "../../modules_feature/accounts/account_async_functions";
import { IPluginStateImplementation } from "../../modules_utility/api_utilities/endpoints/ApiRunnerClient";
import { TFRFailure } from "../../modules_utility/api_utilities/task_function/TaskFunctionResponses";
import { ETaskFunctionEndId } from "../../modules_utility/api_utilities/task_function/TaskFunctionTypes";
import { TaskFunctionError } from "../../modules_utility/api_utilities/task_function/TaskFunctionUtils";
import { ZodUtils } from "../../modules_utility/validation/ZodUtils";
import { EndpointPlugin_WalletSignedRequest } from "./EndpointPlugin_WalletSignedRequest";

const walletSignedExtrasValidation = z.object({
  accountId: z.string(),
  network: z.nativeEnum(ENearNetwork),
});

export const EndpointPlugin_WalletSignedRequest_FrontendStateImpl: IPluginStateImplementation<
  typeof EndpointPlugin_WalletSignedRequest
> = {
  plugin: EndpointPlugin_WalletSignedRequest,
  setState: async ({ actionInputs }) => {
    console.log("Should be creating plugin input for wallet signed request", actionInputs);

    const parsedWalletExtras = walletSignedExtrasValidation.safeParse(actionInputs);

    if (parsedWalletExtras.success) {
      return {
        signedInputs: await account_async_functions.signRequestInputs({
          inputs: actionInputs,
          receiver: "meteorwallet.app",
          network: parsedWalletExtras.data.network,
          accountId: parsedWalletExtras.data.accountId,
        }),
      };
    } else {
      throw new TaskFunctionError(
        TFRFailure(
          ETaskFunctionEndId.DATA_VALIDATION_FAILED,
          `Sending a request with the WalletSignedRequest plugin- needs to include "accountId" and "network" in input arguments: ${ZodUtils.niceErrorMessage(
            parsedWalletExtras.error,
          )}`,
        ),
      );
    }
  },
};
