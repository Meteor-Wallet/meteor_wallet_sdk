import { Account } from "@near-js/accounts";
import { IWithBasicAccount } from "../account/account.interfaces.ts";
import { BasicAccount } from "../account/BasicAccount.ts";

export type TTransactionAccount<
  A extends Account = Account,
  B extends BasicAccount = BasicAccount,
> = (A & { isBasic: false }) | (IWithBasicAccount<B> & { isBasic: true });
