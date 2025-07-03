import { getAdaptiveVariable } from "../../modules_app_core/app_plaftorms/app_adapter";
import { EDriverPlatform, getCurrentPlatform } from "../../modules_app_core/app_plaftorms/drivers";
import { zRpcItems } from "../../modules_app_core/state/app_store/AppStore_types";
import {
  TNearBaseConnectConfig,
  TNearBaseConnectConfigNetwork,
} from "./clients/near_api_js/NearApiJsClient";
import { ENearNetwork } from "./types/near_basic_types";

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
  nodeUrl:
    getCurrentPlatform() === EDriverPlatform.web
      ? "https://mw.rpc.fastnear.com"
      : "https://near.lava.build",
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

export const setupRpc = async () => {
  const localStorageAdapter = getAdaptiveVariable("localStorageAdapter");
  const selectedRpcRawString = await localStorageAdapter.getString("selectedRpc");
  if (selectedRpcRawString) {
    try {
      const config = JSON.parse(selectedRpcRawString);

      const configParsed = zRpcItems.parse(config);

      configParsed.map((v) => {
        if (v.network === ENearNetwork.mainnet) {
          NEAR_BASE_CONNECT_CONFIG_MAINNET.nodeUrl = v.nodeUrl;
          NEAR_BASE_CONNECT_CONFIG_MAINNET.name = v.name;
        } else if (v.network === ENearNetwork.testnet) {
          NEAR_BASE_CONNECT_CONFIG_TESTNET.nodeUrl = v.nodeUrl;
          NEAR_BASE_CONNECT_CONFIG_TESTNET.name = v.name;
        }
      });
    } catch (err) {
      // most likely cause is the data in the localStorage is incorrect
      // we will remove it for now
      console.log(err, "Failed to set custom RPC.");
      await localStorageAdapter.setString("selectedRpc", "");
    }
  }

  const customRpcRawString = localStorage.getItem("customRpc");
  if (customRpcRawString) {
    try {
      const config = JSON.parse(customRpcRawString);

      zRpcItems.parse(config);
    } catch (err) {
      console.log(err, "Failed to parse custom RPC list.");
      await localStorageAdapter.setString("customRpc", "");
    }
  }
};

export const NEAR_BASE_CONFIG_FOR_NETWORK: TNearBaseConnectConfigNetwork = {
  [ENearNetwork.localnet]: NEAR_BASE_CONNECT_CONFIG_LOCALNET,
  [ENearNetwork.testnet]: NEAR_BASE_CONNECT_CONFIG_TESTNET,
  [ENearNetwork.betanet]: NEAR_BASE_CONNECT_CONFIG_BETANET,
  [ENearNetwork.mainnet]: NEAR_BASE_CONNECT_CONFIG_MAINNET,
};
