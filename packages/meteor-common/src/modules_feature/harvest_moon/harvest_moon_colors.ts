import {
  EHM_UnionContractTypes,
  EHarvestMoon_PlayerTier,
  EHarvestMoon_RelicRarity,
  EHarvestMoon_TinkerRarity,
} from "./harvest_moon_enums";

export const CHarvestMoon = {
  purple: "#9e91f0",
  green: "#22C46D",
  orange: "#f3a731",
  orange_dark: "#fd5a28",
  red: "#e43333",
  pink: "#df5dff",
  green_light: "#1bf6da",
  green_dark: "#203f3b",
  gray: "#657474",
  gray_dark: "#12121D",
  gray_light: "#292B34",
  blue: "#039be5",
  cream: "#ffd59b",
  yellow: "#e7e43d",
  purple_dark: "#22213080",
  purple_light: "#272739",
  purple_light30: "#1c1d29",
  text: "#9F9F9F",
};

export const CHarvestMoon_TinkerRarity: {
  [key in EHarvestMoon_TinkerRarity]: string;
} = {
  [EHarvestMoon_TinkerRarity.common]: "#989898",
  [EHarvestMoon_TinkerRarity.uncommon]: "#2142FC",
  [EHarvestMoon_TinkerRarity.rare]: "#EF9721",
  [EHarvestMoon_TinkerRarity.epic]: "#5311E4",
  [EHarvestMoon_TinkerRarity.legendary]: "#E00B0B",
};

export const CHarvestMoon_RelicRarity: {
  [key in EHarvestMoon_RelicRarity]: string;
} = {
  [EHarvestMoon_RelicRarity.common]: "#d5c496",
  [EHarvestMoon_RelicRarity.uncommon]: "#95e3a2",
  [EHarvestMoon_RelicRarity.rare]: "#aec6ff",
  [EHarvestMoon_RelicRarity.legendary]: "#ffacac",
};

export const CHarvestMoon_ContractTypes: {
  [key in EHM_UnionContractTypes]: string;
} = {
  [EHM_UnionContractTypes.basic]: CHarvestMoon.purple,
  [EHM_UnionContractTypes.advanced]: CHarvestMoon.red,
  [EHM_UnionContractTypes.expert]: CHarvestMoon.blue,
};

export const CHarvestMoon_PlayerTier: {
  [key in EHarvestMoon_PlayerTier]: string;
} = {
  [EHarvestMoon_PlayerTier.one]: CHarvestMoon.blue,
  [EHarvestMoon_PlayerTier.two]: "blue.200",
  [EHarvestMoon_PlayerTier.three]: CHarvestMoon.red,
};

export enum ELinearBackground {
  orange = "orange",
  purple = "purple",
  pride = "pride",
  gray = "gray",
}

export const LinearBackgroundColor: {
  [key in ELinearBackground]: string;
} = {
  [ELinearBackground.orange]: "#FF1616, #E58D4D",
  [ELinearBackground.purple]: "#2505ca, #784de5",
  [ELinearBackground.pride]: "#2ECDFF, #C03BFF",
  [ELinearBackground.gray]: "#404454, #2A2C37",
};
