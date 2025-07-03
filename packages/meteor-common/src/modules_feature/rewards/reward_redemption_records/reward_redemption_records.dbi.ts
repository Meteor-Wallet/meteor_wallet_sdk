import { z } from "zod";
import { ZSchema_DBI_RewardRedemptionRecord } from "./reward_redemption_records.zod";

export interface DBI_RewardRedemptionRecord
  extends z.infer<typeof ZSchema_DBI_RewardRedemptionRecord> {}
