export enum EHarvestMoon_Menu {
  home = "home",
  lab = "lab",
  tinker = "tinker",
  referral = "referral",
  quest = "quest",
  setting = "setting",
}

export enum EHarvestMoon_TinkerGuideModalPhase {
  active_tinker = "active_tinker",
  union_contract = "union_contract",
}

export enum EHarvestMoon_TinkerRarity {
  common = "common",
  uncommon = "uncommon",
  rare = "rare",
  epic = "epic",
  legendary = "legendary",
}

export enum EHarvestMoon_RelicRarity {
  common = "common",
  uncommon = "uncommon",
  rare = "rare",
  legendary = "legendary",
}

export enum EHM_UnionContractTypes {
  basic = "1",
  advanced = "2",
  expert = "3",
}

export enum EHarvestMoon_SmartContractMethods {
  get_configs = "get_configs",
  view_account_info = "view_account_info",
  ft_balance_of = "ft_balance_of",
  initialize_account = "initialize_account",
  test_delete_account = "test_delete_account",
  ft_metadata = "ft_metadata",
  get_relic_list = "get_relic_list",
  get_gear_level_relic_capacity = "get_gear_level_relic_capacity",
  get_gear_level_upgrade_cost = "get_gear_level_upgrade_cost",
  get_gear_levels = "get_gear_levels",
  get_space_tinkers_upgrade_cost_and_info = "get_space_tinkers_upgrade_cost_and_info",
  upgrade_tinker = "upgrade_tinker",
}

export enum ERewardAssetType {
  union_contract = "union_contract",
  token = "token",
  nft = "nft",
}

export enum EHarvestMoon_PlayerTier {
  one = "one",
  two = "two",
  three = "three",
}

export enum EHM_Exchange_InputAsset {
  mept = "MEPT",
  mpts = "MPTS",
}

export enum EHM_Exchange_OutputAsset {
  advanced_contract = "ADVANCED",
  expert_contract = "EXPERT",
  moon_token = "MOON",
}

export enum EMissionVoteXRefTabs {
  INFO = "INFO",
  STAKE_VOTE = "STAKE_VOTE",
  UNSTAKE = "UNSTAKE",
  MYREWARDS = "MYREWARDS",
}

export enum ETokenDropCampaignIds {
  referral_token_drop_2 = "referral_token_drop_2",
  gear_token_drop = "gear_token_drop",
  lonk_token_drop = "lonk_token_drop",
  memecoin_token_drop = "memecoin_token_drop",
  swap_mission_drop = "swap_mission_drop",
}
