import { ENearNetwork } from "./near_basic_types";
import type { INearConnectConfig } from "./nearConnectConfig.types";

export type TNearConnectConfig = Omit<INearConnectConfig, "headers"> & {
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
