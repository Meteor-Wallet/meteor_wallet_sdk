import { EBlockchain } from "../blockchain/blockchain.enums";
import { IUniqueAccountProps } from "./account.interfaces";
import { EGenericBlockchainNetworkId } from "../blockchain/network/blockchain_network.enums";
import { TBlockchainNetworkId } from "../blockchain/network/blockchain_network.types";
import { Blockchain } from "../blockchain/Blockchain";
import { PubSub } from "../utility/pubsub/PubSub";
import { IPubSub_BasicAccount } from "./BasicAccount.pubsub";
import { RpcProvider } from "../blockchain/network/RpcProvider";
import { getNetworkIdFromProps } from "../blockchain/network/blockchain_network.utils.ts";
import { IEditableAndWatchableProps } from "../utility/data_entity/editable/editable.interfaces.ts";
import {
  IBasicAccountEditableProps,
  IBasicAccountStorableData,
} from "./BasicAccount.interfaces.ts";
import { TPubSubListener } from "../utility/pubsub/pubsub.types.ts";
import { doEditablePropsUpdate } from "../utility/data_entity/editable/editable.utils.ts";
import { StringUtils } from "../utility/javascript_datatype_utils/string.utils.ts";
import { IListManageable } from "../utility/managers/list_manager/list_manager.interfaces.ts";
import { OrdIdentity } from "../utility/managers/list_manager/OrdIdentity.ts";
import { accountSupportsFeature, getAccountFeature } from "./features/account_feature.utils.ts";
import {
  IBasicAccountFeatureMap,
  IWithAccountFeatures,
  TAccountFeatureMapWithSupport,
} from "./features/account_feature.interfaces.ts";
import { EAccountFeature } from "./features/account_feature.enums.ts";
import { IBasicAccountStateFeature } from "./features/account_feature.state.interfaces.ts";
import { IBasicAccountTokenFeature } from "./features/account_feature.token.interfaces.ts";
import { BlockchainNetwork } from "../blockchain/network/BlockchainNetwork.ts";
import { IStorable } from "../utility/data_entity/storable/storable.interfaces.ts";
import { hash_utils } from "../utility/hashing/hashing.utils.ts";
import { IBasicAccountTransactionFeature } from "./features/account_feature.transactions.interfaces";
import { IBasicAccountSocialFeature } from "./features/account_feature.social.interface.ts";

export abstract class BasicAccount
  implements
    IUniqueAccountProps,
    IEditableAndWatchableProps<IBasicAccountEditableProps>,
    IListManageable<IUniqueAccountProps>,
    IWithAccountFeatures<IBasicAccountFeatureMap>,
    IStorable<IBasicAccountStorableData>
{
  _ord: OrdIdentity = new OrdIdentity();

  abstract blockchain: Blockchain;

  abstract features: Partial<TAccountFeatureMapWithSupport<IBasicAccountFeatureMap>>;

  abstract initializeFeature<E extends EAccountFeature>(
    id: E,
  ): IBasicAccountFeatureMap[E] | undefined;

  blockchainId: EBlockchain;
  genericNetworkId: EGenericBlockchainNetworkId;
  customNetworkId?: string;

  id: string;

  // A label, which could come from a social platform that this account is
  // associated with or added by the user themselves (address book, or account
  // settings)
  label?: string;

  abstract pubSub: PubSub<IPubSub_BasicAccount>;

  abstract storableUniqueKey: Promise<string>;

  abstract incomingStorableData?: IBasicAccountStorableData | undefined;

  protected constructor({
    id,
    customNetworkId,
    genericNetworkId,
    blockchainId,
  }: IUniqueAccountProps) {
    this.blockchainId = blockchainId;
    this.genericNetworkId = genericNetworkId;
    this.customNetworkId = customNetworkId;
    this.id = id;
  }

  getStorableUniqueKey(): Promise<string> {
    return hash_utils.hashObjectForStorageKey({
      blockchainId: this.blockchainId,
      genericNetworkId: this.genericNetworkId,
      customNetworkId: this.customNetworkId,
      id: this.id,
    });
  }

  getStorableData(): IBasicAccountStorableData {
    return {
      blockchainId: this.blockchainId,
      genericNetworkId: this.genericNetworkId,
      customNetworkId: this.customNetworkId,
      id: this.id,
      label: this.label,
    };
  }

  getRuntimeUniqueKey(): string {
    return `${this.blockchainId}_${this.genericNetworkId}_${this.customNetworkId}_${this.id}`;
  }

  isEqualTo(account: IUniqueAccountProps): boolean {
    return (
      this.blockchainId === account.blockchainId &&
      this.id === account.id &&
      this.genericNetworkId === account.genericNetworkId &&
      this.customNetworkId === account.customNetworkId
    );
  }

  getNetworkId(): TBlockchainNetworkId {
    return getNetworkIdFromProps(this);
  }

  getNetwork(): BlockchainNetwork {
    return this.blockchain.networkManager.getNetworkById(this.getNetworkId());
  }

  getRpcProvider(): RpcProvider {
    return this.blockchain.getRpcProvider(this.getNetworkId());
  }

  getArchivalRpcProvider(): RpcProvider {
    return this.blockchain.getArchivalRpcProvider(this.getNetworkId());
  }

  getEditableProps(): IBasicAccountEditableProps {
    return {
      label: this.label,
    };
  }

  getWatchableProps(): IBasicAccountEditableProps {
    return this.getEditableProps();
  }

  _updateWatchable(props: Partial<IBasicAccountEditableProps>) {
    return this.updateEditable(props);
  }

  updateEditable(props: Partial<IBasicAccountEditableProps>): void {
    if (StringUtils.nullEmpty(props.label)) {
      props.label = undefined;
    }

    doEditablePropsUpdate(this, props);
  }

  subscribe<K extends keyof IPubSub_BasicAccount>(
    id: K,
    listener: TPubSubListener<IPubSub_BasicAccount[K]>,
  ): () => void {
    return this.pubSub.subscribe(id, listener);
  }

  unsubscribe<K extends keyof IPubSub_BasicAccount>(
    id: K,
    listener: TPubSubListener<IPubSub_BasicAccount[K]>,
  ): void {
    return this.pubSub.unsubscribe(id, listener);
  }

  state(): IBasicAccountStateFeature {
    return this.getFeature(EAccountFeature.state);
  }

  tokens(): IBasicAccountTokenFeature {
    return this.getFeature(EAccountFeature.token);
  }

  transactions(): IBasicAccountTransactionFeature {
    return this.getFeature(EAccountFeature.transaction);
  }

  social(): IBasicAccountSocialFeature {
    return this.getFeature(EAccountFeature.social);
  }

  getFeature<E extends EAccountFeature>(featureId: E): IBasicAccountFeatureMap[E] {
    return getAccountFeature(this, featureId);
  }

  supportsFeature<E extends EAccountFeature>(featureId: E): boolean {
    return accountSupportsFeature(this, featureId);
  }
}
