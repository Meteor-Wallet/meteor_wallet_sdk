import { SingleTransactionExecutor } from "../../../core/transactions/SingleTransactionExecutor.ts";
import { Signer } from "../../../core/keys_and_signers/signers/Signer.ts";
import { NearTransaction } from "./NearTransaction.ts";
import { NearSignedTransaction } from "./NearSignedTransaction.ts";
import { FinalExecutionOutcome } from "@near-js/types";
import { ISubscribable } from "../../../core/utility/pubsub/pubsub.interfaces.ts";
import {
  EPubSub_SingleTransactionExecutor,
  IPubSub_SingleTransactionExecutor,
} from "../../../core/transactions/SingleTransactionExecutor.pubsub.ts";
import { NearAccount } from "../account/NearAccount.ts";

export class NearSingleTransactionExecutor
  extends SingleTransactionExecutor
  implements ISubscribable<IPubSub_SingleTransactionExecutor<NearSingleTransactionExecutor>>
{
  protected transaction: NearTransaction;
  protected signedTransaction?: NearSignedTransaction;
  protected finalizedTransaction?: any;
  protected account: NearAccount;

  constructor(transaction: NearTransaction) {
    super();
    this.account = transaction.getSenderFullAccount();
    this.transaction = transaction;
  }

  async execute(temporarySigner?: Signer): Promise<FinalExecutionOutcome> {
    this.pubSub.notifyListeners(EPubSub_SingleTransactionExecutor.transaction_sign_started, this);

    const signer = this.account.getPrimarySigner();

    this.signedTransaction = await signer.signTransaction(this.transaction);

    this.pubSub.notifyListeners(EPubSub_SingleTransactionExecutor.transaction_sign_completed, this);
    this.pubSub.notifyListeners(
      EPubSub_SingleTransactionExecutor.transaction_publish_started,
      this,
    );

    const outcome = await this.account.getRpcProvider().broadcastTxCommit({
      signed_transaction_base64: this.signedTransaction.nativeSignedTransactionBase64,
    });

    this.pubSub.notifyListeners(
      EPubSub_SingleTransactionExecutor.transaction_publish_completed,
      this,
    );

    return outcome;
  }
}
