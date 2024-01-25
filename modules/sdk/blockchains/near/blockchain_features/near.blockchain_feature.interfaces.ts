import { IBlockchainFeatureMap } from "../../../core/blockchain/features/blockchain_feature.interfaces.ts";
import { NearBlockchainTestAccountFeature } from "./NearBlockchainTestAccountFeature.ts";
import { EBlockchainFeature } from "../../../core/blockchain/features/blockchain_feature.enums.ts";
import { NearBlockchainAccountSearchFeature } from "./NearBlockchainAccountSearchFeature.ts";
import { NearBlockchainTokenFeature } from "./NearBlockchainTokenFeature.ts";
import { NearBlockchainCustomIdFeature } from "./NearBlockchainCustomIdFeature.ts";
import { NearBlockchainNftFeature } from "./NearBlockchainNftFeature.ts";
import { NearBlockchainSocialFeature } from "./NearBlockchainSocialFeature.ts";

export interface INearBlockchainFeatureMap extends IBlockchainFeatureMap {
  [EBlockchainFeature.account_search]: NearBlockchainAccountSearchFeature;
  [EBlockchainFeature.test_account]: NearBlockchainTestAccountFeature;
  [EBlockchainFeature.token]: NearBlockchainTokenFeature;
  [EBlockchainFeature.custom_id]: NearBlockchainCustomIdFeature;
  [EBlockchainFeature.nft]: NearBlockchainNftFeature;
  [EBlockchainFeature.social]: NearBlockchainSocialFeature;
}
