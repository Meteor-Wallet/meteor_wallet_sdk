import { envConfig } from "../envConfig";
import {
  NEAR_BASE_CONNECT_CONFIG_BETANET,
  NEAR_BASE_CONNECT_CONFIG_MAINNET,
  NEAR_BASE_CONNECT_CONFIG_TESTNET,
} from "../ported_common/near/near_static_data";

export const resolveWalletUrl = (network: string, walletUrl?: string) => {
  if (walletUrl) {
    return walletUrl;
  }

  const base = envConfig.wallet_base_url;

  switch (network) {
    case "mainnet":
      return `${base}/connect/mainnet`;
    case "testnet":
      return `${base}/connect/testnet`;
    case "betanet":
      return `${base}/connect/betanet`;
    default:
      throw new Error("Invalid wallet URL");
  }
};

interface INetworkPreset {
  networkId: string;
  nodeUrl: string;
  helperUrl: string;
  explorerUrl: string;
}

export const getNetworkPreset = (networkId: string): INetworkPreset => {
  switch (networkId) {
    case "mainnet":
      return {
        networkId,
        nodeUrl: NEAR_BASE_CONNECT_CONFIG_MAINNET.nodeUrl,
        helperUrl: "https://helper.mainnet.near.org",
        explorerUrl: "https://explorer.near.org",
      };
    case "testnet":
      return {
        networkId,
        nodeUrl: NEAR_BASE_CONNECT_CONFIG_TESTNET.nodeUrl,
        helperUrl: "https://helper.testnet.near.org",
        explorerUrl: "https://explorer.testnet.near.org",
      };
    case "betanet":
      return {
        networkId,
        nodeUrl: NEAR_BASE_CONNECT_CONFIG_BETANET.nodeUrl,
        helperUrl: "https://helper.betanet.near.org",
        explorerUrl: "https://explorer.betanet.near.org",
      };
    default:
      throw Error(`Failed to find config for: '${networkId}'`);
  }
};
