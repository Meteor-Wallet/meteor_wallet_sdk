import { AccountView } from "@near-js/types";

export interface IOGetAccountState_Inputs {
  accountId: string;
}

export interface IOGetAccountState_Outputs extends AccountView {
  amount_usable: string;
}
