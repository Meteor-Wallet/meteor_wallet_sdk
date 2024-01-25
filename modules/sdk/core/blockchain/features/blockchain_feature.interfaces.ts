import { EBlockchainFeature } from "./blockchain_feature.enums.ts";
import { IBlockchainAccountSearchFeature } from "./blockchain_feature.account_search.interfaces.ts";
import { Blockchain } from "../Blockchain.ts";
import { IBlockchainTestAccountFeature } from "./blockchain_feature.test_account.interfaces.ts";
import { IBlockchainTokenFeature } from "./blockchain_feature.token.interfaces.ts";
import { IBlockchainFeatureCustomId } from "./blockchain_feature.custom_id.interfaces.ts";
import { IBlockchainNftFeature } from "./blockchain_feature.nft.interfaces.ts";
import { IBlockchainSocialFeature } from "./blockchain_feature.social.interfaces.ts";

export interface IBlockchainFeatureMap {
  [EBlockchainFeature.account_search]: IBlockchainAccountSearchFeature;
  [EBlockchainFeature.test_account]: IBlockchainTestAccountFeature;
  [EBlockchainFeature.token]: IBlockchainTokenFeature;
  [EBlockchainFeature.custom_id]: IBlockchainFeatureCustomId;
  [EBlockchainFeature.nft]: IBlockchainNftFeature;
  [EBlockchainFeature.social]: IBlockchainSocialFeature;
}

export type TBlockchainFeatureMapWithSupport<F extends { [key in EBlockchainFeature]: any }> = {
  [key in EBlockchainFeature]: { feature?: F[key]; supported: boolean };
};

export interface IWithBlockchainFeatures<F extends { [key in EBlockchainFeature]: any }> {
  getFeature: <E extends keyof F>(featureId: E) => F[E];
  supportsFeature: <E extends keyof F>(featureId: E) => boolean;
  features: Partial<TBlockchainFeatureMapWithSupport<F>>;
  initializeFeature: <E extends EBlockchainFeature>(featureId: E) => F[E] | undefined;

  // --- quick getters ---
  accountSearch(): IBlockchainAccountSearchFeature;
}

export interface IBlockchainFeature {
  blockchain: Blockchain;
}
