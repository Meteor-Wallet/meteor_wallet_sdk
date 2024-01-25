import { Account } from "../account/Account";
import { ListManager } from "../utility/managers/list_manager/ListManager";
import { ISubscribable } from "../utility/pubsub/pubsub.interfaces";
import { ETransactionExecutionStatus } from "./transaction.enums";
import { TPubSubListener } from "../utility/pubsub/pubsub.types";
import {
  EPubSub_TransactionExecutionPlan,
  IPubSub_TransactionExecutionPlan,
} from "./TransactionExecutionPlan.pubsub";
import { PubSub } from "../utility/pubsub/PubSub";
import {
  IListManageable,
  IOrdIdentifiable,
} from "../utility/managers/list_manager/list_manager.interfaces.ts";
import { OrdIdentity } from "../utility/managers/list_manager/OrdIdentity.ts";
import { SingleTransactionExecutor } from "./SingleTransactionExecutor.ts";

export abstract class TransactionExecutionPlan
  implements ISubscribable<IPubSub_TransactionExecutionPlan>, IListManageable<IOrdIdentifiable>
{
  _ord = new OrdIdentity();
  pubSub: PubSub<IPubSub_TransactionExecutionPlan> = new PubSub<IPubSub_TransactionExecutionPlan>();
  protected abstract senderAccount: Account;
  status: ETransactionExecutionStatus = ETransactionExecutionStatus.pending;
  abstract transactionExecutors: ListManager<SingleTransactionExecutor>;

  getRuntimeUniqueKey(): string | number {
    return this._ord.getOrd();
  }

  async startExecution(): Promise<any> {
    this.status = ETransactionExecutionStatus.started;
    this.pubSub.notifyListeners(EPubSub_TransactionExecutionPlan.execution_started, this);
  }

  stopExecution() {
    this.status = ETransactionExecutionStatus.stopped;
    this.pubSub.notifyListeners(EPubSub_TransactionExecutionPlan.execution_stopped, this);
  }

  subscribe<K extends keyof any>(id: K, listener: TPubSubListener<any>): () => void {
    return function () {};
  }

  unsubscribe<K extends keyof any>(id: K, listener: TPubSubListener<any>): void {}

  isEqualTo(other: IOrdIdentifiable): boolean {
    return this._ord.getOrd() === other._ord.getOrd();
  }
}
