import { ENearNetwork } from "@meteorwallet/meteor-near-sdk/dist/packages/common/core/modules/blockchains/near/core/types/near_basic_types";
import { number_utils } from "@meteorwallet/utils/javascript_type_utils/index";
import { EpochValidatorInfo, FinalExecutionOutcome } from "@near-js/types";
import { utils } from "near-api-js";
import { KitWallet_HttpClient } from "../../modules_external/kit_wallet/clients/KitWallet_HttpClient";
import { Metapool } from "../../modules_external/metapool/clients/Metapool_HttpClient";
import {
  METAPOOL_CONTRACT_ID,
  METAPOOL_STAKING_GAS,
} from "../../modules_external/metapool/metapool_constants";
import { IMetapoolMetrics } from "../../modules_external/metapool/metapool_types";
import { MeteorBackendV2Client } from "../../modules_external/meteor_v2_api/MeteorBackendV2Client";
import { getNearApi } from "../../modules_external/near/clients/near_api_js/NearApiJsClient";
import {
  IWithAccountIdAndNetwork,
  IWithContractId,
  IWithNetwork,
} from "../../modules_external/near/types/near_input_helper_types";
import { NearAccountSignerExecutor } from "../accounts/near_signer_executor/NearAccountSignerExecutor";
import { near_action_creators } from "../accounts/transactions/near_action_creators";
import {
  fungible_tokens_async_functions,
  getFungibleTokenMetadata,
} from "../fungible_tokens/fungible_tokens_async_functions";
import { FT_STORAGE_DEPOSIT_AMOUNT_STRING } from "../fungible_tokens/fungible_tokens_constants";
import { IMeteorFungibleTokenMetadata } from "../fungible_tokens/fungible_tokens_types";
import {
  FARMING_CLAIM_GAS,
  FARMING_CLAIM_YOCTO,
  NEAR_TOKEN_ID,
  TOKEN_ID_STNEAR,
} from "./staking_constants";
import {
  EStakingType,
  EValidatorVersion,
  IValidatorDetails,
  TFeeFraction,
  TIODepositAndStakeNear_Input,
  TIOGetPoolSummary_Input,
  TIOGetPoolSummary_Output,
  TIOGetRecentEpochValidatorsInfo_Output,
  TIOGetStakedDetails_Input,
  TIOGetValidatorDetails_Input,
  TIOGetValidatorFee_Input,
  TIOWithdrawAll_Input,
  TStakedValidator,
  TTokenApy,
  TUnclaimedTokenReward,
  TValidatorDetails,
  TValidatorFarm,
} from "./staking_types";
import {
  calculateAPY,
  getUniqueAccountIdsFromEpochValidatorInfo,
  getValidatorPoolVersion,
} from "./staking_util";

export const staking_async_function = {
  getPoolSummary,
  getValidatorFee,
  getRecentEpochValidatorsInfo,
  depositAndStake,
  getStakedValidators,
  getTotalBalanceWithValidator,
  getMetapoolMetrics,
  getMetapoolValidator,
  getStakedBalanceWithValidator: getAccountStakedBalanceWithValidator,
  getUnstakedBalanceWithValidator,
  getUnstakedStatusWithValidator,
  unstake,
  withdrawAll,
  getUnclaimedReward,
  claim,
  metapoolStake,
  getNearAmountSellStnear,
  liquidUnstake,
  liquidStaking,
  getValidatorDetails,
  getStakedFarmValidatorUnclaimedRewards,
  getRecentEpochsValidatorIds,
  getValidatorListFromBackendV2,
  getClaimedMoonToken,
};

async function getStorageBalance({
  contractId,
  accountId,
  network,
}: IWithAccountIdAndNetwork & IWithContractId) {
  const account = await getNearApi(network).nativeApi.account(accountId);
  return await account.viewFunction({
    contractId,
    args: {
      account_id: accountId,
    },
    methodName: "storage_balance_of",
  });
}

async function getPoolSummary({
  accountId,
  validatorId,
  network,
}: TIOGetPoolSummary_Input): Promise<TIOGetPoolSummary_Output> {
  const account = await getNearApi(network).nativeApi.account(accountId);
  return await account.viewFunction({
    contractId: validatorId,
    methodName: "get_pool_summary",
    args: {},
  });
}

async function getValidatorFee({
  accountId,
  network,
  validatorId,
}: TIOGetValidatorFee_Input): Promise<TFeeFraction> {
  const account = await getNearApi(network).nativeApi.account(accountId);
  const result = await account.viewFunction({
    contractId: validatorId,
    methodName: "get_reward_fee_fraction",
    args: {},
  });
  return result;
}

async function getRecentEpochValidatorsInfo({
  network,
}: IWithNetwork): Promise<TIOGetRecentEpochValidatorsInfo_Output> {
  const result = (await getNearApi(network).nativeApi.connection.provider.validators(
    null,
  )) as TIOGetRecentEpochValidatorsInfo_Output;
  return result;
}

async function depositAndStake({
  accountId,
  network,
  validatorId,
  nearAmount,
}: TIODepositAndStakeNear_Input): Promise<FinalExecutionOutcome> {
  const nearAmountString = utils.format.parseNearAmount(nearAmount.toString())!;

  const results = await NearAccountSignerExecutor.getInstance(
    accountId,
    network,
  ).startTransactionsAwait([
    {
      receiverId: validatorId,
      actions: [
        near_action_creators.functionCall({
          methodName: "deposit_and_stake",
          contractId: validatorId,
          attachedDeposit: BigInt(nearAmountString),
        }),
      ],
    },
  ]);
  return results[0];
}

async function getStakedValidators({ accountId, network }: IWithAccountIdAndNetwork) {
  const helper = KitWallet_HttpClient.getInstance(network);
  const stakedValidators = await helper.getStakedValidators(accountId);
  return stakedValidators;
}

async function getTotalBalanceWithValidator({
  accountId,
  network,
  validatorId,
}: TIOGetStakedDetails_Input): Promise<string> {
  const account = await getNearApi(network).nativeApi.account(accountId);
  const result = await account.viewFunction({
    contractId: validatorId,
    methodName: "get_account_total_balance",
    args: { account_id: accountId },
  });
  return result;
}

async function getAccountStakedBalanceWithValidator({
  accountId,
  network,
  validatorId,
}: TIOGetStakedDetails_Input): Promise<string> {
  try {
    const account = await getNearApi(network).nativeApi.account(accountId);
    return await account.viewFunction({
      contractId: validatorId,
      methodName: "get_account_staked_balance",
      args: { account_id: accountId },
    });
  } catch (e) {
    console.error("Error getting staked balance", e);
    return "0";
  }
}

async function getUnstakedBalanceWithValidator({
  accountId,
  network,
  validatorId,
}: TIOGetStakedDetails_Input): Promise<string> {
  const account = await getNearApi(network).nativeApi.account(accountId);
  const result = await account.viewFunction({
    contractId: validatorId,
    methodName: "get_account_unstaked_balance",
    args: { account_id: accountId },
  });
  return result;
}

async function getUnstakedStatusWithValidator({
  accountId,
  network,
  validatorId,
}: TIOGetStakedDetails_Input): Promise<boolean> {
  const account = await getNearApi(network).nativeApi.account(accountId);
  const result = await account.viewFunction({
    contractId: validatorId,
    methodName: "is_account_unstaked_balance_available",
    args: { account_id: accountId },
  });
  return result;
}

async function unstake({
  accountId,
  network,
  validatorId,
  nearAmount,
}: TIODepositAndStakeNear_Input) {
  const nearAmountString = utils.format.parseNearAmount(nearAmount.toString());

  const results = await NearAccountSignerExecutor.getInstance(
    accountId,
    network,
  ).startTransactionsAwait([
    {
      receiverId: validatorId,
      actions: [
        near_action_creators.functionCall({
          methodName: "unstake",
          contractId: validatorId,
          args: { amount: BigInt(nearAmountString!) },
        }),
      ],
    },
  ]);
  return results[0];
}

async function withdrawAll({ accountId, network, validatorId }: TIOWithdrawAll_Input) {
  const results = await NearAccountSignerExecutor.getInstance(
    accountId,
    network,
  ).startTransactionsAwait([
    {
      receiverId: validatorId,
      actions: [
        near_action_creators.functionCall({
          methodName: "withdraw_all",
          contractId: validatorId,
        }),
      ],
    },
  ]);

  return results[0];
}

// Get unclaim reward token amount in string
async function getUnclaimedReward({ accountId, network, validatorId, farmId }): Promise<string> {
  const account = await getNearApi(network).nativeApi.account(accountId);
  const result = await account.viewFunction({
    contractId: validatorId,
    methodName: "get_unclaimed_reward",
    args: { account_id: accountId, farm_id: farmId },
  });
  return result;
}

//
async function claim({ accountId, network, validatorId, tokenId }) {
  const results = await NearAccountSignerExecutor.getInstance(
    accountId,
    network,
  ).startTransactionsAwait([
    {
      receiverId: validatorId,
      actions: [
        near_action_creators.functionCall({
          contractId: validatorId,
          methodName: "claim",
          args: { token_id: tokenId },
          gas: BigInt(FARMING_CLAIM_GAS),
          attachedDeposit: BigInt(FARMING_CLAIM_YOCTO),
        }),
      ],
    },
  ]);
  return results[0];
}

async function getMetapoolMetrics(): Promise<IMetapoolMetrics> {
  return await Metapool.getInstance().getMetrics();
}

async function metapoolStake({
  accountId,
  network,
  amountInYocto,
}: IWithAccountIdAndNetwork & {
  amountInYocto: string;
}): Promise<FinalExecutionOutcome> {
  const results = await NearAccountSignerExecutor.getInstance(
    accountId,
    network,
  ).startTransactionsAwait([
    {
      receiverId: METAPOOL_CONTRACT_ID,
      actions: [
        near_action_creators.functionCall({
          contractId: METAPOOL_CONTRACT_ID,
          methodName: "deposit_and_stake",
          gas: BigInt(METAPOOL_STAKING_GAS),
          attachedDeposit: BigInt(amountInYocto.toString()),
        }),
      ],
    },
  ]);
  return results[0];
}

async function getMetapoolValidator({ network, accountId }): Promise<TStakedValidator> {
  let promises: Promise<any>[] = [];
  const input = {
    accountId: accountId,
    network: network,
    validatorId: METAPOOL_CONTRACT_ID,
  };
  const getMetapoolAsync = getMetapoolMetrics();
  const getTokenPriceListAsync = fungible_tokens_async_functions.getTokenListWithPriceAndMetadata({
    ...input,
  });
  const getTokenBalanceAsync = fungible_tokens_async_functions.getTokenBalance({
    accountId,
    network,
    contractId: METAPOOL_CONTRACT_ID,
  });
  const unstakedBalanceAsync = staking_async_function.getUnstakedBalanceWithValidator(input);
  const unstakedStatusAsync = staking_async_function.getUnstakedStatusWithValidator(input);
  promises.push(
    getMetapoolAsync,
    getTokenPriceListAsync,
    getTokenBalanceAsync,
    unstakedBalanceAsync,
    unstakedStatusAsync,
  );

  const promiseResult = await Promise.all(promises);
  const getMetapoolMetricsResult = promiseResult[0];
  const getTokenPriceListResult = promiseResult[1];
  const getTokenBalanceResult = promiseResult[2];
  const unstakedBalanceResult = promiseResult[3];
  const unstakedStatusResult = promiseResult[4];

  const nearToken = getTokenPriceListResult.find((token) => token.id === NEAR_TOKEN_ID);
  const stNearToken = getTokenPriceListResult.find((token) => token.id === TOKEN_ID_STNEAR);

  const metapoolValidator: TStakedValidator = {
    validatorId: METAPOOL_CONTRACT_ID,
    isActive: true,
    stakedNearAmount: getMetapoolMetricsResult.total_actually_staked.toFixed(2),
    stakingType: EStakingType.liquid,
    pendingUnstakePeriod: "2 ~ 6 days",
    validatorVersion: EValidatorVersion.normal,
    rewardTokens: [
      {
        ...nearToken,
        apy: getMetapoolMetricsResult.st_near_30_day_apy,
      } as TTokenApy,
    ],
    apy: getMetapoolMetricsResult.st_near_30_day_apy,
    fee: 0,
    liquidUnstakeFee: getMetapoolMetricsResult.nslp_current_discount,
    tokenToReceive: stNearToken,
    // FIXME: Remove deposit in TStakedValidator
    totalBalance: BigInt(getTokenBalanceResult) + BigInt(unstakedBalanceResult).toString(),
    stakedBalance: getTokenBalanceResult,
    unstakedBalance: unstakedBalanceResult,
    unstakedStatus: unstakedStatusResult,
  };

  return metapoolValidator;
}

async function getNearAmountSellStnear({ network, accountId, yoctoStNear }) {
  const account = await getNearApi(network).nativeApi.account(accountId);
  const result = await account.viewFunction({
    contractId: METAPOOL_CONTRACT_ID,
    methodName: "get_near_amount_sell_stnear",
    args: { stnear_to_sell: yoctoStNear },
  });
  return result;
}

async function liquidUnstake({
  network,
  accountId,
  yoctoStNEAR,
  minExpectedYoctos,
}: IWithAccountIdAndNetwork & {
  yoctoStNEAR: string;
  minExpectedYoctos: string;
}): Promise<FinalExecutionOutcome> {
  const results = await NearAccountSignerExecutor.getInstance(
    accountId,
    network,
  ).startTransactionsAwait([
    {
      receiverId: METAPOOL_CONTRACT_ID,
      actions: [
        near_action_creators.functionCall({
          methodName: "liquid_unstake",
          contractId: METAPOOL_CONTRACT_ID,
          args: {
            st_near_to_burn: yoctoStNEAR,
            min_expected_near: minExpectedYoctos,
          },
        }),
      ],
    },
  ]);
  return results[0];
}

async function liquidStaking({
  contractId,
  accountId,
  network,
  amountInYocto,
}: IWithAccountIdAndNetwork & {
  amountInYocto: string;
  contractId: string;
}): Promise<FinalExecutionOutcome> {
  const storageAvailable = await getStorageBalance({
    contractId,
    accountId,
    network,
  });

  const transactionMetapool = {
    receiverId: METAPOOL_CONTRACT_ID,
    actions: [
      near_action_creators.functionCall({
        contractId: METAPOOL_CONTRACT_ID,
        methodName: "deposit_and_stake",
        gas: BigInt(METAPOOL_STAKING_GAS),
        attachedDeposit: BigInt(amountInYocto.toString()),
      }),
    ],
  };

  if (storageAvailable?.total === undefined) {
    console.log("no deposit, transfer storage deposit");
    const transactionDeposit = {
      receiverId: contractId,
      actions: [
        near_action_creators.functionCall({
          contractId,
          methodName: "storage_deposit",
          args: {
            account_id: accountId,
            registration_only: true,
          },
          attachedDeposit: BigInt(FT_STORAGE_DEPOSIT_AMOUNT_STRING),
        }),
      ],
    };
    const [_, withDepositRes] = await NearAccountSignerExecutor.getInstance(
      accountId,
      network,
    ).startTransactionsAwait([transactionDeposit, transactionMetapool]);
    return withDepositRes;
  } else {
    const [metapoolRes] = await NearAccountSignerExecutor.getInstance(
      accountId,
      network,
    ).startTransactionsAwait([transactionMetapool]);
    return metapoolRes;
  }
}

// beware of using this function, it contain current_proposals validators may have error or non standard methods
async function getRecentEpochsValidatorIds({ network }: IWithNetwork): Promise<string[]> {
  const epochValidatorInfo: EpochValidatorInfo = await getRecentEpochValidatorsInfo({ network });
  return getUniqueAccountIdsFromEpochValidatorInfo(epochValidatorInfo);
}

async function getValidatorDetails({
  accountId,
  network,
  validatorId,
  currentActiveValidators,
  tokenPriceList,
}: Required<TIOGetValidatorDetails_Input>): Promise<IValidatorDetails | undefined> {
  try {
    // 1 Getting some info before getting details
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

    // 2 Start extracting details we need
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
  } catch (e) {
    console.log(e);
  }
}

async function getStakedFarmValidatorUnclaimedRewards({
  accountId,
  network,
  validatorDetails,
}: IWithAccountIdAndNetwork & { validatorDetails: IValidatorDetails }): Promise<
  TUnclaimedTokenReward[]
> {
  try {
    if (
      validatorDetails.validatorVersion !== EValidatorVersion.farming ||
      !validatorDetails.farms
    ) {
      return [];
    }

    let sortedFarms = validatorDetails.farms.sort((a, b) => {
      const aEndDateBN = BigInt(a.end_date);
      const bEndDateBN = BigInt(b.end_date);
      return number_utils.bigIntCompare(bEndDateBN, aEndDateBN);
      // return bEndDateBN.cmp(aEndDateBN);
    });
    sortedFarms = sortedFarms.reduce((acc, current) => {
      // Check if the current token_id is already included in the accumulator
      const isTokenIdAlreadyIncluded = acc.some((record) => record.token_id === current.token_id);
      // If not included, add the current record to the accumulator
      if (!isTokenIdAlreadyIncluded) {
        acc.push(current);
      }
      return acc;
    }, [] as TValidatorFarm[]);

    const rewardDetailsPromises = await Promise.all([
      Promise.all(
        sortedFarms.map((farm) =>
          staking_async_function.getUnclaimedReward({
            accountId,
            network,
            validatorId: validatorDetails.validatorId,
            farmId: farm.farm_id,
          }),
        ),
      ),
      Promise.all(
        sortedFarms.map((farm) =>
          getFungibleTokenMetadata({
            contractId: farm.token_id,
            network,
          }),
        ),
      ),
    ]);

    return sortedFarms
      .filter((farm, index) => rewardDetailsPromises[1][index] && rewardDetailsPromises[0][index])
      .map((farm, index) => {
        return {
          ...(rewardDetailsPromises[1][index] as IMeteorFungibleTokenMetadata),
          reward: rewardDetailsPromises[0][index],
        };
      });
  } catch (e) {
    console.log(e);
    return [];
  }
}

async function getValidatorListFromBackendV2({
  networkId,
  validatorId,
}: {
  networkId: ENearNetwork;
  validatorId?: string;
}): Promise<TValidatorDetails[]> {
  const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
  const resp = await meteorBackendV2Service.getValidators({
    networkId,
    validatorId,
  });
  return resp.validators;
}

async function getClaimedMoonToken({
  networkId,
  walletId,
}: {
  networkId: ENearNetwork;
  walletId: string;
}): Promise<number> {
  const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
  const resp = await meteorBackendV2Service.getClaimedMoonToken({
    networkId,
    walletId,
  });
  return resp;
}
