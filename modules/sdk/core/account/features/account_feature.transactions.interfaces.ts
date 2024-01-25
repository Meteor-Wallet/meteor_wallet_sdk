import { IWithBasicAccount } from "../account.interfaces";
import { Blockchain } from "../../blockchain/Blockchain";
import { EAccountFeature } from "./account_feature.enums";
import { ListManager } from "../../utility/managers/list_manager/ListManager";
import { MeteorTransaction } from "../../transactions/MeteorTransaction";
import { BlockchainFinalizedTransaction } from "../../transactions/BlockchainFinalizedTransaction";

export interface IBasicAccountTransactionFeature {
  account: IWithBasicAccount;
  blockchain: Blockchain;
  id: EAccountFeature.transaction;
  transactionHistoryList: ListManager<MeteorTransaction>;

  getTransactionHistoryList(): Promise<BlockchainFinalizedTransaction[]>;

  getTransactionDetails(transactionId: string): Promise<MeteorTransaction>;
}

export interface IFullAccountTransactionFeature extends IBasicAccountTransactionFeature {
  // signTransaction: (transaction: BlockchainTransaction) => Promise<BlockchainSignedTransaction>;
  // publishTransaction: (transaction: BlockchainSignedTransaction) => Promise<BlockchainFinalizedTransaction>;
}
