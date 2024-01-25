import { BasicAccount } from "../../../core/account/BasicAccount.ts";
import { EBlockchain } from "../../../core/blockchain/blockchain.enums.ts";
import { PubSub } from "../../../core/utility/pubsub/PubSub.ts";
import { NearBlockchain } from "../NearBlockchain.ts";
import { IPubSub_BasicAccount } from "../../../core/account/BasicAccount.pubsub.ts";
import { IUniqueAccountProps } from "../../../core/account/account.interfaces.ts";
import { NearRpcProvider } from "../rpc/NearRpcProvider.ts";
import { EAccountFeature } from "../../../core/account/features/account_feature.enums.ts";
import { INearBasicAccountFeatureMap } from "./near.account_feature.interfaces.ts";
import {
  IWithAccountFeatures,
  TAccountFeatureMapWithSupport,
} from "../../../core/account/features/account_feature.interfaces.ts";
import { NearBasicAccountStateFeature } from "./basic_account_features/NearBasicAccountStateFeature.ts";
import { NearBasicAccountTokenFeature } from "./basic_account_features/NearBasicAccountTokenFeature.ts";
import { IStorable } from "../../../core/utility/data_entity/storable/storable.interfaces.ts";

import { INearBasicAccountStorableData } from "./near.account_storable.interfaces.ts";
import { NearBasicAccountTransactionFeature } from "./basic_account_features/NearBasicAccountTransactionFeature";
import { NearBasicAccountNftFeature } from "./basic_account_features/NearBasicAccountNftFeature.ts";
import { NearBasicAccountSocialFeature } from "./basic_account_features/NearBasicAccountSocialFeature.ts";

export class NearBasicAccount
  extends BasicAccount
  implements
    IWithAccountFeatures<INearBasicAccountFeatureMap>,
    IStorable<INearBasicAccountStorableData>
{
  features: Partial<TAccountFeatureMapWithSupport<INearBasicAccountFeatureMap>> = {};
  blockchain: NearBlockchain;
  pubSub: PubSub<IPubSub_BasicAccount> = new PubSub<IPubSub_BasicAccount>();
  blockchainId: EBlockchain.near = EBlockchain.near;

  storableUniqueKey: Promise<string>;
  incomingStorableData?: INearBasicAccountStorableData | undefined;

  constructor(
    inputs: IUniqueAccountProps & {
      blockchain: NearBlockchain;
      incomingStorableData?: INearBasicAccountStorableData;
    },
  ) {
    super(inputs);
    this.blockchain = inputs.blockchain;
    this.storableUniqueKey = this.getStorableUniqueKey();
    this.incomingStorableData = inputs.incomingStorableData;
  }

  getStorableData(): INearBasicAccountStorableData {
    return {
      ...super.getStorableData(),
      stateFeature: this.state().getStorableData(),
    };
  }

  getStorableUniqueKey(): Promise<string> {
    return super.getStorableUniqueKey();
  }

  state(): NearBasicAccountStateFeature {
    return this.getFeature(EAccountFeature.state);
  }

  tokens(): NearBasicAccountTokenFeature {
    return this.getFeature(EAccountFeature.token);
  }

  transactions(): NearBasicAccountTransactionFeature {
    return this.getFeature(EAccountFeature.transaction);
  }

  nfts(): NearBasicAccountNftFeature {
    return this.getFeature(EAccountFeature.nft);
  }

  social(): NearBasicAccountSocialFeature {
    return this.getFeature(EAccountFeature.social);
  }

  initializeFeature<E extends EAccountFeature>(id: E): INearBasicAccountFeatureMap[E] | undefined {
    if (this.features[id]?.feature) {
      return this.features[id]?.feature;
    }

    if (id === EAccountFeature.state) {
      return new NearBasicAccountStateFeature({
        account: { basic: this },
      }) as INearBasicAccountFeatureMap[E];
    }

    if (id === EAccountFeature.token) {
      return new NearBasicAccountTokenFeature({ basic: this }) as INearBasicAccountFeatureMap[E];
    }

    if (id === EAccountFeature.nft) {
      return new NearBasicAccountNftFeature({ basic: this }) as INearBasicAccountFeatureMap[E];
    }

    if (id === EAccountFeature.transaction) {
      return new NearBasicAccountTransactionFeature({
        basic: this,
      }) as INearBasicAccountFeatureMap[E];
    }

    if (id === EAccountFeature.social) {
      return new NearBasicAccountSocialFeature({ basic: this }) as INearBasicAccountFeatureMap[E];
    }
  }

  getRpcProvider(): NearRpcProvider {
    return super.getRpcProvider() as NearRpcProvider;
  }

  getArchivalRpcProvider(): NearRpcProvider {
    return super.getArchivalRpcProvider() as NearRpcProvider;
  }

  getFeature<E extends EAccountFeature>(featureId: E): INearBasicAccountFeatureMap[E] {
    return super.getFeature(featureId) as INearBasicAccountFeatureMap[E];
  }
}
