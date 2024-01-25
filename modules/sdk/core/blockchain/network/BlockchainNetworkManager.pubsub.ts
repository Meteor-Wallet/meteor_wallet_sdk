import { BlockchainNetwork } from "./BlockchainNetwork.ts";

export enum EPubSub_BlockchainNetworkManager {
  available_networks_change = "available_networks_change",
}

export interface IPubSub_BlockchainNetworkManager {
  [EPubSub_BlockchainNetworkManager.available_networks_change]: BlockchainNetwork[];
}
