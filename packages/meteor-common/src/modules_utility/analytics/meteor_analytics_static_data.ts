import { ZodSchema } from "zod";
import { UnionToIntersection } from "../typescript_utils/special_types";
import {
  ZMeteorEventMeta_UserAction_ButtonClick,
  ZMeteorEventMeta_UserAction_ChangeLanguage,
  ZMeteorEventMeta_UserAction_ChangeNetwork,
  ZMeteorEventMeta_UserAction_ChangeTheme,
  ZMeteorEventMeta_UserAction_Voter_Registration_Attempt,
  ZMeteorEventMeta_UserAction_Voter_Registration_Onboarded,
  ZMeteorEventMeta_WalletAction_CreateWallet,
  ZMeteorEventMeta_WalletAction_HmTimeTravel,
  ZMeteorEventMeta_WalletAction_ImportWallet,
  ZMeteorEventMeta_WalletAction_LiquidDelayedUnstake,
  ZMeteorEventMeta_WalletAction_LiquidStake,
  ZMeteorEventMeta_WalletAction_LiquidUnstake,
  ZMeteorEventMeta_WalletAction_NormalStake,
  ZMeteorEventMeta_WalletAction_NormalUnstake,
  ZMeteorEventMeta_WalletAction_SendFtToken,
  ZMeteorEventMeta_WalletAction_SendNearToken,
  ZMeteorEventMeta_WalletAction_SendNft,
  ZMeteorEventMeta_WalletAction_SignInToDappFail,
  ZMeteorEventMeta_WalletAction_SignInToDappOk,
  ZMeteorEventMeta_WalletAction_SignInToDappRequest,
  ZMeteorEventMeta_WalletAction_SignOutOfDappFail,
  ZMeteorEventMeta_WalletAction_SignOutOfDappOk,
  ZMeteorEventMeta_WalletAction_SignOutOfDappRequest,
  ZMeteorEventMeta_WalletAction_SignTransactionFail,
  ZMeteorEventMeta_WalletAction_SignTransactionOk,
  ZMeteorEventMeta_WalletAction_SignTransactionRequest,
  ZMeteorEventMeta_WalletAction_Swap,
} from "./meteor_analytics_data_models";
import {
  EMeteorAnalytics_SubType_UserAction,
  EMeteorAnalytics_SubType_WalletAction,
} from "./meteor_analytics_enums";
import { TMeteorEventMeta_All } from "./types/meteor_analytics_app_types";
import { TMeteor_BigQueryTable_EventMetaExtras } from "./types/meteor_analytics_bigquery_types";

export const keyMapAppInputsToBigQuery: {
  [key in keyof UnionToIntersection<TMeteorEventMeta_All>]: keyof UnionToIntersection<TMeteor_BigQueryTable_EventMetaExtras>;
} = {
  path: "pv_path",
  queryString: "pv_queryString",
  viewedSeconds: "appHide_viewedSeconds",
  wHash: "wallet_hash",
  themeMode: "app_themeMode",
  wType: "wallet_type",
  importMethod: "walletImport_method",
  nearNetwork: "near_network",
  errorMessage: "error_message",
  nearAmount: "send_near_amount",
  rHash: "send_receiver_hash",
  ftContractId: "send_ft_contract_id",
  ftAmount: "send_ft_amount",
  ftSymbol: "ft_symbol",
  nftContractId: "send_nft_contract_id",
  nftTokenId: "send_nft_token_id",
  requestId: "sign_request_id",
  signContractId: "sign_contract_id",
  signContractMethod: "sign_method",
  trxHash: "sign_trx_hash",
  allowMethods: "signIn_allow_methods",
  allowType: "signIn_allow_type",
  appLanguage: "app_language",
  externalHost: "sign_external_host",
  trxOrd: "sign_trx_ord",
  actionOrd: "sign_action_ord",
  actionTotalOrd: "sign_action_total_ord",
  wId: "wallet_id",
  rId: "send_receiver_id",
  swapInTokenAmount: "swap_in_amount",
  swapInTokenContractId: "swap_in_contract_id",
  swapOutTokenAmount: "swap_out_amount",
  swapOutTokenContractId: "swap_out_contract_id",
  swapDollarValue: "swap_dollar_value",
  actionArgsJson: "trx_action_args_json",
  validatorId: "validator_id",
  stakeTokenAmount: "stake_token_amount",
  stakeTokenContractId: "stake_token_contract_id",
  unstakeTokenAmount: "unstake_token_amount",
  liquidStakeProviderId: "liquid_stake_provider_id",
  accountIds: "account_ids",
  accountId: "account_id",
  usdAmount: "usd_amount",
  stakeTokenSymbol: "stake_token_symbol",
  stakeTokenUsdAmount: "stake_token_usd_amount",
  swapInTokenSymbol: "swap_in_token_symbol",
  swapOutDollarValue: "swap_out_dollar_value",
  swapOutTokenSymbol: "swap_out_token_symbol",
  params: "wallet_id",
  trx_hash: "wallet_id",
  wallet_id: "wallet_id",
};

export const schemaForUserActionId: {
  [key in EMeteorAnalytics_SubType_UserAction]: ZodSchema | null;
} = {
  [EMeteorAnalytics_SubType_UserAction.unlock]: null,
  [EMeteorAnalytics_SubType_UserAction.change_language]: ZMeteorEventMeta_UserAction_ChangeLanguage,
  [EMeteorAnalytics_SubType_UserAction.change_network]: ZMeteorEventMeta_UserAction_ChangeNetwork,
  [EMeteorAnalytics_SubType_UserAction.change_theme]: ZMeteorEventMeta_UserAction_ChangeTheme,
  [EMeteorAnalytics_SubType_UserAction.voter_registration_attempt]:
    ZMeteorEventMeta_UserAction_Voter_Registration_Attempt,
  [EMeteorAnalytics_SubType_UserAction.voter_registration_onboarded]:
    ZMeteorEventMeta_UserAction_Voter_Registration_Onboarded,
  [EMeteorAnalytics_SubType_UserAction.button_click]: ZMeteorEventMeta_UserAction_ButtonClick,
};
export const schemaForWalletActionId: {
  [key in EMeteorAnalytics_SubType_WalletAction]: ZodSchema;
} = {
  [EMeteorAnalytics_SubType_WalletAction.create_wallet]: ZMeteorEventMeta_WalletAction_CreateWallet,
  [EMeteorAnalytics_SubType_WalletAction.import_wallet]: ZMeteorEventMeta_WalletAction_ImportWallet,
  [EMeteorAnalytics_SubType_WalletAction.send_ft]: ZMeteorEventMeta_WalletAction_SendFtToken,
  [EMeteorAnalytics_SubType_WalletAction.send_near]: ZMeteorEventMeta_WalletAction_SendNearToken,
  [EMeteorAnalytics_SubType_WalletAction.send_nft]: ZMeteorEventMeta_WalletAction_SendNft,
  [EMeteorAnalytics_SubType_WalletAction.sign_in_dapp_request]:
    ZMeteorEventMeta_WalletAction_SignInToDappRequest,
  [EMeteorAnalytics_SubType_WalletAction.sign_in_dapp_ok]:
    ZMeteorEventMeta_WalletAction_SignInToDappOk,
  [EMeteorAnalytics_SubType_WalletAction.sign_in_dapp_fail]:
    ZMeteorEventMeta_WalletAction_SignInToDappFail,
  [EMeteorAnalytics_SubType_WalletAction.sign_out_dapp_request]:
    ZMeteorEventMeta_WalletAction_SignOutOfDappRequest,
  [EMeteorAnalytics_SubType_WalletAction.sign_out_dapp_ok]:
    ZMeteorEventMeta_WalletAction_SignOutOfDappOk,
  [EMeteorAnalytics_SubType_WalletAction.sign_out_dapp_fail]:
    ZMeteorEventMeta_WalletAction_SignOutOfDappFail,
  [EMeteorAnalytics_SubType_WalletAction.sign_transaction_request]:
    ZMeteorEventMeta_WalletAction_SignTransactionRequest,
  [EMeteorAnalytics_SubType_WalletAction.sign_transaction_ok]:
    ZMeteorEventMeta_WalletAction_SignTransactionOk,
  [EMeteorAnalytics_SubType_WalletAction.sign_transaction_fail]:
    ZMeteorEventMeta_WalletAction_SignTransactionFail,
  [EMeteorAnalytics_SubType_WalletAction.swap]: ZMeteorEventMeta_WalletAction_Swap,
  [EMeteorAnalytics_SubType_WalletAction.normal_stake]: ZMeteorEventMeta_WalletAction_NormalStake,
  [EMeteorAnalytics_SubType_WalletAction.normal_unstake]:
    ZMeteorEventMeta_WalletAction_NormalUnstake,
  [EMeteorAnalytics_SubType_WalletAction.liquid_stake]: ZMeteorEventMeta_WalletAction_LiquidStake,
  [EMeteorAnalytics_SubType_WalletAction.liquid_unstake]:
    ZMeteorEventMeta_WalletAction_LiquidUnstake,
  [EMeteorAnalytics_SubType_WalletAction.liquid_delayed_unstake]:
    ZMeteorEventMeta_WalletAction_LiquidDelayedUnstake,
  [EMeteorAnalytics_SubType_WalletAction.hm_time_travel_tinker]:
    ZMeteorEventMeta_WalletAction_HmTimeTravel,
};
