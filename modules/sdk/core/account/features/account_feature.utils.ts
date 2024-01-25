import { EErrorId_AccountFeature } from "../../errors/MeteorErrorIds.ts";
import { MeteorError } from "../../errors/MeteorError.ts";
import { EAccountFeature } from "./account_feature.enums.ts";
import { IWithAccountFeatures } from "./account_feature.interfaces.ts";
import { getFeature, supportsFeature } from "../../utility/data_entity/feature/feature.utils.ts";
import { IWithAnyFeatures } from "../../utility/data_entity/feature/feature.interfaces.ts";

function createError(featureId: EAccountFeature) {
  return MeteorError.fromId(EErrorId_AccountFeature.account_feature_not_supported, featureId);
}

export function getAccountFeature<
  E extends EAccountFeature,
  K extends {
    [key in EAccountFeature]: any;
  },
>(withFeatures: IWithAccountFeatures<K>, featureId: E): K[E] {
  return getFeature(withFeatures as IWithAnyFeatures, featureId, createError);
}

export function accountSupportsFeature<
  E extends EAccountFeature,
  K extends {
    [key in EAccountFeature]: any;
  },
>(withFeatures: IWithAccountFeatures<K>, featureId: E): boolean {
  return supportsFeature(withFeatures as IWithAnyFeatures, featureId, createError);
}
