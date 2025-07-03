import { FinalExecutionOutcome } from "@near-js/types";
import { getNearApi } from "../../modules_external/near/clients/near_api_js/NearApiJsClient";
import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";
import { IWithAccountIdAndNetwork } from "../../modules_external/near/types/near_input_helper_types";
import { toYoctoNear } from "../../modules_external/near/utils/near_formatting_utils";
import { account_async_functions } from "../accounts/account_async_functions";
import { NearAccountSignerExecutor } from "../accounts/near_signer_executor/NearAccountSignerExecutor";
import { near_action_creators } from "../accounts/transactions/near_action_creators";
import { gear_staking_constants } from "./gear_staking_constants";
import {
  IGearStaking_StakingOption,
  IGearStaking_StakingRecord,
  IGearStaking_StakingRecordWithUnclaimedReward,
} from "./gear_staking_types";

async function getGearPrice(network: ENearNetwork) {
  const gearId = gear_staking_constants[network].gearTokenContractId;
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${gearId}`);
    const response = await res.json();
    return response.pairs[0].priceUsd;
  } catch (error) {
    console.warn(`Error fetch token info for: ${gearId}`);
  }
}

async function getGearStakingOptions({
  network,
  accountId,
}: IWithAccountIdAndNetwork): Promise<IGearStaking_StakingOption[]> {
  const account = await getNearApi(network).nativeApi.account(accountId);
  return await account.viewFunction({
    contractId: gear_staking_constants[network].gearStakingContractId,
    methodName: "get_staking_period_options",
  });
}

async function getGearStakingRecords({
  network,
  accountId,
}): Promise<IGearStaking_StakingRecord[]> {
  const account = await getNearApi(network).nativeApi.account(accountId);
  return await account.viewFunction({
    contractId: gear_staking_constants[network].gearStakingContractId,
    methodName: "get_account_staking_records",
    args: {
      account_id: accountId,
    },
  });
}

async function getGearStakingRecordsWithUnclaimedRewards({
  network,
  accountId,
}): Promise<IGearStaking_StakingRecordWithUnclaimedReward[]> {
  const account = await getNearApi(network).nativeApi.account(accountId);
  return await account.viewFunction({
    contractId: gear_staking_constants[network].gearStakingContractId,
    methodName: "get_account_staking_records_with_unclaimed_rewards",
    args: {
      account_id: accountId,
    },
  });
}

async function stakeGear({
  network,
  accountId,
  rawAmount,
  stakingOptionIndex,
}: IWithAccountIdAndNetwork & {
  rawAmount: bigint;
  stakingOptionIndex: number;
}): Promise<FinalExecutionOutcome> {
  const storageNeeded = await checkMoreStorageNeeded({
    accountId,
    network,
  });
  if (storageNeeded) {
    await NearAccountSignerExecutor.getInstance(accountId, network).startTransactionsAwait([
      {
        receiverId: gear_staking_constants[network].gearStakingContractId,
        actions: [
          near_action_creators.functionCall({
            contractId: gear_staking_constants[network].gearStakingContractId,
            methodName: "storage_deposit",
            gas: BigInt(300000000000000),
            attachedDeposit: BigInt(toYoctoNear("0.002")),
          }),
        ],
      },
    ]);
  }
  const [res] = await NearAccountSignerExecutor.getInstance(
    accountId,
    network,
  ).startTransactionsAwait([
    {
      receiverId: gear_staking_constants[network].gearTokenContractId,
      actions: [
        near_action_creators.functionCall({
          contractId: gear_staking_constants[network].gearTokenContractId,
          methodName: "ft_transfer_call",
          gas: BigInt(300000000000000),
          attachedDeposit: BigInt(1),
          args: {
            receiver_id: gear_staking_constants[network].gearStakingContractId,
            amount: rawAmount.toString(),
            msg: JSON.stringify({
              reward_token_contract_id: gear_staking_constants[network].meteorPreTokenContractId,
              staking_period_option_index: stakingOptionIndex,
            }),
          },
        }),
      ],
    },
  ]);
  return res;
}

async function unstakeGear({
  network,
  accountId,
  stakingRecordIndex,
}: IWithAccountIdAndNetwork & { stakingRecordIndex: number }): Promise<FinalExecutionOutcome> {
  await account_async_functions.checkAndDepositStorage({
    network,
    accountId,
    contractId: gear_staking_constants[network].meteorPreTokenContractId,
    storageDepositAmount: BigInt(toYoctoNear("0.0125")),
    gasAmount: BigInt(300000000000000),
  });

  const [res] = await NearAccountSignerExecutor.getInstance(
    accountId,
    network,
  ).startTransactionsAwait([
    {
      receiverId: gear_staking_constants[network].gearStakingContractId,
      actions: [
        near_action_creators.functionCall({
          contractId: gear_staking_constants[network].gearStakingContractId,
          methodName: "unstake",
          gas: BigInt(300000000000000),
          args: {
            staking_record_index: stakingRecordIndex,
          },
        }),
      ],
    },
  ]);
  return res;
}

async function claimRewards({
  network,
  accountId,
  stakingRecordIndex,
}: IWithAccountIdAndNetwork & { stakingRecordIndex: number }): Promise<FinalExecutionOutcome> {
  await account_async_functions.checkAndDepositStorage({
    network,
    accountId,
    contractId: gear_staking_constants[network].meteorPreTokenContractId,
    storageDepositAmount: BigInt(toYoctoNear("0.0125")),
    gasAmount: BigInt(300000000000000),
  });

  const [res] = await NearAccountSignerExecutor.getInstance(
    accountId,
    network,
  ).startTransactionsAwait([
    {
      receiverId: gear_staking_constants[network].gearStakingContractId,
      actions: [
        near_action_creators.functionCall({
          contractId: gear_staking_constants[network].gearStakingContractId,
          methodName: "claim_reward",
          gas: BigInt(300000000000000),
          args: {
            staking_record_index: stakingRecordIndex,
          },
        }),
      ],
    },
  ]);
  return res;
}

async function withdrawStorage({ accountId, network }: IWithAccountIdAndNetwork) {
  const account = await getNearApi(network).nativeApi.account(accountId);
  return await account.functionCall({
    contractId: gear_staking_constants[network].gearStakingContractId,
    methodName: "storage_withdraw",
    gas: BigInt(300000000000000),
    attachedDeposit: BigInt(1),
    args: {
      amount: 1,
    },
  });
}

async function checkMoreStorageNeeded({ accountId, network }: IWithAccountIdAndNetwork) {
  const account = await getNearApi(network).nativeApi.account(accountId);
  return await account.viewFunction({
    contractId: gear_staking_constants[network].gearStakingContractId,
    methodName: "does_account_need_more_storage",
    args: {
      account_id: accountId,
    },
  });
}

export const gear_staking_async_functions = {
  getGearPrice,
  getGearStakingOptions,
  getGearStakingRecords,
  getGearStakingRecordsWithUnclaimedRewards,
  stakeGear,
  unstakeGear,
  claimRewards,
};
