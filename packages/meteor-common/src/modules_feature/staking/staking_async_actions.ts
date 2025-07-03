import { MeteorBackendV2Client } from "../../modules_external/meteor_v2_api/MeteorBackendV2Client";
import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";
import { createAsyncActionWithErrors } from "../../modules_utility/api_utilities/async_action_utils";
import { account_async_functions } from "../accounts/account_async_functions";
import { CoreIndexerAdapter } from "../core_indexer/CoreIndexerAdapter";
import {
  FT_STORAGE_DEPOSIT_AMOUNT_BIGINT,
  FT_STORAGE_DEPOSIT_GAS_BIGINT,
} from "../fungible_tokens/fungible_tokens_constants";
import { IClaimFarmRewards_Input, TTokenPriceList } from "../fungible_tokens/fungible_tokens_types";
import { staking_async_function } from "./staking_async_functions";
import {
  EValidatorVersion,
  IValidatorDetails,
  TIODepositAndStakeNear_Input,
  TStakedValidator,
  TUnclaimedTokenReward,
  TValidatorDetails,
} from "./staking_types";
import { getValidatorPoolVersion } from "./staking_util";

export const staking_async_action = {
  depositAndStake: createAsyncActionWithErrors<TIODepositAndStakeNear_Input, any>(
    staking_async_function.depositAndStake,
  ),
  unstake: createAsyncActionWithErrors(staking_async_function.unstake),
  withdrawAll: createAsyncActionWithErrors(staking_async_function.withdrawAll),
  claimFarmRewards: createAsyncActionWithErrors(claimFarmRewards),
  getMetapoolMetrics: createAsyncActionWithErrors(staking_async_function.getMetapoolMetrics),
  metapoolStake: createAsyncActionWithErrors(staking_async_function.metapoolStake),
  getMetapoolValidator: createAsyncActionWithErrors(staking_async_function.getMetapoolValidator),
  getNearAmountSellStnear: createAsyncActionWithErrors(
    staking_async_function.getNearAmountSellStnear,
  ),
  liquidUnstake: createAsyncActionWithErrors(staking_async_function.liquidUnstake),
  liquidStaking: createAsyncActionWithErrors(staking_async_function.liquidStaking),
  getRecentEpochsValidatorIds: createAsyncActionWithErrors(
    staking_async_function.getRecentEpochsValidatorIds,
  ),
  getRecentEpochValidatorsInfo: createAsyncActionWithErrors(
    staking_async_function.getRecentEpochValidatorsInfo,
  ),
  getValidatorDetails: createAsyncActionWithErrors(staking_async_function.getValidatorDetails),

  // To get details of staked validator, on numbers of tokens staked, unstaked, etc
  getTotalBalanceWithValidator: createAsyncActionWithErrors(
    staking_async_function.getTotalBalanceWithValidator,
  ),
  getAccountStakedBalanceWithValidator: createAsyncActionWithErrors(
    staking_async_function.getStakedBalanceWithValidator,
  ),
  getUnstakedBalanceWithValidator: createAsyncActionWithErrors(
    staking_async_function.getUnstakedBalanceWithValidator,
  ),
  getUnstakedStatusWithValidator: createAsyncActionWithErrors(
    staking_async_function.getUnstakedStatusWithValidator,
  ),
  getStakedFarmValidatorUnclaimedRewards: createAsyncActionWithErrors(
    staking_async_function.getStakedFarmValidatorUnclaimedRewards,
  ),
  getStakedValidatorList: createAsyncActionWithErrors(getStakedValidatorList),
  getAvailableValidatorsAndDetails: createAsyncActionWithErrors(getAvailableValidatorsAndDetails),
  getValidatorListFromBackendV2: createAsyncActionWithErrors(
    staking_async_function.getValidatorListFromBackendV2,
  ),
  getClaimedMoonToken: createAsyncActionWithErrors(staking_async_function.getClaimedMoonToken),
};

async function claimFarmRewards({
  validatorId,
  accountId,
  network,
  tokenIds,
}: IClaimFarmRewards_Input) {
  const promises = tokenIds.map(async (tokenId) => {
    const gasAmount = FT_STORAGE_DEPOSIT_GAS_BIGINT;
    const storageDepositAmount = FT_STORAGE_DEPOSIT_AMOUNT_BIGINT;

    await account_async_functions.checkAndDepositStorage({
      contractId: tokenId,
      accountId,
      network,
      gasAmount,
      storageDepositAmount,
    });

    return await staking_async_function.claim({
      accountId,
      network,
      validatorId,
      tokenId,
    });
  });

  return Promise.all(promises);
}

async function getStakedValidatorList({
  accountId,
  network,
  validatorsIdList,
}: {
  accountId: string;
  network: ENearNetwork;
  validatorsIdList: string[];
}): Promise<TStakedValidator[]> {
  const meteorBackendV2Service = MeteorBackendV2Client.getInstance();

  // Step 1: Get validators that users interacted with, we are using stakedBalance since it will always
  // leave a small amount of NEAR even if users unstaked.
  let nonZeroBalanceValidators = await Promise.all(
    validatorsIdList.map(async (validatorId) => {
      const result = await staking_async_function.getTotalBalanceWithValidator({
        accountId,
        network,
        validatorId,
      });
      return { validatorId, balance: result };
    }),
  );
  nonZeroBalanceValidators = nonZeroBalanceValidators.filter((validator) => {
    return validator.balance !== "0";
  });

  // Step 2: Get basic details of staked validators
  // const unfilteredValidatorDetails = await Promise.all(nonZeroBalanceValidators.map(
  //   async (validator) => await staking_async_function.getValidatorDetails({
  //     accountId,
  //     network,
  //     validatorId: validator.validatorId,
  //     currentActiveValidators: recentEpochValidatorsInfo?.current_validators ?? [],
  //     tokenPriceList: tokenPriceList ?? {},
  //   }),
  // ));
  // const validatorDetails = (unfilteredValidatorDetails.filter(validator => validator)) as IValidatorDetails[];

  const fetchValidatorDetailsFromCache = await meteorBackendV2Service.getValidators({
    networkId: network,
  });
  const validatorDetails: IValidatorDetails[] = nonZeroBalanceValidators.map((validator) => {
    const fetchValidatorDetail = fetchValidatorDetailsFromCache.validators.filter(
      (validatorDetail) => validatorDetail.validatorId === validator.validatorId,
    );
    return fetchValidatorDetail[0] || [];
  });

  // Corrected step 3
  const validators = await Promise.allSettled(
    validatorDetails.map(async (validator): Promise<TStakedValidator> => {
      const payload = {
        accountId: accountId,
        network: network,
        validatorId: validator.validatorId,
      };
      const validatorVersion = getValidatorPoolVersion(network, validator.validatorId);

      // Prepare promises without awaiting them here
      const basePromises: [Promise<string>, Promise<string>, Promise<string>, Promise<boolean>] = [
        staking_async_function.getTotalBalanceWithValidator(payload),
        staking_async_function.getStakedBalanceWithValidator(payload),
        staking_async_function.getUnstakedBalanceWithValidator(payload),
        staking_async_function.getUnstakedStatusWithValidator(payload),
      ];

      if (validatorVersion === EValidatorVersion.farming) {
        // Add the additional promise for farming validators
        const unclaimedRewardsPromise =
          staking_async_function.getStakedFarmValidatorUnclaimedRewards({
            ...payload,
            validatorDetails: validator,
          });
        const promises: [
          Promise<string>,
          Promise<string>,
          Promise<string>,
          Promise<boolean>,
          Promise<TUnclaimedTokenReward[]>,
        ] = [...basePromises, unclaimedRewardsPromise];

        // Now await all promises together
        const [
          totalBalance,
          stakedBalance,
          unstakedBalance,
          unstakedStatus,
          unclaimedTokenRewards,
        ] = await Promise.all(promises);

        return {
          ...validator,
          totalBalance,
          stakedBalance,
          unstakedBalance,
          unstakedStatus,
          unclaimedTokenRewards,
        };
      } else {
        // For non-farming validators, await the base promises
        const [totalBalance, stakedBalance, unstakedBalance, unstakedStatus] =
          await Promise.all(basePromises);

        return {
          ...validator,
          totalBalance,
          stakedBalance,
          unstakedBalance,
          unstakedStatus,
        };
      }
    }),
  );

  return validators
    .filter((item) => item.status === "fulfilled")
    .map((item) => (item as PromiseFulfilledResult<TStakedValidator>).value)
    .sort((a, b) => {
      return BigInt(b.totalBalance) - BigInt(a.totalBalance) > 0 ? 1 : -1;
      // return BigInt(b.totalBalance).sub(BigInt(a.totalBalance)).gtn(0) ? 1 : -1;
    });
}

async function getAvailableValidatorsAndDetails({
  accountId,
  network,
  tokenPriceList,
}: {
  accountId: string;
  network: ENearNetwork;
  tokenPriceList: TTokenPriceList | null;
}): Promise<TValidatorDetails[]> {
  const recentValidators = await staking_async_function.getRecentEpochValidatorsInfo({ network });
  const indexerValidatorIds = await CoreIndexerAdapter.getInstance(network).getStakingPools();

  const validatorIds = Array.from(
    new Set([
      ...recentValidators.current_validators.map((validator) => validator.account_id),
      ...recentValidators.next_validators.map((validator) => validator.account_id),
      ...indexerValidatorIds,
    ]),
  );

  const getValidatorDetailsPromises = validatorIds.map(async (validatorId) => {
    return await staking_async_function.getValidatorDetails({
      accountId,
      network,
      validatorId,
      currentActiveValidators: recentValidators?.current_validators ?? [],
      tokenPriceList: tokenPriceList ?? {},
    });
  });

  const list = await Promise.all(getValidatorDetailsPromises);
  return list
    .filter((validator): validator is IValidatorDetails => validator !== undefined)
    .sort((a, b) => {
      // Prioritize active validators
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;

      // For active validators, sort by APY in descending order
      if (a.isActive && b.isActive) {
        if (a.apy > b.apy) return -1;
        if (a.apy < b.apy) return 1;

        // If APY is similar, sort by total staked in descending order
        const aStaked = parseFloat(a.stakedNearAmount);
        const bStaked = parseFloat(b.stakedNearAmount);

        return bStaked - aStaked;
      }

      // If both are inactive, maintain their relative positions (stable sort)
      return 0;
    });
}
