import { TBlockchainNetworkId } from "../../../../core/blockchain/network/blockchain_network.types.ts";

const kitwalletMainnetBaseUrl = "https://api.kitwallet.app";
const kitwalletTestnetBaseUrl = "https://testnet-api.kitwallet.app";

export const kitWalletUrlForNetwork: {
  [key in TBlockchainNetworkId]: string;
} = {
  mainnet: kitwalletMainnetBaseUrl,
  testnet: kitwalletTestnetBaseUrl,
};
