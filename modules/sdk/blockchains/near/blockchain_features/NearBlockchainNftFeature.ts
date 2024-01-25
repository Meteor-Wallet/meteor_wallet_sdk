import { NearBlockchain } from "../NearBlockchain.ts";
import { ListManager } from "../../../core/utility/managers/list_manager/ListManager.ts";
import { IBlockchainNftFeature } from "../../../core/blockchain/features/blockchain_feature.nft.interfaces.ts";
import { NearNft } from "../assets/nft/NearNft.ts";

export class NearBlockchainNftFeature implements IBlockchainNftFeature {
  blockchain: NearBlockchain;
  nfts: ListManager<NearNft> = new ListManager<NearNft>();

  constructor(blockchain: NearBlockchain) {
    this.blockchain = blockchain;
  }
}
