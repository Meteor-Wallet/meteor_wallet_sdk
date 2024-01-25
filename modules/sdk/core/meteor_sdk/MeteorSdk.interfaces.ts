import { Blockchain } from "../blockchain/Blockchain.ts";
import { BlockchainNetwork } from "../blockchain/network/BlockchainNetwork.ts";

export interface IBlockchainAndNetworkSelection {
  blockchain: Blockchain;
  network: BlockchainNetwork;
}
