import { ISubscribable } from "../utility/pubsub/pubsub.interfaces";
import { BlockchainTransaction } from "./BlockchainTransaction";
import {
  IListManageable,
  IOrdIdentifiable,
} from "../utility/managers/list_manager/list_manager.interfaces";
import { OrdIdentity } from "../utility/managers/list_manager/OrdIdentity";
import { TPubSubListener } from "../utility/pubsub/pubsub.types";
import { Signer } from "../keys_and_signers/signers/Signer.ts";
import { BlockchainSignedTransaction } from "./BlockchainSignedTransaction.ts";
import { IPubSub_SingleTransactionExecutor } from "./SingleTransactionExecutor.pubsub.ts";
import { PubSub } from "../utility/pubsub/PubSub.ts";
import { Account } from "../account/Account.ts";

export abstract class SingleTransactionExecutor
  implements IListManageable<IOrdIdentifiable>, ISubscribable<IPubSub_SingleTransactionExecutor>
{
  pubSub: PubSub<IPubSub_SingleTransactionExecutor> =
    new PubSub<IPubSub_SingleTransactionExecutor>();
  protected abstract transaction: BlockchainTransaction;
  protected abstract signedTransaction?: BlockchainSignedTransaction;
  protected abstract account: Account;

  _ord: OrdIdentity = new OrdIdentity();

  abstract execute(temporarySigner?: Signer): Promise<any>;

  getRuntimeUniqueKey(): string | number {
    return this._ord.getOrd();
  }

  isEqualTo(other: IOrdIdentifiable): boolean {
    return this._ord.getOrd() === other._ord.getOrd();
  }

  subscribe<K extends keyof any>(id: K, listener: TPubSubListener<any>): () => void {
    return function () {};
  }

  unsubscribe<K extends keyof any>(id: K, listener: TPubSubListener<any>): void {}
}
