import {
  IFullAccountFeatureMap,
  IBasicAccountFeatureMap,
} from "../../../core/account/features/account_feature.interfaces.ts";
import { EAccountFeature } from "../../../core/account/features/account_feature.enums.ts";
import { NearBasicAccountStateFeature } from "./basic_account_features/NearBasicAccountStateFeature.ts";
import { NearBasicAccountTokenFeature } from "./basic_account_features/NearBasicAccountTokenFeature.ts";
import { NearBasicAccountNftFeature } from "./basic_account_features/NearBasicAccountNftFeature.ts";
import { NearBasicAccountSocialFeature } from "./basic_account_features/NearBasicAccountSocialFeature.ts";
import { NearFullAccountStateFeature } from "./account_features/NearFullAccountStateFeature.ts";
import { NearFullAccountTokenFeature } from "./account_features/NearFullAccountTokenFeature.ts";
import { NearBasicAccountTransactionFeature } from "./basic_account_features/NearBasicAccountTransactionFeature";
import { NearFullAccountTransactionFeature } from "./account_features/NearFullAccountTransactionFeature";
import { NearFullAccountNftFeature } from "./account_features/NearFullAccountNftFeature.ts";
import { NearFullAccountSocialFeature } from "./account_features/NearFullAccountSocialFeature.ts";

export interface INearBasicAccountFeatureMap extends IBasicAccountFeatureMap {
  [EAccountFeature.state]: NearBasicAccountStateFeature;
  [EAccountFeature.token]: NearBasicAccountTokenFeature;
  [EAccountFeature.transaction]: NearBasicAccountTransactionFeature;
  [EAccountFeature.nft]: NearBasicAccountNftFeature;
  [EAccountFeature.social]: NearBasicAccountSocialFeature;
}

export interface INearAccountFeatureMap extends IFullAccountFeatureMap {
  [EAccountFeature.state]: NearFullAccountStateFeature;
  [EAccountFeature.token]: NearFullAccountTokenFeature;
  [EAccountFeature.transaction]: NearFullAccountTransactionFeature;
  [EAccountFeature.nft]: NearFullAccountNftFeature;
  [EAccountFeature.social]: NearFullAccountSocialFeature;
}
