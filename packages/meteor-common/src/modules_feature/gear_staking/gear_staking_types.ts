export interface IGearStaking_StakingOption {
  name: string;
  description: string;
  nano_seconds: number;
  reward_multiplier_in_percentage: number;
  image_url: string;
}

export interface IGearStaking_StakingRecord {
  created_at: number; // timestamp in nanoseconds
  mature_timestamp: number; // timestamp in nanoseconds
  rewards_claimed: string;
  rewards_per_second: string;
  display_rewards_per_day: string;
  staked_amount: string;
}

export interface IGearStaking_StakingRecordWithUnclaimedReward {
  unclaimed_reward: string;
  staking_record: IGearStaking_StakingRecord;
}

export type TGearStaking_StakingRecordNormalized = IGearStaking_StakingRecord & {
  unclaimed_reward: string;
};
