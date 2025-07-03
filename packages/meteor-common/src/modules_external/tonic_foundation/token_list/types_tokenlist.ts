import { ENearNetwork } from "../../near/types/near_basic_types";

export type NearEnv =
  | "mainnet"
  | "production"
  | "testnet"
  | "development"
  | "localnet"
  | "local"
  | "test"
  | "ci";

export interface IOGetTokenList_input {
  network: ENearNetwork;
}
