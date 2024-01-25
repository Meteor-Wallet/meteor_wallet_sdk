import { EAccountFeature } from "./account_feature.enums.ts";
import {
  IBasicAccountNftFeature,
  IFullAccountNftFeature,
} from "./account_feature.nft.interfaces.ts";
import {
  IBasicAccountSocialFeature,
  IFullAccountSocialFeature,
} from "./account_feature.social.interface.ts";
import {
  IBasicAccountStateFeature,
  IFullAccountStateFeature,
} from "./account_feature.state.interfaces.ts";
import {
  IBasicAccountTokenFeature,
  IFullAccountTokenFeature,
} from "./account_feature.token.interfaces.ts";
import {
  IBasicAccountTransactionFeature,
  IFullAccountTransactionFeature,
} from "./account_feature.transactions.interfaces";

export interface IBasicAccountFeatureMap {
  [EAccountFeature.state]: IBasicAccountStateFeature;
  [EAccountFeature.token]: IBasicAccountTokenFeature;
  [EAccountFeature.transaction]: IBasicAccountTransactionFeature;
  [EAccountFeature.nft]: IBasicAccountNftFeature;
  [EAccountFeature.social]: IBasicAccountSocialFeature;
}

export interface IFullAccountFeatureMap extends IBasicAccountFeatureMap {
  [EAccountFeature.state]: IFullAccountStateFeature;
  [EAccountFeature.token]: IFullAccountTokenFeature;
  [EAccountFeature.transaction]: IFullAccountTransactionFeature;
  [EAccountFeature.nft]: IFullAccountNftFeature;
  [EAccountFeature.social]: IFullAccountSocialFeature;
}

export type TAccountFeatureMapWithSupport<F extends { [key in EAccountFeature]: any }> = {
  [key in EAccountFeature]: { feature?: F[key]; supported: boolean };
};

export interface IWithAccountFeatures<F extends { [key in EAccountFeature]: any }> {
  getFeature: <E extends keyof F>(featureId: E) => F[E];
  supportsFeature: <E extends keyof F>(featureId: E) => boolean;
  features: Partial<TAccountFeatureMapWithSupport<F>>;
  initializeFeature: <E extends EAccountFeature>(featureId: E) => F[E] | undefined;

  // --- quick getters ---
  state(): IBasicAccountStateFeature;

  tokens(): IBasicAccountTokenFeature;
}
