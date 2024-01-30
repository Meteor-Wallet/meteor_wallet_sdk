import {EBlockchain} from "./blockchain.enums";
import {AccountBuilder} from "../account/AccountBuilder";
import {BlockchainNetworkManager} from "./network/BlockchainNetworkManager";
import {EErrorId_Blockchain, EErrorId_ListManager,} from "../errors/MeteorErrorIds";
import {IAccountSignerDefinition,} from "../keys_and_signers/signer_origins/signer_origin.interfaces";
import {IOCreateBasicAccount_Input, IUniqueBlockchainProps} from "./blockchain.interfaces";
import {RpcProvider} from "./network/RpcProvider";
import {IListManageable} from "../utility/managers/list_manager/list_manager.interfaces";
import {OrdIdentity} from "../utility/managers/list_manager/OrdIdentity";
import {BasicAccount} from "../account/BasicAccount";
import {ListManager} from "../utility/managers/list_manager/ListManager";
import {TBlockchainNetworkId} from "./network/blockchain_network.types";
import {IUniqueRpcProviderProps} from "./network/blockchain_network.interfaces";
import {IAccountBuilder_Constructor} from "../account/AccountBuilder.interfaces.ts";
import {Token} from "../assets/token/Token.ts";
import {
  IBlockchainFeatureMap,
  IWithBlockchainFeatures,
  TBlockchainFeatureMapWithSupport,
} from "./features/blockchain_feature.interfaces.ts";
import {IBlockchainAccountSearchFeature} from "./features/blockchain_feature.account_search.interfaces.ts";
import {EBlockchainFeature} from "./features/blockchain_feature.enums.ts";
import {blockchainSupportsFeature, getBlockchainFeature,} from "./features/blockchain_feature.utils.ts";
import {IBlockchainTestAccountFeature} from "./features/blockchain_feature.test_account.interfaces.ts";
import {convertNetworkIdToUniqueProps} from "./network/blockchain_network.utils.ts";
import {IBlockchainTokenFeature} from "./features/blockchain_feature.token.interfaces.ts";
import {IAccountStorableData, IWithBasicAccountProps} from "../account/account.interfaces.ts";
import {IBlockchainFeatureCustomId} from "./features/blockchain_feature.custom_id.interfaces.ts";
import {PublicKey} from "../keys_and_signers/keys/PublicKey.ts";
import {KeyPair} from "../keys_and_signers/keys/KeyPair.ts";
import {Account} from "../account/Account.ts";
import {IBlockchainSocialFeature} from "./features/blockchain_feature.social.interfaces.ts";

export abstract class Blockchain
  implements IListManageable<IUniqueBlockchainProps>, IWithBlockchainFeatures<IBlockchainFeatureMap>
{
  _ord = new OrdIdentity();
  abstract id: EBlockchain;
  abstract nativeTokens: ListManager<Token, IWithBasicAccountProps>;
  networkManager: BlockchainNetworkManager = new BlockchainNetworkManager(this);

  rpcProviders: ListManager<RpcProvider, IUniqueRpcProviderProps> = new ListManager<
    RpcProvider,
    IUniqueRpcProviderProps
  >({
    errorMap: {
      [EErrorId_ListManager.list_item_not_found]: EErrorId_Blockchain.rpc_provider_not_found,
    },
  });

  features: Partial<TBlockchainFeatureMapWithSupport<IBlockchainFeatureMap>> = {};

  constructor() {}

  accountSearch(): IBlockchainAccountSearchFeature {
    return this.getFeature(EBlockchainFeature.account_search);
  }

  customId(): IBlockchainFeatureCustomId {
    return this.getFeature(EBlockchainFeature.custom_id);
  }

  testAccount(): IBlockchainTestAccountFeature {
    return this.getFeature(EBlockchainFeature.test_account);
  }

  token(): IBlockchainTokenFeature {
    return this.getFeature(EBlockchainFeature.token);
  }

  profile(): IBlockchainSocialFeature {
    return this.getFeature(EBlockchainFeature.social);
  }

  protected abstract createNativeToken(networkId: TBlockchainNetworkId): Token;

  abstract getNativeTokenId(networkId: TBlockchainNetworkId): string;

  getNativeToken(networkId: TBlockchainNetworkId): Token {
    const uniqueAccountProps: IWithBasicAccountProps = {
      basic: {
        blockchainId: this.id,
        id: this.getNativeTokenId(networkId),
        ...convertNetworkIdToUniqueProps(networkId),
      },
    };

    if (this.nativeTokens.includes(uniqueAccountProps)) {
      return this.nativeTokens.get(uniqueAccountProps);
    }

    const newNativeToken = this.createNativeToken(networkId);
    this.nativeTokens.add(newNativeToken);
    return newNativeToken;
  }

  abstract getDefaultSeedphraseDerivationPath(): string;

  abstract getAccountBuilder(
    inputs: Omit<IAccountBuilder_Constructor, "blockchain">,
  ): AccountBuilder;

  abstract createBasicAccount(inputs: IOCreateBasicAccount_Input): BasicAccount;

  abstract createAccountFromStorableData(storable: IAccountStorableData): Account;

  abstract getPublicKeyForSignerDefinition(
    definition: Omit<IAccountSignerDefinition, "signerType">,
  ): Promise<PublicKey>;

  abstract getKeyPairForSignerDefinition(
    definition: Omit<IAccountSignerDefinition, "signerType">,
  ): Promise<KeyPair>;

  getRuntimeUniqueKey(): string | number {
    return this._ord.getOrd();
  }

  isEqualTo(other: IUniqueBlockchainProps): boolean {
    return this.id === other.id;
  }

  /*createSigner(inputs: {
    signerDerivation: TSignerDerivation_All;
    signerType: ESignerGenericType.key_pair;
  }): Promise<Signer> {
    throw MeteorError.fromId(EErrorId_Signer.blockchain_does_not_support_signer_origins);
  }*/

  abstract getRpcProvider(networkId: TBlockchainNetworkId): RpcProvider;
  abstract getArchivalRpcProvider(networkId: TBlockchainNetworkId): RpcProvider;

  abstract addRpcProvider(rpcProvider: RpcProvider): void;

  /*
   *  --- FEATURES ---
   */

  getFeature<E extends EBlockchainFeature>(featureId: E): IBlockchainFeatureMap[E] {
    return getBlockchainFeature(this, featureId);
  }

  supportsFeature<E extends EBlockchainFeature>(featureId: E): boolean {
    return blockchainSupportsFeature(this, featureId);
  }

  abstract initializeFeature<E extends EBlockchainFeature>(
    featureId: E,
  ): IBlockchainFeatureMap[E] | undefined;
}
