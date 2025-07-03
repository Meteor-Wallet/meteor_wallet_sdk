import { z } from "zod";

export const ZRequestObject_RelayTransaction = z
  .object({
    // base64 encoded signed delegate buffer
    signedDelegateBase64: z.string(),
    networkId: z.union([z.literal("mainnet"), z.literal("testnet")]),
    rpcUrl: z.string().optional(),
  })
  .strict();

export interface IRequestObject_RelayTransaction
  extends z.infer<typeof ZRequestObject_RelayTransaction> {}
