import { EErrorId_Blockchain } from "../../errors/MeteorErrorIds.ts";
import { MeteorError } from "../../errors/MeteorError.ts";
import { EBlockchainFeature } from "./blockchain_feature.enums.ts";
import { IWithBlockchainFeatures } from "./blockchain_feature.interfaces.ts";
import { getFeature, supportsFeature } from "../../utility/data_entity/feature/feature.utils.ts";
import { IWithAnyFeatures } from "../../utility/data_entity/feature/feature.interfaces.ts";

function createError(featureId: EBlockchainFeature) {
  return MeteorError.fromId(EErrorId_Blockchain.blockchain_feature_not_supported, featureId);
}

export function getBlockchainFeature<
  E extends EBlockchainFeature,
  K extends {
    [key in EBlockchainFeature]: any;
  },
>(withFeatures: IWithBlockchainFeatures<K>, featureId: E): K[E] {
  return getFeature(withFeatures as IWithAnyFeatures, featureId, createError);
}

export function blockchainSupportsFeature<
  E extends EBlockchainFeature,
  K extends {
    [key in EBlockchainFeature]: any;
  },
>(withFeatures: IWithBlockchainFeatures<K>, featureId: E): boolean {
  return supportsFeature(withFeatures as IWithAnyFeatures, featureId, createError);
}
