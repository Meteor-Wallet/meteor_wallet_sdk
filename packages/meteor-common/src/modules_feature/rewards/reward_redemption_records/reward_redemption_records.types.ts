import { DBI_RewardRedemptionRecord } from "./reward_redemption_records.dbi";

export type TRequestObject_RewardRedemptionRecord_Create = Pick<
  DBI_RewardRedemptionRecord,
  | "blockchain_id"
  | "network_id"
  | "wallet_id"
  | "pack_id"
  | "reward_item_id"
  | "reward_item_amount"
  | "redeem_trx_hash"
>;
