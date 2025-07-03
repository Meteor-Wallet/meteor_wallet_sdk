import { EThemeMode } from "../../../modules_app_core/theme/ThemeStatic";
import { ELanguage } from "../../../modules_app_core/translation/translation_types";
import { ENearNetwork } from "../../../modules_external/near/types/near_basic_types";
import { EMeteorWalletSignInType } from "../../../modules_feature/dapp_connect/types_dappConnect";
import { EDataVersion, EMeteorAnalytics_EventType } from "../meteor_analytics_enums";

export interface IMeteor_BigQueryTable_NonEventExtras {
  geo_city?: string;
  geo_country?: string;
  geo_continent?: string;
  geo_colo?: string;
  geo_timezone?: string;
  geo_region?: string;
  geo_regionCode?: string;
  httpProtocol?: string;
  host?: string;
  userAgent?: string;
  workerId?: string;
  cf_ray?: string;
  asOrg?: string;
  asn?: number;
  // geo_metroCode?: string;
  timestamp: Date;
  data_version: EDataVersion;
  // geo_postalCode?: string;
  // geo_lat?: string;
  // geo_lon?: string;
  // c_ip?: string;
}

export interface IMeteor_BigQueryTable_AppEvent_Base {
  eventType: EMeteorAnalytics_EventType;
  eventSubTypeId?: string;
  app_anonId?: string;
  app_memSessionId?: string;
  app_longSessionId?: string;
  app_driver?: string;
  app_release?: string;
  app_version?: string;
}

export interface IMeteor_BigQueryTable_EventMeta_Initialized {
  app_themeMode: EThemeMode;
  app_language: ELanguage;
}

export interface IMeteor_BigQueryTable_EventMeta_PageView {
  pv_path?: string;
  pv_queryString?: string;
  wallet_hash?: string;
  wallet_id?: string;
  near_network?: string;
}

export interface IMeteor_BigQueryTable_EventMeta_AppHide {
  appHide_viewedSeconds?: number;
  app_themeMode?: EThemeMode;
}

export interface IMeteor_BigQueryTable_EventMeta_UserAction_ChangeTheme {
  app_themeMode: EThemeMode;
}

export interface IMeteor_BigQueryTable_EventMeta_UserAction_ChangeNetwork {
  near_network: ENearNetwork;
}

export interface IMeteor_BigQueryTable_EventMeta_UserAction_ChangeLanguage {
  app_language: ELanguage;
}

export interface IMeteor_BigQueryTable_EventMeta_UserAction_VoterRegistrationAttempt {
  account_ids: string[];
}

export interface IMeteor_BigQueryTable_EventMeta_UserAction_VoterRegistrationOnboarded {
  account_id: string;
}

export interface IMeteor_BigQueryTable_EventMeta_WalletAction_Base {
  wallet_hash: string;
  wallet_id: string;
  near_network: ENearNetwork;
}

export interface IMeteor_BigQueryTable_EventMeta_WalletAction_CreateWallet
  extends IMeteor_BigQueryTable_EventMeta_WalletAction_Base {
  wallet_type: string;
}

export interface IMeteor_BigQueryTable_EventMeta_WalletAction_ImportWallet
  extends IMeteor_BigQueryTable_EventMeta_WalletAction_Base {
  wallet_type: string;
  walletImport_method: string;
}

export interface IMeteor_BigQueryTable_EventMeta_WalletAction_SendNear
  extends IMeteor_BigQueryTable_EventMeta_WalletAction_Base {
  send_near_amount: number;
  send_receiver_id: string;
  send_receiver_hash: string;
  usd_amount: number;
  ft_symbol: number;
}

export interface IMeteor_BigQueryTable_EventMeta_WalletAction_SendFtToken
  extends IMeteor_BigQueryTable_EventMeta_WalletAction_Base {
  send_ft_amount: number;
  send_ft_contract_id: string;
  send_receiver_id: string;
  send_receiver_hash: string;
  usd_amount: number;
  ft_symbol: number;
}

export interface IMeteor_BigQueryTable_EventMeta_WalletAction_SendNft
  extends IMeteor_BigQueryTable_EventMeta_WalletAction_Base {
  send_nft_contract_id: string;
  send_nft_token_id: string;
  send_receiver_id: string;
  send_receiver_hash: string;
}

export interface IMeteor_BigQueryTable_EventMeta_WalletAction_Swap
  extends IMeteor_BigQueryTable_EventMeta_WalletAction_Base {
  swap_in_amount: number;
  swap_in_contract_id: string;
  swap_out_amount: number;
  swap_out_contract_id: string;
  swap_dollar_value: number;
  swap_in_token_symbol: number;
  swap_out_dollar_value: number;
  swap_out_token_symbol: number;
}

export interface IMeteor_BigQueryTable_EventMeta_WalletAction_NormalStake
  extends IMeteor_BigQueryTable_EventMeta_WalletAction_Base {
  stake_token_contract_id: string;
  stake_token_amount: number;
  validator_id: string;
  stake_token_symbol: number;
  stake_token_usd_amount: number;
}

export interface IMeteor_BigQueryTable_EventMeta_WalletAction_NormalUnstake
  extends IMeteor_BigQueryTable_EventMeta_WalletAction_Base {
  stake_token_contract_id: string;
  unstake_token_amount: number;
  validator_id: string;
}

export interface IMeteor_BigQueryTable_EventMeta_WalletAction_LiquidStake
  extends IMeteor_BigQueryTable_EventMeta_WalletAction_Base {
  liquid_stake_provider_id: string;
  stake_token_contract_id: string;
  stake_token_amount: number;
  stake_token_symbol: number;
  stake_token_usd_amount: number;
}

export interface IMeteor_BigQueryTable_EventMeta_WalletAction_LiquidUnstake
  extends IMeteor_BigQueryTable_EventMeta_WalletAction_Base {
  liquid_stake_provider_id: string;
  stake_token_contract_id: string;
  unstake_token_amount: number;
}

export interface IMeteor_BigQueryTable_EventMeta_WalletAction_LiquidDelayedUnstake
  extends IMeteor_BigQueryTable_EventMeta_WalletAction_Base {
  liquid_stake_provider_id: string;
  stake_token_contract_id: string;
  unstake_token_amount: number;
  validator_id: string;
}

export interface IMeteor_BigQueryTable_EventMeta_WalletAction_SignTransaction_Request
  extends IMeteor_BigQueryTable_EventMeta_WalletAction_Base {
  sign_request_id: string;
  sign_contract_id: string;
  sign_method?: string;
  sign_trx_ord: number;
  sign_action_ord: number;
  sign_action_total_ord: number;
  send_near_amount?: number;
  send_ft_contract_id?: string;
  send_ft_amount?: number;
  send_nft_contract_id?: string;
  send_nft_token_id?: string;
  sign_external_host: string;
  trx_action_args_json: any;
}

export interface IMeteor_BigQueryTable_EventMeta_WalletAction_SignTransaction_Ok
  extends IMeteor_BigQueryTable_EventMeta_WalletAction_SignTransaction_Request {
  sign_trx_hash: string;
}

export interface IMeteor_BigQueryTable_EventMeta_WalletAction_SignTransaction_Fail
  extends IMeteor_BigQueryTable_EventMeta_WalletAction_SignTransaction_Request {
  sign_trx_hash?: string;
  error_message: string;
}

export interface IMeteor_BigQueryTable_EventMeta_WalletAction_SignInDapp_Request
  extends IMeteor_BigQueryTable_EventMeta_WalletAction_Base {
  sign_request_id: string;
  sign_contract_id: string;
  signIn_allow_methods: string[];
  signIn_allow_type: EMeteorWalletSignInType;
  sign_external_host: string;
}

export interface IMeteor_BigQueryTable_EventMeta_WalletAction_SignInDapp_Ok
  extends IMeteor_BigQueryTable_EventMeta_WalletAction_SignInDapp_Request {}

export interface IMeteor_BigQueryTable_EventMeta_WalletAction_SignInDapp_Fail
  extends IMeteor_BigQueryTable_EventMeta_WalletAction_SignInDapp_Request {
  error_message: string;
}

export interface IMeteor_BigQueryTable_EventMeta_WalletAction_SignOutDapp_Request
  extends IMeteor_BigQueryTable_EventMeta_WalletAction_Base {
  sign_request_id: string;
  sign_contract_id: string;
  sign_external_host: string;
}

export interface IMeteor_BigQueryTable_EventMeta_WalletAction_SignOutDapp_Ok
  extends IMeteor_BigQueryTable_EventMeta_WalletAction_SignOutDapp_Request {}

export interface IMeteor_BigQueryTable_EventMeta_WalletAction_SignOutDapp_Fail
  extends IMeteor_BigQueryTable_EventMeta_WalletAction_SignOutDapp_Request {
  error_message: string;
}

export type TMeteor_BigQueryTable_EventMetaExtras =
  | IMeteor_BigQueryTable_EventMeta_Initialized
  | IMeteor_BigQueryTable_EventMeta_PageView
  | IMeteor_BigQueryTable_EventMeta_AppHide
  | IMeteor_BigQueryTable_EventMeta_UserAction_ChangeNetwork
  | IMeteor_BigQueryTable_EventMeta_UserAction_ChangeTheme
  | IMeteor_BigQueryTable_EventMeta_UserAction_ChangeLanguage
  | IMeteor_BigQueryTable_EventMeta_UserAction_VoterRegistrationAttempt
  | IMeteor_BigQueryTable_EventMeta_UserAction_VoterRegistrationOnboarded
  | IMeteor_BigQueryTable_EventMeta_WalletAction_SendNear
  | IMeteor_BigQueryTable_EventMeta_WalletAction_SendFtToken
  | IMeteor_BigQueryTable_EventMeta_WalletAction_SendNft
  | IMeteor_BigQueryTable_EventMeta_WalletAction_Swap
  | IMeteor_BigQueryTable_EventMeta_WalletAction_NormalStake
  | IMeteor_BigQueryTable_EventMeta_WalletAction_NormalUnstake
  | IMeteor_BigQueryTable_EventMeta_WalletAction_LiquidStake
  | IMeteor_BigQueryTable_EventMeta_WalletAction_LiquidUnstake
  | IMeteor_BigQueryTable_EventMeta_WalletAction_LiquidDelayedUnstake
  | IMeteor_BigQueryTable_EventMeta_WalletAction_SignTransaction_Request
  | IMeteor_BigQueryTable_EventMeta_WalletAction_SignTransaction_Ok
  | IMeteor_BigQueryTable_EventMeta_WalletAction_SignTransaction_Fail
  | IMeteor_BigQueryTable_EventMeta_WalletAction_SignInDapp_Request
  | IMeteor_BigQueryTable_EventMeta_WalletAction_SignInDapp_Ok
  | IMeteor_BigQueryTable_EventMeta_WalletAction_SignInDapp_Fail
  | IMeteor_BigQueryTable_EventMeta_WalletAction_SignOutDapp_Request
  | IMeteor_BigQueryTable_EventMeta_WalletAction_SignOutDapp_Ok
  | IMeteor_BigQueryTable_EventMeta_WalletAction_SignOutDapp_Fail
  | IMeteor_BigQueryTable_EventMeta_WalletAction_CreateWallet
  | IMeteor_BigQueryTable_EventMeta_WalletAction_ImportWallet;

export type TMeteor_BigQueryTable_AppEvents = IMeteor_BigQueryTable_AppEvent_Base &
  TMeteor_BigQueryTable_EventMetaExtras;

export type TMeteor_BigQueryTable_AppEvents_Full = IMeteor_BigQueryTable_AppEvent_Base &
  IMeteor_BigQueryTable_NonEventExtras &
  TMeteor_BigQueryTable_EventMetaExtras & {
    id: string;
  };
