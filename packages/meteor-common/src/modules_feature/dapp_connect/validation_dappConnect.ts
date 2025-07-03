import { z } from "zod";
import { EMeteorWalletSignInType } from "./types_dappConnect";

export const ZO_DappSignInAction_Base = z.object({
  contract_id: z.string(),
  // callback_url: z.string(),
  // network: z.nativeEnum(ENearNetwork),
  public_key: z.string(),
});

export const ZO_DappSignInAction_SelectedMethods = ZO_DappSignInAction_Base.merge(
  z.object({
    type: z.literal(EMeteorWalletSignInType.SELECTED_METHODS),
    methods: z.array(z.string()).min(1),
  }),
);

export const ZO_DappSignInAction_AllMethods = ZO_DappSignInAction_Base.merge(
  z.object({
    type: z.literal(EMeteorWalletSignInType.ALL_METHODS),
    methods: z.undefined().optional(),
  }),
);

export const ZO_DappSignInAction_Combined = ZO_DappSignInAction_SelectedMethods.or(
  ZO_DappSignInAction_AllMethods,
);

export const ZO_DappSignTransactionAction_UrlQuery = z.object({
  callback_url: z.string().min(2),
  transactions: z.string().min(2),
  meta: z.string().optional(),
});
