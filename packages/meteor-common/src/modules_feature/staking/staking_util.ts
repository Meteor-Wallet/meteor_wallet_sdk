import { EpochValidatorInfo } from "@near-js/types";
import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";
import { fromYoctoNear } from "../../modules_external/near/utils/near_formatting_utils";
import { TIOGetTokenPriceList_Output } from "../../modules_external/ref_finance/ref_finance_type";
import { StringUtils } from "../../modules_utility/data_type_utils/StringUtils";
import { getFungibleTokenMetadata } from "../fungible_tokens/fungible_tokens_async_functions";
import { NEAR_METADATA } from "../fungible_tokens/fungible_tokens_constants";
import {
  IMeteorFungibleTokenMetadata,
  TTokenPriceList,
} from "../fungible_tokens/fungible_tokens_types";
import { getWrapNearTokenContractId } from "../fungible_tokens/fungible_tokens_utils";
import {
  FARMING_VALIDATOR_PREFIXES_MAINNET,
  FARMING_VALIDATOR_PREFIXES_TESTNET,
  METEOR_VALIDATOR_BY_NETWORK,
  NEAR_TOKEN_ID,
  TOKEN_ID_WNEAR,
} from "./staking_constants";
import {
  EStakingType,
  EValidatorVersion,
  TIOGetPoolSummary_Output,
  TStakedValidator,
  TStakingRewardEstimation,
  TTokenApy,
} from "./staking_types";

export const calculateAPY = async (
  accountId: string,
  network: ENearNetwork,
  validatorVersion: EValidatorVersion,
  tokenPrices: TIOGetTokenPriceList_Output,
  poolSummary?: TIOGetPoolSummary_Output | null,
  fee?: number,
): Promise<{ rewardTokens: TTokenApy[]; apy: number }> => {
  // Scenario 1: Fee Undefined. Return -
  if (fee === null || fee === undefined) {
    return {
      rewardTokens: [],
      apy: 0,
    };
  }

  // Scenario 2: Staking v1 (only near)
  const nearTokenPrice = tokenPrices[getWrapNearTokenContractId(network)].price;
  let nearMetadata: IMeteorFungibleTokenMetadata = NEAR_METADATA;

  if (validatorVersion === EValidatorVersion.normal && fee) {
    let nearApy: TTokenApy = {
      ...nearMetadata,
      apy: 11 * (1 - fee / 100),
      price_in_usd: nearTokenPrice,
    };
    return {
      rewardTokens: [nearApy],
      apy: sumTokenApy([nearApy]),
    };
  }

  // Scenario 3: Staking v2
  else {
    const activeFarms = poolSummary?.farms?.filter((farm) => farm.active);
    // Scenario 3.1: No active farm but has fee. Assume common staking
    if (!activeFarms) {
      return {
        rewardTokens: [] as TTokenApy[],
        apy: sumTokenApy([]),
      };
    }

    // Scenario 3.2: Got active farm but price not found. Can't estimate APY so return -
    else if (activeFarms.length > 0 && activeFarms.every((farm) => !tokenPrices[farm.token_id])) {
      const tokenArray = await Promise.all(
        activeFarms.map(async (famrWithApy): Promise<TTokenApy | null> => {
          let tokenMetadata = await getFungibleTokenMetadata({
            contractId: famrWithApy.token_id,
            network,
          });
          if (!tokenMetadata) {
            return null;
          }
          let tokenApy = { ...tokenMetadata, apy: 0, price_in_usd: "0" };
          return tokenApy;
        }),
      );

      const filteredResult: TTokenApy[] = tokenArray.filter(
        (token) => token !== null,
      ) as TTokenApy[];

      return {
        rewardTokens: filteredResult,
        apy: sumTokenApy(filteredResult),
      };
    }

    // Scenario 4: Staking v2 and gives other token
    else {
      const farmsWithTokenPrices = activeFarms.map((farm) => ({
        ...farm,
        tokenPrice: tokenPrices[farm.token_id].price,
      }));
      const totalStakedBalance = fromYoctoNear(poolSummary!.total_staked_balance);

      const apyArray = farmsWithTokenPrices.map((farm) => {
        const SECONDS_IN_YEAR = 3600 * 24 * 365;

        const tokenPriceInUSD = farm.tokenPrice ? parseFloat(farm.tokenPrice) : 0;
        const nearPriceInUSD = +tokenPrices[TOKEN_ID_WNEAR].price;

        const rewardsPerSecond =
          Number(farm.amount) / ((Number(farm.end_date) - Number(farm.start_date)) * 1e9);
        const rewardsPerSecondInUSD = rewardsPerSecond * tokenPriceInUSD;
        const totalStakedBalanceInUSD = Number(totalStakedBalance) * nearPriceInUSD;
        const farmAPY = ((rewardsPerSecondInUSD * SECONDS_IN_YEAR) / totalStakedBalanceInUSD) * 100;
        return { ...farm, apy: farmAPY };
      });

      const tokenArray = await Promise.all(
        apyArray.map(async (famrWithApy): Promise<TTokenApy | null> => {
          let tokenMetadata = await getFungibleTokenMetadata({
            contractId: famrWithApy.token_id,
            network,
          });
          if (!tokenMetadata) {
            return null;
          }
          let tokenApy: TTokenApy = {
            ...tokenMetadata,
            apy: famrWithApy.apy,
            price_in_usd: famrWithApy.tokenPrice,
          };
          return tokenApy;
        }),
      );

      const tokenArrayFiltered = tokenArray.filter((token) => token !== null) as TTokenApy[];
      return {
        rewardTokens: tokenArrayFiltered,
        apy: sumTokenApy(tokenArrayFiltered),
      };
    }
  }
};

export function calculateEstimatedEarnings(
  tokensApy: TTokenApy[],
  tokenPrices: TTokenPriceList,
  periodInDay: number,
  investAmountInUSD: number,
): TStakingRewardEstimation[] {
  const rewards = tokensApy.map((token): TStakingRewardEstimation => {
    const usdAmount = ((investAmountInUSD * token.apy) / 100 / 365) * periodInDay;
    let tokenPrice;
    if (token.id === NEAR_TOKEN_ID) {
      tokenPrice = tokenPrices[TOKEN_ID_WNEAR];
    } else {
      tokenPrice = tokenPrices[token.id];
    }

    let reward: TStakingRewardEstimation = {
      ...token,
      usdAmount: usdAmount,
      tokenAmount: usdAmount / parseFloat(tokenPrice?.price ?? 1),
      periodInDay,
    };
    return reward;
  });

  return rewards;
}

export function sumTokenApy(tokenApy: TTokenApy[]) {
  return tokenApy.reduce((a, c) => a + c.apy, 0);
}

export const getValidatorName = (validatorId: string): string => {
  const validatorPoolName = validatorId.split(".")[0];
  const validatorPoolVersion = validatorId.split(".")[1];

  const prettyValidatorPoolName = StringUtils.capitalizeFirstLetter(validatorPoolName);
  let prettyValidatorPoolVersion = "";

  switch (validatorPoolVersion.toLocaleLowerCase()) {
    // case "poolv1":
    //   prettyValidatorPoolVersion = "V1 ";
    //   break;
    case "pool":
      prettyValidatorPoolVersion = "V2 ";
      break;
  }

  return `${prettyValidatorPoolName} ${prettyValidatorPoolVersion}Pool`;
};

export const getValidatorPoolVersion = (
  networkId: ENearNetwork,
  accountId: string,
): EValidatorVersion => {
  const prefixes = getValidationNetworkPrefixes(networkId);
  return prefixes.some((prefix) => accountId.indexOf(prefix) !== -1)
    ? EValidatorVersion.farming
    : EValidatorVersion.normal;
};

export const getValidationNetworkPrefixes = (networkId: ENearNetwork) => {
  switch (networkId) {
    case ENearNetwork.mainnet: {
      return FARMING_VALIDATOR_PREFIXES_MAINNET;
    }
    case ENearNetwork.testnet: {
      return FARMING_VALIDATOR_PREFIXES_TESTNET;
    }
    default: {
      return FARMING_VALIDATOR_PREFIXES_TESTNET;
    }
  }
};

export function parseTokenReward(stakedValidator: TStakedValidator): string {
  const earning =
    stakedValidator.earning && parseFloat(stakedValidator.earning) > 0
      ? stakedValidator.earning
      : 0;
  return fromYoctoNear(earning, 4);
}

export function getUniqueAccountIdsFromEpochValidatorInfo(
  epochValidatorInfo: EpochValidatorInfo,
): string[] {
  try {
    const allAccountIds: string[] = [];
    // Extract account IDs from each key and concatenate them
    allAccountIds.push(
      ...epochValidatorInfo.current_proposals.map((validator) => validator.account_id),
      ...epochValidatorInfo.current_validators.map((validator) => validator.account_id),
      ...epochValidatorInfo.next_validators.map((validator) => validator.account_id),
      ...epochValidatorInfo.prev_epoch_kickout.map((validator) => validator.account_id),
    );

    // Convert the concatenated array into a Set to remove duplicates
    const uniqueAccountIdsSet = new Set(allAccountIds);
    return Array.from(uniqueAccountIdsSet);
  } catch (error) {
    console.error("Error in getUniqueAccountIdsFromEpochValidatorInfo: ", error);
    return [];
  }
}

export function emptyMeteorValidatorObject(networkId: ENearNetwork): TStakedValidator {
  return {
    apy: 0,
    fee: 0,
    isActive: false,
    pendingUnstakePeriod: "",
    rewardTokens: [
      {
        ...NEAR_METADATA,
        apy: 0,
        price_in_usd: "0",
      },
    ],
    stakedBalance: "0",
    stakedNearAmount: "0",
    stakingType: EStakingType.normal,
    totalBalance: "0",
    unstakedBalance: "0",
    unstakedStatus: false,
    validatorId: METEOR_VALIDATOR_BY_NETWORK[networkId],
    validatorVersion: EValidatorVersion.normal,
  };
}
