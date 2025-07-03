import { near_network_array } from "../near_static_data";
import { ENearNetwork } from "../types/near_basic_types";

function isNearNetworkString(network: string): network is ENearNetwork {
  return near_network_array.includes(network as ENearNetwork);
}

export function isNearSymbol(str: string): boolean {
  return str.toUpperCase() === "NEAR";
}

export const near_basic_utils = {
  isNearNetworkString,
};
