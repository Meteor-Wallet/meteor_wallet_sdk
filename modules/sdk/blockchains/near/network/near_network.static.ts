import { EGenericBlockchainNetworkId } from "../../../core/blockchain/network/blockchain_network.enums";
import { INetworkDefinition } from "../../../core/blockchain/network/blockchain_network.interfaces";

export const near_mainnet_network: INetworkDefinition = {
  label: "Mainnet",
  genericNetworkId: EGenericBlockchainNetworkId.mainnet,
  isUserCreated: false,
};

export const near_mainnet_archival_network: INetworkDefinition = {
  label: "Mainnet Archival",
  genericNetworkId: EGenericBlockchainNetworkId.mainnet,
  isUserCreated: false,
};

export const near_testnet_network: INetworkDefinition = {
  label: "Testnet",
  genericNetworkId: EGenericBlockchainNetworkId.testnet,
  isUserCreated: false,
};
