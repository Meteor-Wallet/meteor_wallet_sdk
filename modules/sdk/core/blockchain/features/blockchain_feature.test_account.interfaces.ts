import { IBlockchainFeature } from "./blockchain_feature.interfaces.ts";
import { Account } from "../../account/Account.ts";

export interface IBlockchainTestAccountFeature extends IBlockchainFeature {
  generateTestAccount(id?: string): Promise<Account>;
  generateTestAccounts: (num: number) => Promise<Account[]>;
}
