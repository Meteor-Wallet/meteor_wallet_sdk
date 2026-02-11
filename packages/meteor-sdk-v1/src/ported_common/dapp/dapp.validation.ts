import { z } from "zod";
import { EMeteorWalletSignInType } from "./dapp.enums";

export const ZO_DappSignInAction_Contract_Base = z.object({
  contract_id: z.string(),
  public_key: z.string(),
});

export const ZO_DappSignInAction_Contract_SelectedMethods = ZO_DappSignInAction_Contract_Base.merge(
  z.object({
    type: z.literal(EMeteorWalletSignInType.SELECTED_METHODS),
    methods: z.array(z.string()).min(1),
  }),
);

export const ZO_DappSignInAction_Contract_AllMethods = ZO_DappSignInAction_Contract_Base.merge(
  z.object({
    type: z.literal(EMeteorWalletSignInType.ALL_METHODS),
    methods: z.undefined().optional(),
  }),
);

export const ZO_DappSignInAction_AccountOnly = z.object({
  type: z.literal(EMeteorWalletSignInType.ACCOUNT_ONLY),
});

// export const ZO_DappSignInAction_AccountAndSignMessage = z.object({
//   type: z.literal(EMeteorWalletSignInType.ACCOUNT_AND_SIGN_MESSAGE),
//   messageParams: z.any(),
// });

export const ZO_DappSignInAction_Combined = ZO_DappSignInAction_Contract_SelectedMethods.or(
  ZO_DappSignInAction_Contract_AllMethods,
).or(ZO_DappSignInAction_AccountOnly);
// .or(ZO_DappSignInAction_AccountAndSignMessage);

export const ZO_DappSignTransactionAction_UrlQuery = z.object({
  callback_url: z.string().min(2),
  transactions: z.string().min(2),
  meta: z.string().optional(),
});
