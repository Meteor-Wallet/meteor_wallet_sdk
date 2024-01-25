import { EAccountFeature } from "./account_feature.enums.ts";
import { ListManager } from "../../utility/managers/list_manager/ListManager.ts";
import { TokenAmount } from "../../assets/token/TokenAmount.ts";
import { BasicAccount } from "../BasicAccount.ts";
import { BlockchainTransaction } from "../../transactions/BlockchainTransaction.ts";
import { Account } from "../Account.ts";
import { IWithBasicAccount } from "../account.interfaces.ts";
import { Blockchain } from "../../blockchain/Blockchain.ts";
import { Token } from "../../assets/token/Token.ts";

export interface IBasicAccountTokenFeature {
  account: IWithBasicAccount;
  blockchain: Blockchain;
  id: EAccountFeature.token;
  accountTokenAmounts: ListManager<TokenAmount>;
  getAvailableNativeTokenAmount(): Promise<TokenAmount>;
  getAvailableTokenAmount(tokenId: string | Token): Promise<TokenAmount>;
  getAvailableTokenAmounts(): Promise<TokenAmount[]>;
  getAvailableTokens(): Promise<Token[]>;
}

export interface IFullAccountTokenFeature extends IBasicAccountTokenFeature {
  createTokenTransferTransaction: (
    inputs: IOCreateTokenTransferTransaction_Inputs,
  ) => BlockchainTransaction;
  account: Account;
}

export interface IOCreateTokenTransferTransaction_Inputs<
  R extends BasicAccount = BasicAccount,
  T extends TokenAmount = TokenAmount,
> {
  receiver: IWithBasicAccount<R>;
  tokenAmount: T;
}
