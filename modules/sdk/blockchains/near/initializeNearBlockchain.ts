import { NearBlockchain } from "./NearBlockchain.ts";
import { near_mainnet_network, near_testnet_network } from "./network/near_network.static.ts";
import {
  near_mainnet_archival_endpoint,
  near_mainnet_endpoint,
  near_testnet_endpoint,
} from "./network/near_endpoint.static.ts";
import { BlockchainNetwork } from "../../core/blockchain/network/BlockchainNetwork.ts";

export function initializeNearBlockchain(): NearBlockchain {
  // Basic initialization for Near Blockchain
  const blockchain = new NearBlockchain();

  blockchain.networkManager.addNetwork(initializeNearMainnet(blockchain));
  blockchain.networkManager.addNetwork(initializeNearTestnet(blockchain));

  return blockchain;
}

function initializeNearMainnet(blockchain: NearBlockchain): BlockchainNetwork {
  const near_mainnet = blockchain.networkManager.createNetwork(near_mainnet_network);
  near_mainnet.addRpcEndpoint(near_mainnet.createRpcEndpoint(near_mainnet_endpoint));
  near_mainnet.addRpcEndpoint(near_mainnet.createRpcEndpoint(near_mainnet_archival_endpoint));
  return near_mainnet;
}

function initializeNearTestnet(blockchain: NearBlockchain): BlockchainNetwork {
  const near_testnet = blockchain.networkManager.createNetwork(near_testnet_network);
  near_testnet.addRpcEndpoint(near_testnet.createRpcEndpoint(near_testnet_endpoint));
  return near_testnet;
}
