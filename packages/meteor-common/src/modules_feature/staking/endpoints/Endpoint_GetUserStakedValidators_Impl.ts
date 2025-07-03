import { fromYoctoNear } from "../../../modules_external/near/utils/near_formatting_utils";
import { TFRSuccessPayload } from "../../../modules_utility/api_utilities/task_function/TaskFunctionResponses";
import {
  getFungibleTokenMetadata,
  getTokenPriceListFromRefFinance,
} from "../../fungible_tokens/fungible_tokens_async_functions";
import { staking_async_function } from "../staking_async_functions";
import { EValidatorVersion, TStakedValidator, TUnclaimedTokenReward } from "../staking_types";
import { Endpoint_GetUserStakedValidators } from "./Endpoint_GetUserStakedValidators";
import { getValidatorDetails } from "./Endpoint_GetValidatorDetails_Impl";

Endpoint_GetUserStakedValidators.implement(async ({ accountId, network }, { plugins: {} }) => {
  const preRequests = await Promise.all([
    staking_async_function.getRecentEpochValidatorsInfo({ network }),
    getTokenPriceListFromRefFinance({ network }),
    staking_async_function.getStakedValidators({
      network,
      accountId,
    }),
  ]);
  const current_validators = preRequests[0].current_validators;
  const tokenPriceList = preRequests[1];
  const stakedValidators = preRequests[2].map((validator) => ({
    ...validator,
    validatorId: validator.validator_id,
  }));

  let promises = stakedValidators.map(
    async (validator: TStakedValidator): Promise<TStakedValidator> => {
      const input = {
        accountId: accountId,
        network: network,
        ...validator,
      };
      let unclaimedTokenRewards: TUnclaimedTokenReward[] = [];

      // Step 1: Get Validator Details
      const validatorDetails = await getValidatorDetails({
        accountId,
        network,
        validatorId: validator.validatorId,
        currentActiveValidators: current_validators,
        tokenPriceList,
      });

      // Step 2: If it is farm, get unclaimed rewards
      if (
        validatorDetails.validatorVersion === EValidatorVersion.farming &&
        validatorDetails.farms
      ) {
        const rewardDetailsPromises = await Promise.all([
          Promise.all(
            validatorDetails.farms.map((farm) =>
              staking_async_function.getUnclaimedReward({
                accountId,
                network,
                validatorId: validator.validatorId,
                farmId: farm.farm_id,
              }),
            ),
          ),
          Promise.all(
            validatorDetails.farms.map((farm) =>
              getFungibleTokenMetadata({
                contractId: farm.token_id,
                network,
              }),
            ),
          ),
        ]);

        // @ts-ignore
        unclaimedTokenRewards = validatorDetails.farms.map((farm, index) => ({
          ...rewardDetailsPromises[1][index],
          reward: rewardDetailsPromises[0][index],
        }));
      }

      // Step 3: Get all the extra user staking related details
      const totalBalanceResult = await staking_async_function.getTotalBalanceWithValidator(input);
      const stakedBalanceResult = await staking_async_function.getStakedBalanceWithValidator(input);
      const unstakedBalanceResult =
        await staking_async_function.getUnstakedBalanceWithValidator(input);
      const unstakedStatusResult =
        await staking_async_function.getUnstakedStatusWithValidator(input);

      return {
        ...validatorDetails,
        totalBalance: totalBalanceResult,
        stakedBalance: stakedBalanceResult,
        unstakedBalance: unstakedBalanceResult,
        unstakedStatus: unstakedStatusResult,
        unclaimedTokenRewards,
      };
    },
  );

  let stakedDetails: TStakedValidator[] = await Promise.all(promises);

  stakedDetails = stakedDetails.filter((staked) => {
    if (staked.validatorVersion === EValidatorVersion.farming) {
      return true;
    } else {
      return parseFloat(fromYoctoNear(staked.totalBalance, 5)) >= 0.0001;
    }
  });
  return TFRSuccessPayload(stakedDetails);
});

export const Endpoint_GetUserStakedValidators_Impl = Endpoint_GetUserStakedValidators;
