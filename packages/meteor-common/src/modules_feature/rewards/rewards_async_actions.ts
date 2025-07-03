import { createAsyncActionWithErrors } from "../../modules_utility/api_utilities/async_action_utils";
import { rewards_async_functions } from "./rewards_async_functions";

export const RewardsAsyncActions = {
  getRewardsList: createAsyncActionWithErrors(rewards_async_functions.getRewardsList),
  getUserPoint: createAsyncActionWithErrors(rewards_async_functions.getUserPoint),
  getUserRewardsList: createAsyncActionWithErrors(rewards_async_functions.getUserRewardsList),
  getUserClaimableList: createAsyncActionWithErrors(rewards_async_functions.getUserClaimableList),
  redeemReward: createAsyncActionWithErrors(rewards_async_functions.redeemReward),
  claimNTFReward: createAsyncActionWithErrors(rewards_async_functions.claimNTFReward),
  claimFTReward: createAsyncActionWithErrors(rewards_async_functions.claimFTReward),
  claimReward: createAsyncActionWithErrors(rewards_async_functions.claimReward),
  getUnopenRewards: createAsyncActionWithErrors(rewards_async_functions.getUnopenRewards),
  openRewards: createAsyncActionWithErrors(rewards_async_functions.openRewards),
  getRewardCount: createAsyncActionWithErrors(rewards_async_functions.getRewardCount),
};
