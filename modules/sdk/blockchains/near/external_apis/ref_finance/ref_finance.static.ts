import { TBlockchainNetworkId } from "../../../../core/blockchain/network/blockchain_network.types.ts";

const refFinanceMainnetBaseUrl = "https://mainnet-indexer.ref-finance.com";
const refFinanceTestnetBaseUrl = "https://testnet-indexer.ref-finance.com";

export const refFinanceApiForNetwork: {
  [key in TBlockchainNetworkId]: string;
} = {
  mainnet: refFinanceMainnetBaseUrl,
  testnet: refFinanceTestnetBaseUrl,
};
