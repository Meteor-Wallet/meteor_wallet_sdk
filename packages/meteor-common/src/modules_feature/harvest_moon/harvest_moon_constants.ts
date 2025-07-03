import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";
import {
  EHM_Exchange_InputAsset,
  EHM_Exchange_OutputAsset,
  EHM_UnionContractTypes,
  EHarvestMoon_TinkerRarity,
} from "./harvest_moon_enums";
import { IHM_Exchange_Route, THM_ExchangeAsset } from "./harvest_moon_types";

export const attachedGas = "300000000000000";
// It is 0.014 considering all the gas and storage amount we deduct from the user
export const startingFeeActual = 0.14;
export const startingFeeDisplayed = 0.2;

export const RECRUIT_MAX_LIMIT = 50;

export const APPLY_HARVEST_MOON_LINK =
  "https://docs.google.com/forms/d/e/1FAIpQLSeOBKco53qio0dBejENvhd1fFYa4XIzaJwHgPF_sm8IJQmuJw/viewform?usp=sf_link";
export const HARVSET_MOON_BOT_DIRECT_LINK = "https://t.me/nearharvestmoonbot";
export const HARVSET_MOON_TG_CHANNEL_LINK = "https://t.me/nearharvestmoon";
export const HARVSET_MOON_FEEDBACK_LINK = "https://forms.gle/SncKQAVZjoXYzLtRA";
export const HARVSET_MOON_BETA_GIF_LINK = "https://harvestmoon-invite.meteorwallet.app";
export const HARVSET_MOON__MIGRATION_ISSUE_LINK = "https://forms.gle/Jxunjhp26X6h35CY9";
export const HARVSET_MOON_TWITTER_LINK = "https://twitter.com/MeteorWallet";
export const HARVSET_MOON_NEWS_LAUNCH_WEEK =
  "https://medium.com/@meteorwallet/harvest-moon-launch-week-double-rewards-and-surprise-drops-daily-7da47bd906a0";
export const HARVSET_MOON_NEWS_LAUNCH_WEEK_2 =
  "https://x.com/MeteorWallet/status/1854943114672456064";
export const HARVSET_MOON_NEWS_MECHANIC_LINK =
  "https://medium.com/@meteorwallet/preparing-for-launch-harvest-moon-game-mechanics-and-rewards-ab8bff8c8df8";
export const HARVSET_MOON_NEWS_GUIDE_LINK = "https://meteorwallet.gitbook.io/harvest-moon-guide";
export const HARVSET_MOON_NEWS_GUIDE_UPGRADE_LINK =
  "https://meteorwallet.gitbook.io/harvest-moon-guide/harvest-moon/upgrades";
export const HARVEST_MOON_RELICS = {
  [ENearNetwork.testnet]: {
    relicForgePrice: "100000000000000000000",
  },
  [ENearNetwork.mainnet]: {
    relicForgePrice: "100000000000000000000",
  },
};
export const METEOR_LOGO_LINK =
  "https://storage.googleapis.com/meteor-static-data/harvest-moon/logo.png";

export const MOON_TOKEN_IMG =
  "https://storage.googleapis.com/meteor-static-data/harvest-moon/Moon%20Token.png";
export const MPTS_TOKEN_IMG =
  "https://storage.googleapis.com/meteor-static-data/harvest-moon/Mpts%20Token.png";
export const MEPT_TOKEN_IMG =
  "https://storage.googleapis.com/meteor-static-data/harvest-moon/Mept%20Token.png";
export const GEAR_TOKEN_IMG =
  "https://storage.googleapis.com/meteor-static-data/harvest-moon/Gear%20Token.png";

export const CONTRACTS_IMAGES = {
  [EHM_UnionContractTypes.basic]:
    "https://storage.googleapis.com/meteor-static-data/harvest-moon/union_contract/image/basic.png",
  [EHM_UnionContractTypes.advanced]:
    "https://storage.googleapis.com/meteor-static-data/harvest-moon/union_contract/image/advanced.png",
  [EHM_UnionContractTypes.expert]:
    "https://storage.googleapis.com/meteor-static-data/harvest-moon/union_contract/image/expert.png",
};

export const TINKER_RARITY_BACKGROUND_IMAGES = {
  [EHarvestMoon_TinkerRarity.common]:
    "https://storage.googleapis.com/meteor-static-data/harvest-moon/tinker/image_rarity/common.png",
  [EHarvestMoon_TinkerRarity.uncommon]:
    "https://storage.googleapis.com/meteor-static-data/harvest-moon/tinker/image_rarity/uncommon.png",
  [EHarvestMoon_TinkerRarity.rare]:
    "https://storage.googleapis.com/meteor-static-data/harvest-moon/tinker/image_rarity/rare.png",
  [EHarvestMoon_TinkerRarity.epic]:
    "https://storage.googleapis.com/meteor-static-data/harvest-moon/tinker/image_rarity/epic.png",
  [EHarvestMoon_TinkerRarity.legendary]:
    "https://storage.googleapis.com/meteor-static-data/harvest-moon/tinker/image_rarity/legendary.png",
};

export const PARAS_COLLECTION_HARVEST_MOON =
  "https://paras.id/token/harvestmoon.sharddog.near::2%3A1";
export const PARAS_COLLECTION_GEAR_RELIC =
  "https://paras.id/collection/aa-harvest-moon-relics.near";
export const TRADEPORT_COLLECTION_GEAR_RELIC =
  "https://www.tradeport.xyz/near/collection/aa-harvest-moon-relics.near?bottomTab=trades&tab=items";

export const HM_EXCHANGE_ASSET_OBJECT: {
  [key: string]: THM_ExchangeAsset;
} = {
  [EHM_Exchange_InputAsset.mept]: {
    id: EHM_Exchange_InputAsset.mept,
    image: MEPT_TOKEN_IMG,
    name: "$MEPT",
  },
  [EHM_Exchange_InputAsset.mpts]: {
    id: EHM_Exchange_InputAsset.mpts,
    image: MPTS_TOKEN_IMG,
    name: "$MPTS",
  },
  [EHM_Exchange_OutputAsset.moon_token]: {
    id: EHM_Exchange_OutputAsset.moon_token,
    image: MOON_TOKEN_IMG,
    name: "$MOON",
  },
  [EHM_Exchange_OutputAsset.advanced_contract]: {
    id: EHM_Exchange_OutputAsset.advanced_contract,
    image: CONTRACTS_IMAGES[EHM_UnionContractTypes.advanced],
    name: EHM_UnionContractTypes.advanced, // Use it this way lang.harvest_moon.contract.name[EHarvestMoon_UnionContractTypes.advanced]
  },
  [EHM_Exchange_OutputAsset.expert_contract]: {
    id: EHM_Exchange_OutputAsset.expert_contract,
    image: CONTRACTS_IMAGES[EHM_UnionContractTypes.expert],
    name: EHM_UnionContractTypes.expert, // Use it this way lang.harvest_moon.contract.name[EHarvestMoon_UnionContractTypes.expert]
  },
};

export const HM_EXCHANGE_ROUTE: IHM_Exchange_Route[] = [
  {
    input: HM_EXCHANGE_ASSET_OBJECT[EHM_Exchange_InputAsset.mpts],
    output: HM_EXCHANGE_ASSET_OBJECT[EHM_Exchange_OutputAsset.moon_token],
    fromToRate: 1000,
  },
  {
    input: HM_EXCHANGE_ASSET_OBJECT[EHM_Exchange_InputAsset.mept],
    output: HM_EXCHANGE_ASSET_OBJECT[EHM_Exchange_OutputAsset.moon_token],
    fromToRate: 5000,
  },
  {
    input: HM_EXCHANGE_ASSET_OBJECT[EHM_Exchange_InputAsset.mept],
    output: HM_EXCHANGE_ASSET_OBJECT[EHM_Exchange_OutputAsset.advanced_contract],
    fromToRate: 5000,
  },
  {
    input: HM_EXCHANGE_ASSET_OBJECT[EHM_Exchange_InputAsset.mept],
    output: HM_EXCHANGE_ASSET_OBJECT[EHM_Exchange_OutputAsset.expert_contract],
    fromToRate: 50000,
  },
];

export const MISSION_VOTE_PERIOD = {
  voting_period: "February 1st to 6th UTC: 00:00",
  xref_snapshot_period: "7th February, 12pm UTC",
  xref_unstaking_available: "March 1, 12pm UTC",
  xref_unstaking_available_in_date: Date.UTC(2025, 2, 1, 12, 0, 0),
  xref_lock_period_in_days: 30,
  xref_minimum_stake: 30,
  raffle_reward: "February 8, 12pm UTC",
  raffle_reward_in_date: Date.UTC(2025, 1, 8, 12, 0, 0),
  gear_snapshot_period: "February 8, 12pm UTC",
  gear_unstaking_available: "March 9, 12pm UTC",
  gear_unstaking_available_in_date: Date.UTC(2025, 2, 9, 12, 0, 0),
  gear_stake_amount: 100,
};
