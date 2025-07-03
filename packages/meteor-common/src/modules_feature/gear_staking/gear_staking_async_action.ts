import { createAsyncActionWithErrors } from "../../modules_utility/api_utilities/async_action_utils";
import { gear_staking_async_functions } from "./gear_staking_async_function";

export const gear_staking_async_action = {
  getGearPrice: createAsyncActionWithErrors(gear_staking_async_functions.getGearPrice),
  getGearStakingOptions: createAsyncActionWithErrors(
    gear_staking_async_functions.getGearStakingOptions,
  ),
  getGearStakingRecords: createAsyncActionWithErrors(
    gear_staking_async_functions.getGearStakingRecords,
  ),
  getGearStakingRecordsWithUnclaimedRewards: createAsyncActionWithErrors(
    gear_staking_async_functions.getGearStakingRecordsWithUnclaimedRewards,
  ),
  stakeGear: createAsyncActionWithErrors(gear_staking_async_functions.stakeGear),
  unstakeGear: createAsyncActionWithErrors(gear_staking_async_functions.unstakeGear),
  claimRewards: createAsyncActionWithErrors(gear_staking_async_functions.claimRewards),
};
