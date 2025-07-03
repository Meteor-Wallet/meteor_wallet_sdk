import { z } from "zod";
import { ENearNetwork } from "../../../modules_external/near/types/near_basic_types";
import { ERewardRedemptionRecordStatus } from "./reward_redemption_records.enum";

export enum EBlockchain {
  near = "near",
  ethereum = "ethereum",
}

export const ZSchema_DBI_RewardRedemptionRecord = z
  .object({
    id: z.number(),
    blockchain_id: z.nativeEnum(EBlockchain),
    network_id: z.nativeEnum(ENearNetwork),
    wallet_id: z.string(),
    status: z.nativeEnum(ERewardRedemptionRecordStatus),
    pack_id: z.string(),
    reward_item_id: z.string(),
    reward_item_amount: z.string(),
    redeem_trx_hash: z.string().optional(),
    claim_trx_hash: z.string().optional(),
    error_message: z.string().optional(),
    created_at: z.union([z.date(), z.string()]).optional(),
    updated_at: z.union([z.date(), z.string()]).optional(),
  })
  .strict();

export const ZRequestObject_RewardRedemptionRecord_Create = z.object({
  blockchain_id: z.nativeEnum(EBlockchain),
  network_id: z.nativeEnum(ENearNetwork),
  wallet_id: z.string(),
  pack_id: z.string(),
  reward_item_id: z.string(),
  reward_item_amount: z.string(),
  redeem_trx_hash: z.string().optional(),
});
