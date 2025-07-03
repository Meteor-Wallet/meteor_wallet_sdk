import { ENearNetwork } from "../../../near/types/near_basic_types";

export const nearblocksApiForNetwork: {
  [key in ENearNetwork]: string;
} = {
  mainnet: "https://api3.nearblocks.io/v1",
  testnet: "https://api-testnet.nearblocks.io/v1",
  betanet: "https://api-testnet.nearblocks.io/v1",
  localnet: "https://api-testnet.nearblocks.io/v1",
};

export const nearblocksApiV3ForNetwork: {
  [key in ENearNetwork]: string;
} = {
  mainnet: "https://api3.nearblocks.io/v1",
  testnet: "https://api3-testnet.nearblocks.io/v1",
  betanet: "https://api3-testnet.nearblocks.io/v1",
  localnet: "https://api3-testnet.nearblocks.io/v1",
};
