import { Blockchain } from "../../core/blockchain/Blockchain";
import { EBlockchain } from "../../core/blockchain/blockchain.enums";
import { NearAccountBuilder } from "./account/NearAccountBuilder.ts";
import { seed_phrase_utils } from "../../core/keys_and_signers/signer_origins/seed_phrase/seed_phrase.utils";
import { derivePath } from "ed25519-hd-key";
import { Ed25519PrivateKey } from "../../core/keys_and_signers/keys/ed25519/Ed25519PrivateKey";
import { KeyData } from "../../core/keys_and_signers/keys/KeyData";
import nacl from "tweetnacl";
import { MeteorError, MeteorInternalError } from "../../core/errors/MeteorError";
import { EErrorId_GenericSdk, EErrorId_Signer } from "../../core/errors/MeteorErrorIds";
import { NearRpcProvider } from "./rpc/NearRpcProvider";
import { NearBasicAccount } from "./account/NearBasicAccount.ts";
import { TBlockchainNetworkId } from "../../core/blockchain/network/blockchain_network.types";
import { IUniqueRpcProviderProps } from "../../core/blockchain/network/blockchain_network.interfaces";
import { IOCreateBasicAccount_Input } from "../../core/blockchain/blockchain.interfaces.ts";
import { convertNetworkIdToUniqueProps } from "../../core/blockchain/network/blockchain_network.utils.ts";
import { IAccountBuilder_Constructor } from "../../core/account/AccountBuilder.interfaces.ts";
import { NEAR_ED25519_KEY_DERIVATION_PATH } from "./signers/near_signers.constants.ts";
import { EBlockchainFeature } from "../../core/blockchain/features/blockchain_feature.enums.ts";
import { NearBlockchainAccountSearchFeature } from "./blockchain_features/NearBlockchainAccountSearchFeature.ts";
import { NearBlockchainTestAccountFeature } from "./blockchain_features/NearBlockchainTestAccountFeature.ts";
import { INearBlockchainFeatureMap } from "./blockchain_features/near.blockchain_feature.interfaces.ts";
import {
  IWithBlockchainFeatures,
  TBlockchainFeatureMapWithSupport,
} from "../../core/blockchain/features/blockchain_feature.interfaces.ts";
import { NearToken } from "./assets/NearToken.ts";
import { ListManager } from "../../core/utility/managers/list_manager/ListManager.ts";
import { NearBlockchainTokenFeature } from "./blockchain_features/NearBlockchainTokenFeature.ts";
import { near_token_utils } from "./assets/near.token.utils.ts";
import { IWithBasicAccountProps } from "../../core/account/account.interfaces.ts";
import { ESignerOriginGenericType } from "../../core/keys_and_signers/signer_origins/signer_origin.enums.ts";
import { NearBlockchainCustomIdFeature } from "./blockchain_features/NearBlockchainCustomIdFeature.ts";
import { Ed25519KeyPair } from "../../core/keys_and_signers/keys/ed25519/Ed25519KeyPair.ts";
import { IAccountSignerDefinition } from "../../core/keys_and_signers/signer_origins/signer_origin.interfaces";
import { Ed25519PublicKey } from "../../core/keys_and_signers/keys/ed25519/Ed25519PublicKey.ts";
import { NearAccount } from "./account/NearAccount.ts";
import { INearAccountStorableData } from "./account/NearAccount.interfaces.ts";
import { NearBlockchainNftFeature } from "./blockchain_features/NearBlockchainNftFeature.ts";
import { NearBlockchainSocialFeature } from "./blockchain_features/NearBlockchainSocialFeature.ts";

export class NearBlockchain
  extends Blockchain
  implements IWithBlockchainFeatures<INearBlockchainFeatureMap>
{
  id = EBlockchain.near;
  features: Partial<TBlockchainFeatureMapWithSupport<INearBlockchainFeatureMap>> = {};
  nativeTokens: ListManager<NearToken, IWithBasicAccountProps> = new ListManager<
    NearToken,
    IWithBasicAccountProps
  >();

  createBasicAccount({ id, networkId }: IOCreateBasicAccount_Input): NearBasicAccount {
    return new NearBasicAccount({
      blockchain: this,
      blockchainId: this.id,
      id,
      ...convertNetworkIdToUniqueProps(networkId),
    });
  }

  createAccountFromStorableData(storable: INearAccountStorableData): NearAccount {
    return new NearAccount({
      blockchain: this,
      incomingStorableData: storable,
      id: storable.id,
      genericNetworkId: storable.genericNetworkId,
      customNetworkId: storable.customNetworkId,
    });
  }

  createNativeToken(networkId: TBlockchainNetworkId): NearToken {
    return near_token_utils.createNearNativeToken(this, networkId);
  }

  getNativeTokenId(): string {
    return "near";
  }

  getNativeToken(networkId: TBlockchainNetworkId): NearToken {
    return super.getNativeToken(networkId) as NearToken;
  }

  getAccountBuilder(
    basicAccount: Omit<IAccountBuilder_Constructor, "blockchain">,
  ): NearAccountBuilder {
    return new NearAccountBuilder({ blockchain: this, ...basicAccount });
  }

  getDefaultSeedphraseDerivationPath(): string {
    return NEAR_ED25519_KEY_DERIVATION_PATH;
  }

  async getPublicKeyForSignerDefinition({
    signerDerivation,
  }: Omit<IAccountSignerDefinition, "signerType">): Promise<Ed25519PublicKey> {
    if (
      signerDerivation.originType === ESignerOriginGenericType.no_origin_private_key ||
      signerDerivation.originType === ESignerOriginGenericType.seed_phrase
    ) {
      const privateKey = await this.getKeyPairForSignerDefinition({ signerDerivation });
      return privateKey.publicKey;
    }

    if (signerDerivation.originType === ESignerOriginGenericType.hardware) {
      // const derivationPath = signerDerivation.derivation?.path ?? NEAR_ED25519_KEY_DERIVATION_PATH;
      throw MeteorError.fromId(EErrorId_GenericSdk.not_supported_yet);
    }

    throw MeteorError.fromId(EErrorId_Signer.signer_origin_cannot_create_public_key);
  }

  async getKeyPairForSignerDefinition({
    signerDerivation,
  }: Omit<IAccountSignerDefinition, "signerType">): Promise<Ed25519KeyPair> {
    if (signerDerivation.originType === ESignerOriginGenericType.no_origin_private_key) {
      return Ed25519KeyPair.fromPrivateKey(
        new Ed25519PrivateKey(KeyData.fromBase58(signerDerivation.derivation.privateKey)),
      );
    }

    if (signerDerivation.originType === ESignerOriginGenericType.seed_phrase) {
      const derivationPath = signerDerivation.derivation?.path ?? NEAR_ED25519_KEY_DERIVATION_PATH;

      const masterKeyBytes = await seed_phrase_utils.seedPhraseToKeyBytes(
        signerDerivation.origin.seedPhrase,
      );

      const { key } = derivePath(derivationPath, Buffer.from(masterKeyBytes).toString("hex"));
      const keyPair = nacl.sign.keyPair.fromSeed(new Uint8Array(key));

      const privateKey = new Ed25519PrivateKey(new KeyData(keyPair.secretKey));
      return privateKey.toKeyPair();
    }

    throw MeteorError.fromId(EErrorId_Signer.signer_origin_cannot_create_private_key);
  }

  getRpcProvider(networkId: TBlockchainNetworkId): NearRpcProvider {
    const rpcEndpoint = this.networkManager.getFirstEnabledRpcEndpointByNetworkId(networkId);

    const uniqueProps: IUniqueRpcProviderProps = {
      networkId,
      rpcEndpoint: rpcEndpoint,
    };

    if (!this.rpcProviders.includes(uniqueProps)) {
      // create the RPC and add it to the list
      this.rpcProviders.add(new NearRpcProvider(rpcEndpoint));
    }

    return this.rpcProviders.get(uniqueProps) as NearRpcProvider;
  }

  getArchivalRpcProvider(networkId: TBlockchainNetworkId): NearRpcProvider {
    console.log("getArchivalRpcProvider", networkId);
    const network = this.networkManager.getNetworkById(networkId);
    const archivalRpcEndpoints = network.getArchivalRpcEndpoints();

    if (archivalRpcEndpoints.length === 0) {
      throw new MeteorInternalError(`No archival endpoints for network: ${networkId}`);
    }

    const rpcEndpoint = archivalRpcEndpoints[0];

    const uniqueProps: IUniqueRpcProviderProps = {
      networkId,
      rpcEndpoint,
    };

    if (!this.rpcProviders.includes(uniqueProps)) {
      // create the RPC and add it to the list
      console.log("RPC provider does not exist yet for props", uniqueProps);
      this.rpcProviders.add(new NearRpcProvider(rpcEndpoint));
    }

    return this.rpcProviders.get(uniqueProps) as NearRpcProvider;
  }

  addRpcProvider(rpcProvider: NearRpcProvider): void {
    this.rpcProviders.add(rpcProvider);
  }

  initializeFeature<E extends EBlockchainFeature>(id: E): INearBlockchainFeatureMap[E] | undefined {
    if (this.features[id]?.feature != null) {
      return this.features[id]?.feature;
    }

    try {
      if (id === EBlockchainFeature.account_search) {
        return new NearBlockchainAccountSearchFeature(this) as INearBlockchainFeatureMap[E];
      }

      if (id === EBlockchainFeature.test_account) {
        return new NearBlockchainTestAccountFeature(this) as INearBlockchainFeatureMap[E];
      }

      if (id === EBlockchainFeature.token) {
        return new NearBlockchainTokenFeature(this) as INearBlockchainFeatureMap[E];
      }

      if (id === EBlockchainFeature.custom_id) {
        return new NearBlockchainCustomIdFeature(this) as INearBlockchainFeatureMap[E];
      }

      if (id === EBlockchainFeature.nft) {
        return new NearBlockchainNftFeature(this) as INearBlockchainFeatureMap[E];
      }

      if (id === EBlockchainFeature.social) {
        return new NearBlockchainSocialFeature(this) as INearBlockchainFeatureMap[E];
      }
    } catch (e) {
      console.error(e);
    }
  }

  token(): NearBlockchainTokenFeature {
    return this.getFeature(EBlockchainFeature.token);
  }

  testAccount(): NearBlockchainTestAccountFeature {
    return this.getFeature(EBlockchainFeature.test_account);
  }

  getFeature<E extends EBlockchainFeature>(featureId: E): INearBlockchainFeatureMap[E] {
    return super.getFeature(featureId) as INearBlockchainFeatureMap[E];
  }
}
