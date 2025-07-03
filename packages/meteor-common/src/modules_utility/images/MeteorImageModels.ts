import { EnumUtils } from "../data_type_utils/EnumUtils";

export enum EMeteorImageVariant {
  nft_list_item = "nft_list_item",
}

export const MeteorImageVariantConfig: {
  [key in EMeteorImageVariant]: {
    maxWidth: number;
    maxHeight: number;
    fit: "scale-down" | "cover";
    quality?: number;
  };
} = {
  [EMeteorImageVariant.nft_list_item]: {
    fit: "scale-down",
    maxHeight: 650,
    maxWidth: 400,
    quality: 85,
  },
};

export const MeteorImageVariants = EnumUtils.getEnumValues(EMeteorImageVariant);
