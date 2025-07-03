import { actionCreators } from "@near-js/transactions";
import { TypedError } from "@near-js/types";
import { NearAccountSignerExecutor } from "../../../modules_feature/accounts/near_signer_executor/NearAccountSignerExecutor";
import { getMeteorPointsContractId } from "../../../modules_feature/missions/mission.utils";
import {
  attachedGas,
  networkConfigMeteorRewardsContractId,
} from "../../../modules_feature/rewards/rewards_constants";
import { MeteorActionError } from "../../../modules_utility/api_utilities/async_action_utils";
import { EOldMeteorErrorId } from "../../../modules_utility/old_errors/old_error_ids";
import { ENearNetwork } from "../types/near_basic_types";
import { IWithAccountIdAndNetwork } from "../types/near_input_helper_types";
import { ENearRpc_Finality } from "../types/near_rpc_types";
import { NearBasicService } from "./near_basic_service";

export interface IClaimableRewardsList {
  nft: [string, string[]][];
  ft: [string, number][];
  content: string[];
}

class MeteorRewardService extends NearBasicService {
  private meteorRewardsContractId: string;

  constructor(network: ENearNetwork) {
    super(network);
    this.meteorRewardsContractId = networkConfigMeteorRewardsContractId[network];
  }

  //refer:  https://github.com/Meteor-Wallet/meteor-shards/blob/master/src/share-contract/scripts/test/test_assets.sh

  async redeem({
    account_id,
    packId,
    amount,
    withRelayer,
  }: {
    account_id: string;
    packId: string;
    amount: string;
    withRelayer: boolean;
  }) {
    // near call $CONTRACT claim '{"pack": "1", "amount": "100000000"}' --accountId prelaunch.testnet --gas 300000000000000

    try {
      const [resp] = await NearAccountSignerExecutor.getInstance(
        account_id,
        this.network,
      ).startTransactionsAwait([
        {
          receiverId: this.meteorRewardsContractId,
          actions: [
            actionCreators.functionCall(
              withRelayer ? "redeem" : "redeem_without_relayer",
              {
                pack: packId,
                account_id,
                amount,
              },
              BigInt(attachedGas),
              BigInt(0),
            ),
          ],
          asDelegated: true,
        },
      ]);

      return resp;
    } catch (error) {
      console.error(error);
      console.log({ ...(error as any) });

      if (error instanceof TypedError && error.type === "NotEnoughBalance") {
        throw new MeteorActionError([
          EOldMeteorErrorId.merr_reward_redeem_failed,
          EOldMeteorErrorId.merr_reward_redeem_failed_no_gas,
        ]);
      }

      throw new MeteorActionError([EOldMeteorErrorId.merr_reward_redeem_failed]);
    }
  }

  async claimFtReward({
    reward_token_contract,
    account_id,
    amount,
  }: {
    reward_token_contract: string;
    account_id: string;
    amount: string;
  }) {
    // near call $CONTRACT claim_ft_reward '{"reward_token_contract": "mt2.testcandy.testnet", "account_id": "prelaunch.testnet", "amount": "20000"}'  --accountId prelaunch.testnet --gas 300000000000000

    try {
      const [resp] = await NearAccountSignerExecutor.getInstance(
        account_id,
        this.network,
      ).startTransactionsAwait([
        {
          receiverId: this.meteorRewardsContractId,
          actions: [
            actionCreators.functionCall(
              "claim_ft_reward",
              {
                reward_token_contract,
                amount,
                account_id,
              },
              BigInt(attachedGas),
              BigInt(0),
            ),
          ],
        },
      ]);

      return resp;
    } catch (error) {
      console.error(error);
      console.log({ ...(error as any) });

      if (error instanceof TypedError && error.type === "NotEnoughBalance") {
        throw new MeteorActionError([
          EOldMeteorErrorId.merr_reward_claim_ft_failed,
          EOldMeteorErrorId.merr_reward_claim_ft_failed_no_gas,
        ]);
      }

      throw new MeteorActionError([EOldMeteorErrorId.merr_reward_claim_ft_failed]);
    }
  }

  async claimNFTReward({
    reward_token_contract,
    account_id,
    token_id,
  }: {
    reward_token_contract: string;
    account_id: string;
    token_id: string;
  }) {
    // near call $CONTRACT claim_nft_reward '{"reward_token_contract": "mnft1.testcandy.testnet", "account_id": "prelaunch.testnet", "token_id": "14"}'  --accountId prelaunch.testnet --gas 300000000000000

    try {
      const [resp] = await NearAccountSignerExecutor.getInstance(
        account_id,
        this.network,
      ).startTransactionsAwait([
        {
          receiverId: this.meteorRewardsContractId,
          actions: [
            actionCreators.functionCall(
              "claim_nft_reward",
              {
                reward_token_contract,
                token_id,
                account_id,
              },
              BigInt(attachedGas),
              BigInt(0),
            ),
          ],
        },
      ]);

      return resp;
    } catch (error) {
      console.error(error);
      console.log({ ...(error as any) });

      if (error instanceof TypedError && error.type === "NotEnoughBalance") {
        throw new MeteorActionError([
          EOldMeteorErrorId.merr_reward_claim_nft_failed,
          EOldMeteorErrorId.merr_reward_claim_nft_failed_no_gas,
        ]);
      }

      throw new MeteorActionError([EOldMeteorErrorId.merr_reward_claim_nft_failed]);
    }
  }

  async viewUserRewardPoint({ network, accountId }: IWithAccountIdAndNetwork) {
    // near view mst.testcandy.testnet ft_balance_of '{"account_id": "zigang.testnet"}'
    const { result } = await this.rpcClient.call_function_object_args<string>({
      account_id: getMeteorPointsContractId(network),
      method_name: "ft_balance_of",
      args: {
        account_id: accountId,
      },
      finality: ENearRpc_Finality.optimistic,
    });

    return result;
  }

  async viewUserClaimableList({ account_id }: { account_id: string }) {
    // near view $CONTRACT view_user_reward '{"account_id": "prelaunch.testnet"}'
    const { result } = await this.rpcClient.call_function_object_args<IClaimableRewardsList>({
      account_id: this.meteorRewardsContractId,
      method_name: "view_user_reward",
      args: {
        account_id,
      },
    });

    return result;
  }

  async viewPackSoldQty() {
    // near view $CONTRACT get_pack_balance '[["pack", "1"]]'
    const { result } = await this.rpcClient.call_function_object_args({
      account_id: this.meteorRewardsContractId,
      method_name: "view_pack_token_balances",
      args: {},
    });

    return result;
  }

  // Notes: this is contract call itself, for backend use only
  // async claimContent({
  //   index,
  //   account_id,
  // }: {
  //   index: number
  //   account_id: string
  // }) {
  //   // near call $CONTRACT claim_content '{"index": 0, "account_id": "prelaunch.testnet"}'  --accountId $CONTRACT --gas 300000000000000

  //   const account = await this.nearApi.nativeApi.account(contractName)
  //   return await account.signAndSendTransaction({
  //     receiverId: contractName,
  //     actions: [
  //       functionCall(
  //         'claim_content',
  //         {
  //           index,
  //           account_id,
  //         },
  //         BigInt(attachedGas),
  //         BigInt(0)
  //       ),
  //     ],
  //   })
  // }
}

const nearNetwork: {
  [network in ENearNetwork]?: MeteorRewardService;
} = {};

export function getMeteorRewardService(network: ENearNetwork): MeteorRewardService {
  if (nearNetwork[network] != null) {
    return nearNetwork[network]!;
  }

  nearNetwork[network] = new MeteorRewardService(network);
  return nearNetwork[network]!;
}
