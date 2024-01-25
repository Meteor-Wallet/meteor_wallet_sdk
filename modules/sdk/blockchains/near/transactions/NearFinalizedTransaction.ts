import { BlockchainFinalizedTransaction } from "../../../core/transactions/BlockchainFinalizedTransaction.ts";
import {
  INear_ExecutionOutcomeWithId,
  INear_FinalExecutionStatus,
  INear_FinalExecutionStatusBasic,
  INearChunkReceipt,
} from "../near_native/near_blockchain_data.types";
import { IMeteorableTransaction } from "../../../core/transactions/transaction.interfaces";
import { MeteorTransaction } from "../../../core/transactions/MeteorTransaction";
import { INearRPC_ExperimentalTxStatus_ResponseBody } from "../rpc/near_rpc.interfaces";
import { NearTransaction } from "./NearTransaction";

export class NearFinalizedTransaction
  extends BlockchainFinalizedTransaction
  implements IMeteorableTransaction
{
  transaction: NearTransaction;
  receipts: INearChunkReceipt[];
  receipts_outcome: INear_ExecutionOutcomeWithId[];
  status: INear_FinalExecutionStatus | INear_FinalExecutionStatusBasic;
  transaction_outcome: INear_ExecutionOutcomeWithId;
  meteorTransaction?: MeteorTransaction;

  constructor({
    transaction,
    rpcExperimentalTxResponse,
  }: {
    transaction: NearTransaction;
    rpcExperimentalTxResponse: INearRPC_ExperimentalTxStatus_ResponseBody;
  }) {
    super();
    this.transaction = transaction;
    this.receipts = rpcExperimentalTxResponse.receipts;
    this.receipts_outcome = rpcExperimentalTxResponse.receipts_outcome;
    this.status = rpcExperimentalTxResponse.status;
    this.transaction_outcome = rpcExperimentalTxResponse.transaction_outcome;
  }

  toMeteor(): MeteorTransaction {
    return new MeteorTransaction();
  }
}
