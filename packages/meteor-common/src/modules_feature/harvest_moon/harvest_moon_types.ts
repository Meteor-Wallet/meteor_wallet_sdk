import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";
import { IWithAccountIdAndNetwork } from "../../modules_external/near/types/near_input_helper_types";
import { ITelegramData } from "../../modules_external/telegram/telegram.types";
import {
  EHM_Exchange_InputAsset,
  EHM_Exchange_OutputAsset,
  EHM_UnionContractTypes,
  EHarvestMoon_TinkerRarity,
  ERewardAssetType,
} from "./harvest_moon_enums";

export interface ISpaceTinkerObject {
  id: number;
  name: string;
  description: string;
  production_rate_per_hour: string;
  rarity: EHarvestMoon_TinkerRarity;
  img_url: string;
  img_hidden_url: string;
}

export interface ITinkerFusionObject {
  id: number;
  moon_cost: number;
  base_success_rate: number;
  gear_cost: number;
  boosted_success_rate: number;
}

export type TSpaceTinkerActive = Pick<
  ISpaceTinkerObject,
  "name" | "img_url" | "rarity" | "id" | "production_rate_per_hour"
> & {
  quantity: number;
  active: number;
};

export interface IAcademyObject {
  id: number;
  name: string;
  description: string;
  img_url: string;
  required_asset_type: string;
  required_asset_id: string;
  required_asset_amount: number;
  odd: number[][];
}

export interface IVaultLevelObject {
  level: number;
  moon_required_to_level_up: number;
  vault_storage_capacity_in_nanoseconds: number;
}

export interface ILabLevelObject {
  level: number;
  moon_required_to_level_up: number;
  lab_headcount_capacity: number;
}

export interface IUnionContractObject {
  id: number;
  name: string;
  description: string;
  required_asset_type: string;
  required_asset_id: string;
  required_asset_amount: number;
  image_url: string;
  odd: number[][];
}

export interface IHarvestMoonGameplayConfig {
  config_version: number;
  space_tinkers: ISpaceTinkerObject[];
  academies: IAcademyObject[];
  vault_levels: IVaultLevelObject[];
  lab_levels: ILabLevelObject[];
  union_contracts: IUnionContractObject[];
  relic_contract: string;
}

export interface IHarvestMoonAccountData {
  deployed_space_tinkers: number[];
  last_harvested_at: number;
  referrer_id: string | null;
  space_tinkers: {
    [key: number]: number;
  };
  space_tinkers_production_per_hour: string;
  vault_level: number;
  lab_level: number;
  gear_level: number;
  tinker_staked: any[];
  staked_relics: IHarvestMoonStakedRelics[];
  production_per_hour: string;
  boosted_rate_in_percentage: number;
}

export interface IHarvestMoonStakedRelics {
  relic_nft_contract_id: string;
  relic_nft_token_id: string;
  multiplier_in_percent: number;
  staked_at: number;
  maturity_at: number;
}

export interface IHarvestMoonState {
  showed_abuse_announcement_modal: boolean;
  showed_promo_modal: boolean;
  joined_meteor_on_telegram: boolean;
  joined_meteor_on_x: boolean;
  linkToTgModal?: {
    accountId: string;
    network: ENearNetwork;
    shouldHide: boolean;
  }[];
  trigger_show_configure_rpc_modal: boolean;
  trigger_show_import_token_modal: boolean;
  init_message: string | null;
  showed_campaign_page: boolean;
  dont_show_campaign_ids?: number[];
  last_show_campaign_id?: number;
  show_campaign_tooltip: boolean;
}

export interface IHarvestMoonReferralStats {
  referralCount: number;
  referralMoonEarned: string; // in native integer format (moon is converted with 8 decimal places, I think)
  telegramReferralLink: string;
  twitterPostLink: string;
  telegramReferralLinkWithoutRedirect: string;
  primaryWalletId?: string;
  referrerTelegramUsername?: string;
  referrerWalletId?: string;
}

export type THarvestUnclaimedReward = Record<ERewardAssetType, Record<string, number>>;

export type TWeightedRandomResult<T> = {
  item: T;
  cumulativeWeights: { item: T; weight: number; cumulativeWeight: number }[];
  randomNumber: number;
};

export interface IHarvestMoonHarvestResponse {
  accountInfo: IHarvestMoonAccountData;
  harvestData: {
    harvested_amount: number;
    referrer_account_id: string | null;
    referrer_harvested_amount: number | null;
    token_drop_results?: {
      campaign_id: string;
      harvest_time_win_odd: number;
      random_reward_interval: number | null;
      random_win_odd: number;
      // null means lose.
      reward_token_amount: string | null;
      reward_token_id: string;
    }[];
  };
  gifts: IHarvestMoonGiftFromHarvest[];
  harvestCount: number;
  totalHarvestedHours: string;
  rank: number;
  totalRank: number;
  contractTypeOdds: TWeightedRandomResult<EHM_UnionContractTypes> | null;
  dropOdds: TWeightedRandomResult<boolean> | null;
  tokenDropResultWithStatus: {
    campaign_id: string;
    mint_result?: "success" | "failed";
    random_result: "win" | "lose";
    error_message?: string;
    harvest_time_win_odd: number;
    random_win_odd: number;
    campaign_name?: string;
    reward_token_amount: string | null;
    reward_token_id?: string;
    reward_token_decimal?: number;
  }[];
}

export interface IHarvestMoonOddBarDetails {
  noDropEndHeight: number;
  basicEndHeight: number;
  advancedEndHeight: number;
  expertEndHeight: number;
  pointerPos: number;
}

export interface IHarvestMoonGiftFromHarvest {
  assetType: ERewardAssetType;
  assetId: EHM_UnionContractTypes;
  amount: string;
}

export interface IHarvestMoonRecruitTinker {
  union_contract_type: EHM_UnionContractTypes;
  tinker_count: number;
}

export interface IHarvestMoonUpgradeTinker {
  tinkerId: number;
  quantity: number;
}

export interface IHarvestMoonTierCondition {
  icon_id: "thumbs_up" | "fire_fill";
  isPrimary: boolean;
  title: string;
  description: string;
  isSatisfied: boolean;
}

export interface IHarvestMoonReleaseInfo {
  version: "alpha" | "beta" | "public";
  walletIds: string[];
}

export interface IOHarvestMoonContract extends IWithAccountIdAndNetwork {
  harvestMoonContractId: string;
}

export interface IOHarvestMoonTelegramData extends IWithAccountIdAndNetwork {
  telegramData: ITelegramData;
}

export interface IOHarvestMoonGetContractDropRate {
  vault_level: number;
}

export interface IHarvestMoon_Rank {
  wallet_id: string;
  rank: string;
  production_rate_per_hour: number;
  boosted_rate_in_percentage: number;
}

export interface IHarvestMoon_LeaderBoardResponse {
  top_10: IHarvestMoon_Rank[];
  my_rank: IHarvestMoon_Rank;
  number_of_players: number;
}

export interface IHarvestMoon_LeaderBoardMissionResponse {
  userRank: {
    wallet_id: string;
    rank: number;
    streakCount: number;
    volume: string;
  };
  topUsers: Array<{
    wallet_id: string;
    rank: number;
    streakCount: number;
    volume: string;
  }>;
  totalUserCount: number;
}

export interface IHarvestMoon_TinkerUpgradeResponse {
  tinker: number;
  status: string;
  trx_hash: string;
}

export interface IHarvestMoon_ContractDropResponse {
  dropId: string;
  vault_level: number;
  chance_to_get_contract_per_hour: number;
  basic_rate: number;
  advanced_rate: number;
  expert_rate: number;
}

export type THarvestMoonUnionContractRecord = Record<EHM_UnionContractTypes, number | "-">;

export interface IHarvestMoonRelic {
  nft_contract_id: string;
  nft_series_id: string;
  name: string;
  description: string;
  image_url: string;
  multiplier_in_percent: number;
  maturity_duration_in_nanoseconds: number;
  odd_weightage: number;
}

export interface IHarvestMoonRelicWithNftInfo extends IHarvestMoonRelic {
  nft_token_id: string;
  nft_image_url: string;
}

export interface IHarvestMoonGearLevel {
  level: number;
  moon_required_to_level_up: number;
  relic_capacity: number;
}

export type THarvestMoonHarvestState = "idle" | "harvesting" | "ready" | "opening" | "opened";

export type THarvestMoonTinkerUpgradeStateStart =
  | "start-intern"
  | "start-researcher"
  | "start-scientist"
  | "start-genius";

export type THarvestMoonTinkerUpgradeStateSuccess =
  | "success-researcher"
  | "success-scientist"
  | "success-genius"
  | "success-brain";

export type THarvestMoonTinkerUpgradeState =
  | "idle"
  | THarvestMoonTinkerUpgradeStateStart
  | THarvestMoonTinkerUpgradeStateSuccess
  | "fail";

export type THM_ExchangeAsset = {
  id: EHM_Exchange_InputAsset | EHM_Exchange_OutputAsset;
  image: string;
  name: string;
};

export interface IConversionRateItem extends THM_ExchangeAsset {
  quantity: number;
}

export interface IHM_Exchange_Route {
  input: THM_ExchangeAsset;
  output: THM_ExchangeAsset;
  fromToRate: number; // 5000 equal to 5000 to 1 in conversion rate
}

export interface IExchangeContractObject {
  image: string;
  name: string;
}

export interface IAbuserObject {
  wallet_id: string;
  contract_type?: number;
  tinker_type?: number;
  to_be_removed: number;
}

export interface IAbuserContractObject {
  wallet_id: string;
  exchange_hash: string;
  reward_asset_id: number;
  count: number;
}

export type TTokenDropCampaignStatus = "ACTIVE" | "PAUSED" | "ENDED";

export interface ITokenDropCampaignHowTo {
  image: string;
  title?: string;
  description: string;
  progress?: {
    title: string;
    percentage: number;
  }[];
}

export interface ITokenDropCampaign {
  unique_id: string;
  total_reward_in_usd: number;
  isEnrolled: boolean;
  id: number;
  custom_key: string;
  network_id: ENearNetwork;
  banner_img_src: null | string;
  reward_itm_img_src: null | string;
  reward_token_id: string;
  min_reward_amount: string;
  max_reward_amount: string;
  start_date: Date;
  end_date?: Date;
  status: TTokenDropCampaignStatus;
  available_reward_count: string;
  reward_given_count: string;
  reward_interval: string;
  reward_token_decimal: number;
  criteria_list: [
    {
      key: string;
      value: string | number;
      operator: "==" | ">=" | "<=" | ">" | "<" | "!=";
      description: string;
    },
  ];
  isFulfilled: null | boolean;
  criteriaFulfillment:
    | null
    | {
        isFulfilled: boolean;
        requirement: number;
        progress: number;
        progressBreakdown?: {
          referrals: {
            account_id: string;
            tinker_count: number;
            required_tinker_count: number;
          }[];
        };
        description: string;
        key: string;
      }[];
}

export interface IRaffleEntryRecord {
  trx_hash: string;
  deposit_amount: string;
  created_at: string;
}

export type TRaffleRewardStatus = "claimed" | "claimable" | "not_qualified";
