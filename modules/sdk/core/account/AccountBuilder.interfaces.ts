import { TBlockchainNetworkId } from "../blockchain/network/blockchain_network.types.ts";
import { Blockchain } from "../blockchain/Blockchain.ts";

export interface IAccountBuilder_Constructor<B extends Blockchain = Blockchain> {
  id?: string;
  networkId: TBlockchainNetworkId;
  blockchain: B;
}
