import { NearBlockchain } from "../NearBlockchain.ts";
import { IBlockchainSocialFeature } from "../../../core/blockchain/features/blockchain_feature.social.interfaces.ts";

export class NearBlockchainSocialFeature implements IBlockchainSocialFeature {
  blockchain: NearBlockchain;

  constructor(blockchain: NearBlockchain) {
    this.blockchain = blockchain;
  }
}
