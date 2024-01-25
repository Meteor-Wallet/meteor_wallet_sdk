import { TransactionExecutionPlan } from "../../../core/transactions/TransactionExecutionPlan.ts";
import { ListManager } from "../../../core/utility/managers/list_manager/ListManager.ts";
import { NearTransaction } from "./NearTransaction.ts";
import { NearAccount } from "../account/NearAccount.ts";
import { FinalExecutionOutcome } from "@near-js/types";
import { ETransactionExecutionStatus } from "../../../core/transactions/transaction.enums.ts";
import { MeteorInternalError } from "../../../core/errors/MeteorError.ts";
import { NearSingleTransactionExecutor } from "./NearSingleTransactionExecutor.ts";

export class NearTransactionExecutionPlan extends TransactionExecutionPlan {
  protected senderAccount: NearAccount;
  transactionExecutors: ListManager<NearSingleTransactionExecutor> =
    new ListManager<NearSingleTransactionExecutor>();

  constructor({
    account,
    transactions,
  }: {
    account: NearAccount;
    transactions: NearTransaction[];
  }) {
    super();
    this.senderAccount = account;
    this.transactionExecutors.addMultiple(
      transactions.map((trx) => new NearSingleTransactionExecutor(trx)),
    );
  }

  async startExecution(): Promise<FinalExecutionOutcome[]> {
    if (this.status !== ETransactionExecutionStatus.pending) {
      throw new MeteorInternalError("TransactionExecutionPlan is already running");
    }

    super.startExecution();

    const outcomes: FinalExecutionOutcome[] = [];

    for (const transaction of this.transactionExecutors.getAll()) {
      outcomes.push(await transaction.execute());
    }

    return outcomes;
  }

  stopExecution() {
    super.stopExecution();
    // Stop the next transactions from running, if there are any
  }
}
