export enum EDataVersion {
  initial = "0",
  _2022112400 = "2022112400",
}

export enum EMeteorAnalytics_EventType {
  test = "test",
  page_view = "page_view",
  app_hidden = "app_hidden",
  app_visible = "app_visible",
  user_action = "user_action",
  wallet_action = "wallet_action",
  initialized = "initialized",
}

export enum EMeteorAnalytics_SubType_WalletAction {
  send_near = "send_near",
  send_ft = "send_ft",
  send_nft = "send_nft",
  swap = "swap",
  normal_stake = "normal_stake",
  normal_unstake = "normal_unstake",
  liquid_stake = "liquid_stake",
  liquid_unstake = "liquid_unstake",
  liquid_delayed_unstake = "liquid_delayed_unstake",
  import_wallet = "import_wallet",
  create_wallet = "create_wallet",
  sign_transaction_request = "sign_transaction_request",
  sign_transaction_ok = "sign_transaction_ok",
  sign_transaction_fail = "sign_transaction_fail",
  sign_in_dapp_request = "sign_in_dapp_request",
  sign_in_dapp_ok = "sign_in_dapp_ok",
  sign_in_dapp_fail = "sign_in_dapp_fail",
  sign_out_dapp_request = "sign_out_dapp_request",
  sign_out_dapp_ok = "sign_out_dapp_ok",
  sign_out_dapp_fail = "sign_out_dapp_fail",
  hm_time_travel_tinker = "hm_time_travel_tinker",
}

export enum EMeteorAnalytics_SubType_UserAction {
  unlock = "unlock",
  change_network = "change_network",
  change_theme = "change_theme",
  change_language = "change_language",
  voter_registration_attempt = "voter_registration_attempt",
  voter_registration_onboarded = "voter_registration_onboarded",
  button_click = "button_click",
}

export enum EMeteorAnalytics_AppReleaseEnvironment {
  dev_local = "dev_local",
  dev_live = "dev_live",
  staging_live = "staging_live",
  production = "production",
}
