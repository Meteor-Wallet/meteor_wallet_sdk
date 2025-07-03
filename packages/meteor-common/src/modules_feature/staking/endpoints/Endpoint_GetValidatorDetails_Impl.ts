import { utils } from "near-api-js";
import { TFRSuccessPayload } from "../../../modules_utility/api_utilities/task_function/TaskFunctionResponses";
import { getTokenPriceListFromRefFinance } from "../../fungible_tokens/fungible_tokens_async_functions";
import { staking_async_function } from "../staking_async_functions";
import {
  EStakingType,
  EValidatorVersion,
  IValidatorDetails,
  TIOGetPoolSummary_Output,
  TIOGetValidatorDetails_Input,
} from "../staking_types";
import { calculateAPY, getValidatorPoolVersion } from "../staking_util";
import { Endpoint_GetValidatorDetails } from "./Endpoint_GetValidatorDetails";

export async function getValidatorDetails({
  accountId,
  network,
  validatorId,
  currentActiveValidators,
  tokenPriceList,
}: TIOGetValidatorDetails_Input): Promise<IValidatorDetails> {
  // 1. Check if we have the current validators and token price list, if not fetch them.
  if (!currentActiveValidators || !tokenPriceList) {
    const getValidatorsListAndStatus = await Promise.all([
      staking_async_function.getRecentEpochValidatorsInfo({ network }),
      getTokenPriceListFromRefFinance({ network }),
    ]);
    currentActiveValidators = getValidatorsListAndStatus[0].current_validators;
    tokenPriceList = getValidatorsListAndStatus[1];
  }

  // 4.1 Getting some info before getting details
  const input = {
    accountId: accountId,
    network: network,
    validatorId: validatorId,
  };

  let poolSummary: TIOGetPoolSummary_Output | null = null;
  const validatorVersion = getValidatorPoolVersion(network, validatorId);
  const activeValidatorDetails = currentActiveValidators.find(
    (validatorDetails) => validatorDetails.account_id === validatorId,
  );
  if (validatorVersion === EValidatorVersion.farming) {
    poolSummary = await staking_async_function.getPoolSummary(input);
  }

  // 4.2 Start extracting details we need
  const isActive = !!activeValidatorDetails;
  const feeDetails = await staking_async_function.getValidatorFee(input);
  const fee = +((feeDetails.numerator / feeDetails.denominator) * 100).toFixed(2);
  const apy = await calculateAPY(
    accountId,
    network,
    validatorVersion,
    tokenPriceList,
    poolSummary,
    fee,
  );

  return {
    validatorId: validatorId,
    isActive: isActive,
    stakedNearAmount: isActive
      ? utils.format.formatNearAmount(activeValidatorDetails.stake, 2)
      : "0",
    fee: fee,
    stakingType: EStakingType.normal,
    pendingUnstakePeriod: "48~72 hours",
    validatorVersion: validatorVersion,
    rewardTokens: apy.rewardTokens,
    apy: apy.apy,
    farms: poolSummary?.farms,
  };
}

Endpoint_GetValidatorDetails.implement((input: TIOGetValidatorDetails_Input) =>
  getValidatorDetails(input).then((response) => TFRSuccessPayload(response)),
);

export const Endpoint_GetValidatorDetails_Impl = Endpoint_GetValidatorDetails;
