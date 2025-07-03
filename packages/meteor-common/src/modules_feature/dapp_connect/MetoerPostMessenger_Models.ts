import { z } from "zod";
import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";
import { EDappActionConnectionStatus, EExternalActionType } from "./types_dappConnect";

export const ZO_PostMessageBase = z.object({
  uid: z.string().min(8),
  status: z.nativeEnum(EDappActionConnectionStatus),
  actionType: z.nativeEnum(EExternalActionType),
  endTags: z.array(z.string()),
  network: z.nativeEnum(ENearNetwork),
});
