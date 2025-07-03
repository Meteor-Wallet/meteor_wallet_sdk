import { Transaction } from "@near-wallet-selector/core";
import { RouteInfo } from "../../modules_feature/swap/swap_types";

export interface IOBuildTransactions_Input {
  accountId: string;
  route: RouteInfo;
}

export interface IOBuildTransactions_Output {
  transactions: Transaction[];
  transactionsBySteps: Transaction[][];
}
