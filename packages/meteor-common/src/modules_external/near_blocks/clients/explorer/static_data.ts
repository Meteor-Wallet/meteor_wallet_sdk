import { ENearNetwork } from "../../../near/types/near_basic_types";

export const nearblocksExplorerForNetwork: {
  [key in ENearNetwork]: string;
} = {
  mainnet: "https://nearblocks.io",
  testnet: "https://testnet.nearblocks.io",
  betanet: "https://testnet.nearblocks.io",
  localnet: "https://testnet.nearblocks.io",
};
