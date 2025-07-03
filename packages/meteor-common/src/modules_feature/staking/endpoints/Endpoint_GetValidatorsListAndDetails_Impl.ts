import { KitWallet_HttpClient } from "../../../modules_external/kit_wallet/clients/KitWallet_HttpClient";
import { TFRSuccessPayload } from "../../../modules_utility/api_utilities/task_function/TaskFunctionResponses";
import { TFRPromise } from "../../../modules_utility/api_utilities/task_function/TaskFunctionTypes";
import { getTokenPriceListFromRefFinance } from "../../fungible_tokens/fungible_tokens_async_functions";
import { staking_async_function } from "../staking_async_functions";
import { TIOGetValidatorsListAndDetails_Output, TValidatorDetails } from "../staking_types";
import { getValidatorDetails } from "./Endpoint_GetValidatorDetails_Impl";
import { Endpoint_GetValidatorsListAndDetails } from "./Endpoint_GetValidatorsListAndDetails";

Endpoint_GetValidatorsListAndDetails.implement(
  async (
    { accountId, network },
    { plugins: {} },
  ): TFRPromise<TIOGetValidatorsListAndDetails_Output> => {
    // Step 1: Get List of Validators.
    // Step 2: Using Near API JS, get list of current active validators
    // Step 3: Get token price list
    const kitwWallet = KitWallet_HttpClient.getInstance(network);
    const getValidatorsListAndStatus = await Promise.all([
      kitwWallet.getStakingPools(),
      staking_async_function.getRecentEpochValidatorsInfo({ network }),
      getTokenPriceListFromRefFinance({ network }),
    ]);

    // Step 3: Start mapping validatos with their status
    const validatorsList = getValidatorsListAndStatus[0];
    const { current_validators } = getValidatorsListAndStatus[1];
    const tokenPriceList = getValidatorsListAndStatus[2];

    // Step 4: Map through all validators and build TValidatorDetails
    const validatorDetails = (
      await Promise.all(
        validatorsList.map(async (validatorId) =>
          getValidatorDetails({
            accountId,
            network,
            validatorId,
            currentActiveValidators: current_validators,
            tokenPriceList,
          }),
        ),
      )
    ).filter((v) => v !== undefined) as TValidatorDetails[];

    validatorDetails.sort((first, second) => {
      if (first.isActive !== second.isActive) {
        return Number(second.isActive) - Number(first.isActive);
      } else if (first.apy !== second.apy) {
        return Number(second.apy) - Number(first.apy);
      } else {
        return parseFloat(first.stakedNearAmount) - parseFloat(second.stakedNearAmount);
      }
    });

    return TFRSuccessPayload(validatorDetails);
  },
);

export const Endpoint_GetValidatorsListAndDetails_Impl = Endpoint_GetValidatorsListAndDetails;
