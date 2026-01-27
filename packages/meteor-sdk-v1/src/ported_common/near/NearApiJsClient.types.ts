import type { ConnectConfig } from "near-api-js";
import { ENearNetwork } from "./near_basic_types";

export type TNearConnectConfig = Omit<ConnectConfig, "headers"> & {
  name: string;
  explorerUrl?: string;
  archivalUrl?: string;
  networkId: ENearNetwork;
  headers?: string | number;
};
export type TNearBaseConnectConfig = Omit<TNearConnectConfig, "keyStore" | "keyPath" | "headers">;
export type TNearBaseConnectConfigNetwork = {
  [net in ENearNetwork]: TNearBaseConnectConfig;
};
