import { Account } from "@near-js/accounts";
import { ENearNetwork } from "../near_basic_types";
import { IWithAccountId, IWithContractId, IWithStringAmount } from "../near_input_helper_types";

export interface IOTransfer_Input extends IWithAccountId, IWithContractId, IWithStringAmount {
  receiverId: string;
  memo?: any;
}

export interface IOTransferStorageDeposit_Input extends IWithContractId {
  account: Account;
  receiverId: string;
  storageDepositAmount: string;
}

export interface IOGetStorageBalance_Input extends IWithContractId, IWithAccountId {}

export interface IOGetStorageBalance_Output {
  total: string;
  available: string;
}

export interface IOGetMetadata_Input extends IWithContractId {}

export interface IOGetBalanceOf_Input extends IWithContractId, IWithAccountId {}

export interface IOUnwrapNear {
  network: ENearNetwork;
  accountId: string;
  unwrapAmount: number;
}
