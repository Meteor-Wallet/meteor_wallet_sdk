import {
  IBlockchainAccountSearchFeature,
  IOSearchFromPublicKey,
} from "../../../core/blockchain/features/blockchain_feature.account_search.interfaces.ts";
import { BasicAccount } from "../../../core/account/BasicAccount.ts";
import { NearBlockchain } from "../NearBlockchain.ts";
import { Ed25519PublicKey } from "../../../core/keys_and_signers/keys/ed25519/Ed25519PublicKey.ts";
import { EGenericBlockchainNetworkId } from "../../../core/blockchain/network/blockchain_network.enums.ts";
import { MeteorError } from "../../../core/errors/MeteorError.ts";
import {
  EErrorId_BlockchainFeature_AccountSearch,
  EErrorId_GenericApi,
} from "../../../core/errors/MeteorErrorIds.ts";

export class NearBlockchainAccountSearchFeature implements IBlockchainAccountSearchFeature {
  blockchain: NearBlockchain;

  constructor(blockchain: NearBlockchain) {
    this.blockchain = blockchain;
  }

  async searchFromPublicKey({
    publicKey,
    networkId,
  }: IOSearchFromPublicKey<Ed25519PublicKey>): Promise<BasicAccount[]> {
    let url;

    if (networkId === EGenericBlockchainNetworkId.testnet) {
      url = `https://testnet-api.kitwallet.app/publicKey/ed25519:${publicKey
        .getKeyData()
        .toBase58()}/accounts`;
    } else if (networkId === EGenericBlockchainNetworkId.mainnet) {
      url = `https://api.kitwallet.app/publicKey/ed25519:${publicKey
        .getKeyData()
        .toBase58()}/accounts`;
    } else {
      throw MeteorError.fromId(
        EErrorId_BlockchainFeature_AccountSearch.network_not_supported_for_account_search,
        networkId,
      );
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw MeteorError.fromId(EErrorId_GenericApi.request_failed, response);
    }

    const ids: string[] = await response.json();
    return ids.map((id) => this.blockchain.createBasicAccount({ id, networkId }));
  }
}
