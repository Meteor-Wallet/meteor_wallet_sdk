import { BlockchainNetwork } from "../blockchain/network/BlockchainNetwork.ts";

export enum EPubSub_MeteorSdk {
  last_selected_network_change = "last_selected_network_change",
}

export interface IPubSub_MeteorSdk {
  [EPubSub_MeteorSdk.last_selected_network_change]: BlockchainNetwork;
}
