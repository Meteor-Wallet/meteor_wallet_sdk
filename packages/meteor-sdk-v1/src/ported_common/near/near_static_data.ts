import { ENearNetwork } from "./near_basic_types.ts";
import type {
  TNearBaseConnectConfig,
  TNearBaseConnectConfigNetwork,
} from "./NearApiJsClient.types.ts";

export const near_network_array: ENearNetwork[] = [
  ENearNetwork.testnet,
  ENearNetwork.mainnet,
  ENearNetwork.localnet,
  ENearNetwork.betanet,
];

export const NEAR_BASE_CONNECT_CONFIG_TESTNET: TNearBaseConnectConfig = {
  networkId: ENearNetwork.testnet,
  name: "Fastnear Testnet",
  nodeUrl: "https://test.rpc.fastnear.com",
  // nodeUrl: "https://beta.rpc.testnet.near.org",
  archivalUrl: "https://archival-rpc.testnet.near.org",
  // walletUrl: "https://wallet.testnet.near.org",
  helperUrl: "https://helper.testnet.near.org",
  explorerUrl: "https://explorer.testnet.near.org",
};

export const NEAR_BASE_CONNECT_CONFIG_BETANET: TNearBaseConnectConfig = {
  networkId: ENearNetwork.betanet,
  name: "Fastnear Betanet",
  nodeUrl: "https://rpc.betanet.near.org",
  // walletUrl: "https://wallet.betanet.near.org",
  helperUrl: "https://helper.betanet.near.org",
  explorerUrl: "https://explorer.betanet.near.org",
};

export const NEAR_BASE_CONNECT_CONFIG_MAINNET: TNearBaseConnectConfig = {
  networkId: ENearNetwork.mainnet,
  name: "Fastnear Mainnet",
  nodeUrl: "https://mw.rpc.fastnear.com",
  // nodeUrl: "https://rpc.mainnet.near.org",

  archivalUrl: "https://archival-rpc.mainnet.near.org",
  // walletUrl: "https://wallet.mainnet.near.org",
  helperUrl: "https://helper.mainnet.near.org",
  explorerUrl: "https://explorer.mainnet.near.org",
};

export const NEAR_BASE_CONNECT_CONFIG_LOCALNET: TNearBaseConnectConfig = {
  networkId: ENearNetwork.localnet,
  name: "Localnet",
  nodeUrl: "http://localhost:3001",
  walletUrl: "http://localhost:3001/wallet",
};

export const NEAR_BASE_CONFIG_FOR_NETWORK: TNearBaseConnectConfigNetwork = {
  [ENearNetwork.localnet]: NEAR_BASE_CONNECT_CONFIG_LOCALNET,
  [ENearNetwork.testnet]: NEAR_BASE_CONNECT_CONFIG_TESTNET,
  [ENearNetwork.betanet]: NEAR_BASE_CONNECT_CONFIG_BETANET,
  [ENearNetwork.mainnet]: NEAR_BASE_CONNECT_CONFIG_MAINNET,
};
