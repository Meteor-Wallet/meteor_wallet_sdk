import { Signer } from "../keys_and_signers/signers/Signer";
import { EAccountFeature } from "./features/account_feature.enums.ts";
import { EErrorId_Account } from "../errors/MeteorErrorIds";
import { Blockchain } from "../blockchain/Blockchain";
import { BlockchainTransaction } from "../transactions/BlockchainTransaction";
import { TransactionExecutionPlan } from "../transactions/TransactionExecutionPlan";
import { BasicAccount } from "./BasicAccount";
import { PubSub } from "../utility/pubsub/PubSub";
import {
  IAccountStorableData, IUniqueAccountProps,
} from "./account.interfaces";
import { ISubscribable } from "../utility/pubsub/pubsub.interfaces";
import { TPubSubListener } from "../utility/pubsub/pubsub.types";
import { IListManageable } from "../utility/managers/list_manager/list_manager.interfaces";
import { OrdIdentity } from "../utility/managers/list_manager/OrdIdentity";
import { IPubSub_Account } from "./Account.pubsub";
import { RpcProvider } from "../blockchain/network/RpcProvider";
import { ListManager } from "../utility/managers/list_manager/ListManager";
import {
  IFullAccountFeatureMap,
  IWithAccountFeatures,
  TAccountFeatureMapWithSupport,
} from "./features/account_feature.interfaces.ts";
import { IFullAccountStateFeature } from "./features/account_feature.state.interfaces.ts";
import { IFullAccountTokenFeature } from "./features/account_feature.token.interfaces.ts";
import { accountSupportsFeature, getAccountFeature } from "./features/account_feature.utils.ts";
import { TBlockchainNetworkId } from "../blockchain/network/blockchain_network.types.ts";
import { BlockchainNetwork } from "../blockchain/network/BlockchainNetwork.ts";
import { IStorable } from "../utility/data_entity/storable/storable.interfaces.ts";
import { IAccountSignerDefinition } from "../keys_and_signers/signer_origins/signer_origin.interfaces.ts";
import { ISignerStorableData } from "../keys_and_signers/signers/signer.storable.interfaces.ts";
import { IFullAccountTransactionFeature } from "./features/account_feature.transactions.interfaces";
import { IFullAccountNftFeature } from "./features/account_feature.nft.interfaces.ts";
import { IFullAccountSocialFeature } from "./features/account_feature.social.interface.ts";

export abstract class Account
  implements
    IListManageable<IUniqueAccountProps>,
    IWithAccountFeatures<IFullAccountFeatureMap>,
    IStorable<IAccountStorableData>
{
  _ord = new OrdIdentity();
  isBasic: false = false;
  protected abstract blockchain: Blockchain;

  abstract features: Partial<TAccountFeatureMapWithSupport<IFullAccountFeatureMap>>;
  signers: ListManager<Signer> = new ListManager<Signer>({
    errorMap: {
      list_is_empty: EErrorId_Account.account_no_signers,
    },
  });

  abstract transactionExecutionPlans: ListManager<TransactionExecutionPlan>;
  abstract pubSub: PubSub<IPubSub_Account>;

  abstract readonly storableUniqueKey: Promise<string>;

  abstract getStorableData(): IAccountStorableData;

  abstract getStorableUniqueKey(): Promise<string>;

  abstract addSignerFromDefinition(signer: IAccountSignerDefinition): Promise<void>;

  abstract addSignerFromStorableData(storable: ISignerStorableData): Promise<void>;

  getRuntimeUniqueKey(): string | number {
    return this._ord.getOrd();
  }

  getNetworkId(): TBlockchainNetworkId {
    return this.basic.getNetworkId();
  }

  getNetwork(): BlockchainNetwork {
    return this.blockchain.networkManager.getNetworkById(this.getNetworkId());
  }

  isEqualTo(other: IWithBasicAccountProps): boolean {
    return this.basic.isEqualTo(other.basic);
  }

  subscribe<K extends keyof IPubSub_Account>(
    id: K,
    listener: TPubSubListener<IPubSub_Account[K]>,
  ): () => void {
    return this.pubSub.subscribe(id, listener);
  }

  unsubscribe<K extends keyof IPubSub_Account>(
    id: K,
    listener: TPubSubListener<IPubSub_Account[K]>,
  ): void {
    return this.pubSub.unsubscribe(id, listener);
  }

  abstract constructTransaction({
    receiver,
  }: {
    receiver: IWithBasicAccount;
  }): BlockchainTransaction;

  abstract planTransactions(transactions: BlockchainTransaction[]): TransactionExecutionPlan;

  // all replaced to planTransactions
  // async signTransaction(transaction: BlockchainTransaction): Promise<BlockchainSignedTransaction> {
  //   return this.getPrimarySigner().signTransaction(transaction);
  // }

  // async signTransactions(
  //   transactions: BlockchainTransaction[],
  // ): Promise<BlockchainSignedTransaction[]> {
  //   const signedTransactions: BlockchainSignedTransaction[] = [];

  //   for (const transaction of transactions) {
  //     signedTransactions.push(await this.signTransaction(transaction));
  //   }

  //   return signedTransactions;
  // }

  // async signAndPublishTransactions(transactions: BlockchainTransaction[]): Promise<void> {
  //   const signedTransactions = await this.signTransactions(transactions);
  // }

  getPrimarySigner(): Signer {
    return this.signers.getFirst();
  }

  getRpcProvider(): RpcProvider {
    return this.basic.getRpcProvider();
  }

  getBlockchain(): Blockchain {
    return this.blockchain;
  }

  /* --- FEATURES --- */

  abstract initializeFeature<E extends EAccountFeature>(
    id: E,
  ): IFullAccountFeatureMap[E] | undefined;

  state(): IFullAccountStateFeature {
    return this.getFeature(EAccountFeature.state);
  }

  tokens(): IFullAccountTokenFeature {
    return this.getFeature(EAccountFeature.token);
  }

  transactions(): IFullAccountTransactionFeature {
    return this.getFeature(EAccountFeature.transaction);
  }

  nfts(): IFullAccountNftFeature {
    return this.getFeature(EAccountFeature.nft);
  }

  social(): IFullAccountSocialFeature {
    return this.getFeature(EAccountFeature.social);
  }

  getFeature<E extends EAccountFeature>(featureId: E): IFullAccountFeatureMap[E] {
    return getAccountFeature(this, featureId);
  }

  supportsFeature(featureId: EAccountFeature): boolean {
    return accountSupportsFeature(this, featureId);
  }
}
