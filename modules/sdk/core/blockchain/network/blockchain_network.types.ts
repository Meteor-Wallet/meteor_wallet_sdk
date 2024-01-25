import { EGenericBlockchainNetworkId } from "./blockchain_network.enums";

export type TGenericBlockchainNetworkIdExcludingCustom = Exclude<
  EGenericBlockchainNetworkId,
  EGenericBlockchainNetworkId.custom
>;

export type TBlockchainNetworkId = TGenericBlockchainNetworkIdExcludingCustom | string;
