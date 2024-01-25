import { Account } from "../../../core/account/Account.ts";
import { EAccountFeature } from "../../../core/account/features/account_feature.enums.ts";
import { NearBlockchain } from "../NearBlockchain.ts";
import { EGenericBlockchainNetworkId } from "../../../core/blockchain/network/blockchain_network.enums.ts";
import { PubSub } from "../../../core/utility/pubsub/PubSub.ts";
import { IPubSub_Account } from "../../../core/account/Account.pubsub.ts";
import { NearBasicAccount } from "./NearBasicAccount.ts";
import { NearRpcProvider } from "../rpc/NearRpcProvider.ts";
import { NearSigner } from "../signers/NearSigner.ts";
import { ListManager } from "../../../core/utility/managers/list_manager/ListManager.ts";
import { NearTransactionExecutionPlan } from "../transactions/NearTransactionExecutionPlan.ts";
import { NearTransaction } from "../transactions/NearTransaction.ts";
import { getNetworkIdFromProps } from "../../../core/blockchain/network/blockchain_network.utils.ts";
import { Action } from "@near-js/transactions";
import { INearAccountFeatureMap } from "./near.account_feature.interfaces.ts";
import { NearFullAccountStateFeature } from "./account_features/NearFullAccountStateFeature.ts";
import { MeteorError, MeteorInternalError } from "../../../core/errors/MeteorError.ts";
import { NearFullAccountTokenFeature } from "./account_features/NearFullAccountTokenFeature.ts";
import {
  IWithAccountFeatures,
  TAccountFeatureMapWithSupport,
} from "../../../core/account/features/account_feature.interfaces.ts";

import { IWithBasicAccount } from "../../../core/account/account.interfaces.ts";
import { IStorable } from "../../../core/utility/data_entity/storable/storable.interfaces.ts";
import { INearAccountStorableData } from "./NearAccount.interfaces.ts";
import { IAccountSignerDefinition } from "../../../core/keys_and_signers/signer_origins/signer_origin.interfaces.ts";
import { IKeyPairSignerStorableData } from "../../../core/keys_and_signers/signers/signer.storable.interfaces.ts";
import { ESignerOriginGenericType } from "../../../core/keys_and_signers/signer_origins/signer_origin.enums.ts";
import { NearKeyPairSigner } from "../signers/NearKeyPairSigner.ts";
import { EErrorId_Signer } from "../../../core/errors/MeteorErrorIds.ts";
import { SeedPhraseSignerOrigin } from "../../../core/keys_and_signers/signer_origins/seed_phrase/SeedPhraseSignerOrigin.ts";
import { NearFullAccountTransactionFeature } from "./account_features/NearFullAccountTransactionFeature";
import { NearFullAccountNftFeature } from "./account_features/NearFullAccountNftFeature.ts";
import { NearFullAccountSocialFeature } from "./account_features/NearFullAccountSocialFeature.ts";

export class NearAccount
  extends Account
  implements IWithAccountFeatures<INearAccountFeatureMap>, IStorable<INearAccountStorableData>
{
  basic: NearBasicAccount;
  pubSub: PubSub<IPubSub_Account> = new PubSub<IPubSub_Account>();
  blockchain: NearBlockchain;
  features: Partial<TAccountFeatureMapWithSupport<INearAccountFeatureMap>> = {};
  transactionExecutionPlans: ListManager<NearTransactionExecutionPlan> =
    new ListManager<NearTransactionExecutionPlan>();
  // signers: ListManager<Signer> = new ListManager<NearSigner>({});

  readonly storableUniqueKey: Promise<string>;
  readonly incomingStorableData?: INearAccountStorableData;

  constructor({
    blockchain,
    id,
    customNetworkId,
    genericNetworkId,
    incomingStorableData,
  }: {
    id: string;
    blockchain: NearBlockchain;
    genericNetworkId: EGenericBlockchainNetworkId;
    customNetworkId?: string;
    incomingStorableData?: INearAccountStorableData;
  }) {
    super();
    this.blockchain = blockchain;

    this.basic = blockchain.createBasicAccount({
      id,
      networkId: getNetworkIdFromProps({
        genericNetworkId,
        customNetworkId,
      }),
    });

    this.basic.getFeature = () => {
      throw new MeteorInternalError(
        "Account getFeature(): Can't call getFeature() on the basic account of a fully formed account. Call the method on the parent account instead.",
      );
    };

    this.incomingStorableData = incomingStorableData;
    this.storableUniqueKey = this.getStorableUniqueKey();
  }

  async addSignerFromDefinition({ signerDerivation }: IAccountSignerDefinition) {
    let signer: NearSigner | undefined;

    if (signerDerivation.originType === ESignerOriginGenericType.no_origin_private_key) {
      signer = new NearKeyPairSigner({
        keyPair: await this.blockchain.getKeyPairForSignerDefinition({ signerDerivation }),
        derivation: signerDerivation,
        account: this,
      });
    }

    if (signerDerivation.originType === ESignerOriginGenericType.seed_phrase) {
      signer = new NearKeyPairSigner({
        keyPair: await this.blockchain.getKeyPairForSignerDefinition({ signerDerivation }),
        derivation: signerDerivation,
        account: this,
      });
    }

    if (signer != null) {
      this.signers.add(signer);
      return;
    }

    throw MeteorError.fromId(EErrorId_Signer.signer_origin_not_supported_on_blockchain);
  }

  async addSignerFromStorableData(signerData: IKeyPairSignerStorableData) {
    if (signerData.derivation.originType === ESignerOriginGenericType.no_origin_private_key) {
      await this.addSignerFromDefinition({
        signerDerivation: {
          originType: signerData.derivation.originType,
          derivation: signerData.derivation.derivation,
        },
      });

      return;
    }

    if (signerData.derivation.originType === ESignerOriginGenericType.seed_phrase) {
      const seedPhraseOrigin = new SeedPhraseSignerOrigin({
        seedPhrase: signerData.derivation.seedPhrase,
      });

      await this.addSignerFromDefinition({
        signerDerivation: {
          originType: signerData.derivation.originType,
          derivation: signerData.derivation.derivation,
          origin: seedPhraseOrigin,
        },
      });

      return;
    }

    throw MeteorError.fromId(EErrorId_Signer.signer_origin_not_supported_on_blockchain);
  }

  getStorableData(): INearAccountStorableData {
    return {
      label: this.basic.label,
      id: this.basic.id,
      genericNetworkId: this.basic.genericNetworkId,
      customNetworkId: this.basic.customNetworkId,
      blockchainId: this.basic.blockchainId,
      stateFeature: this.state().getStorableData(),
    };
  }

  getStorableUniqueKey(): Promise<string> {
    return this.basic.getStorableUniqueKey();
  }

  getPrimarySigner(): NearSigner {
    return super.getPrimarySigner() as NearSigner;
  }

  state(): NearFullAccountStateFeature {
    return super.state() as NearFullAccountStateFeature;
  }

  tokens(): NearFullAccountTokenFeature {
    return super.tokens() as NearFullAccountTokenFeature;
  }

  transactions(): NearFullAccountTransactionFeature {
    return super.transactions() as NearFullAccountTransactionFeature;
  }

  nfts(): NearFullAccountNftFeature {
    return super.nfts() as NearFullAccountNftFeature;
  }

  initializeFeature<E extends EAccountFeature>(id: E): INearAccountFeatureMap[E] | undefined {
    if (this.features[id]?.feature != null) {
      return this.features[id]?.feature;
    }

    try {
      if (id === EAccountFeature.state) {
        return new NearFullAccountStateFeature(this) as INearAccountFeatureMap[E];
      }

      if (id === EAccountFeature.token) {
        return new NearFullAccountTokenFeature(this) as INearAccountFeatureMap[E];
      }
      if (id === EAccountFeature.transaction) {
        return new NearFullAccountTransactionFeature(this) as INearAccountFeatureMap[E];
      }

      if (id === EAccountFeature.nft) {
        return new NearFullAccountNftFeature(this) as INearAccountFeatureMap[E];
      }

      if (id === EAccountFeature.social) {
        return new NearFullAccountSocialFeature(this) as INearAccountFeatureMap[E];
      }
    } catch (e) {
      console.error(e);
    }
  }

  getFeature<E extends EAccountFeature>(featureId: E): INearAccountFeatureMap[E] {
    return super.getFeature(featureId) as INearAccountFeatureMap[E];
  }

  getRpcProvider(): NearRpcProvider {
    return super.getRpcProvider() as NearRpcProvider;
  }

  // for planTransactions
  constructTransaction({
    actions,
    receiver,
  }: {
    actions: Action[];
    receiver: IWithBasicAccount<NearBasicAccount>;
  }): NearTransaction {
    return new NearTransaction({
      sender: this,
      actions,
      receiver,
    });
  }

  planTransactions(transactions: NearTransaction[]): NearTransactionExecutionPlan {
    const plan = new NearTransactionExecutionPlan({ account: this, transactions });

    this.transactionExecutionPlans.add(plan);

    return plan;
  }
}
