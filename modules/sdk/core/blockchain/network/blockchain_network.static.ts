import { INetworkDefinition } from "./blockchain_network.interfaces";
import { EGenericBlockchainNetworkId } from "./blockchain_network.enums";
import { TGenericBlockchainNetworkIdExcludingCustom } from "./blockchain_network.types";

const generic_blockchain_network_definitions: {
  [key in TGenericBlockchainNetworkIdExcludingCustom]: INetworkDefinition;
} = {
  [EGenericBlockchainNetworkId.mainnet]: {
    genericNetworkId: EGenericBlockchainNetworkId.mainnet,
    label: "Mainnet",
    isUserCreated: false,
  },
  [EGenericBlockchainNetworkId.testnet]: {
    genericNetworkId: EGenericBlockchainNetworkId.mainnet,
    label: "Testnet",
    isUserCreated: false,
  },
};

export const blockchain_network_static = {
  generic_blockchain_network_definitions,
};
