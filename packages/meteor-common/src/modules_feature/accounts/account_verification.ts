import { z } from "zod";
import { ESupportedHardwareWalletType } from "../hardware_wallet/hardware_wallet_types";
import { EAccountKeyType } from "./account_types";

export const zod_hardwareKey = z.object({
  keyType: z.literal(EAccountKeyType.HARDWARE),
  path: z.string().min(3),
  hardwareType: z.literal(ESupportedHardwareWalletType.LEDGER),
  publicKey: z.string().min(3),
});

export const zod_localKey = z.object({
  keyType: z.literal(EAccountKeyType.LOCAL_PRIVATE_KEY),
  publicKey: z.string().min(3),
  privateKey: z.string().min(3),
  recovery: z.any().optional(),
  phrase: z.string().optional(),
});

export const zod_accountKey = z.union([zod_hardwareKey, zod_localKey]);
