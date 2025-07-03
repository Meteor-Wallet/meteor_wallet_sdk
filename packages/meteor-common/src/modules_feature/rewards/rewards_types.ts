import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";
import { ERewardAssetType } from "../harvest_moon/harvest_moon_enums";
import { EBlockchain } from "./reward_redemption_records/reward_redemption_records.zod";

export interface IPackPool {
  [key: string]: IAssetsPool[];
}

interface IAssetsPool {
  name: string;
  imageUrl: string;
  winRate: number;
}

export interface IRewardPackList {
  price: string;
  packId: string;
  packImageUrl: string;
  packName: string;
  packLeft: number;
  packTotalSupply: number;
  packDescription: string;
  prizePool: IAssetsPool[];
  packPromote: string[];
  requiredCode?: string;
  redeemAndClaim?: boolean;
}

export interface IClaimableList {
  id: string;
  assetType: "Mystery Gift" | "FT" | "NFT";
  name: string;
  imageUrl: string;
  tokenAmount?: number;
  nftId?: string;
  content?: string;
  contractId?: string;
  decimal?: number;
  nftDescription?: string;
}

export interface IRewardPackAsset {
  weight: number;
  asset_id: string;
  asset_type: string;
  display_name: string;
  maximum_reward_amount: number;
  minimum_reward_amount: number;
}

export interface IRewardPack {
  id: number;
  price: number;
  supply: number;
  description: string;
  display_name: string;
  display_image: string;
  reward_pack_assets: IRewardPackAsset[];
}

export interface IRewardPacksPublishRecord {
  id: number;
  blockchain_id: EBlockchain;
  network_id: ENearNetwork;
  comment: string;
  reward_packs: IRewardPack[];
  created_at: Date;
  updated_at: Date;
}

export enum ETokenType {
  FT = "FT",
  NFT = "NFT",
  CONTENT = "CONTENT",
}

export interface ICreateMeteorRewardRedemptionRecord {
  data: {
    blockchain_id: EBlockchain;
    network_id: ENearNetwork;
    wallet_id: string;
    pack_id: string;
    reward_item_id: string;
    reward_item_amount: string;
    redeem_trx_hash: string;
  };
}

export enum ERewardStatus {
  unopen = "unopen",
  created = "created",
  claimed = "claimed",
  claimed_optimistic = "claimed_optimistic",
  expired = "expired",
  failed = "failed",
}

export enum ERewardSourceType {
  telegram_referral = "telegram_referral",
  harvest_hours_milestone_achieved = "harvest_hours_milestone_achieved",
  mission = "mission",
  harvest_drop = "harvest_drop",
  stake_with_meteor = "stake_with_meteor",
  exchange_with_asset = "exchange_with_asset",
  referral_rookie_mission = "referral_rookie_mission",
  external_campaign = "external_campaign",
  harvest_token_drop = "harvest_token_drop",
  defi_card_registration = "defi_card_registration",
}
export interface IReward {
  id: number;
  blockchain_id: string;
  network_id: ENearNetwork;
  wallet_id: string;
  reward_asset_type: ERewardAssetType;
  reward_asset_id: string;
  reward_asset_amount: string;
  reward_trx_hash: string;
  reward_status: ERewardStatus;
  reward_source_type: ERewardSourceType;
  reward_source_id: string | null;
  reward_source_value: string | null;
  reward_deduplication_id: string;
  reward_optimistic_claimed_at?: Date;
  reward_date_created: Date;
  reward_date_claimed: Date | null;
  reward_date_expired: Date | null;
  reward_date_failed: Date | null;
}
