import { MeteorTransaction } from "./MeteorTransaction";
import { Account } from "../account/Account";
import { Blockchain } from "../blockchain/Blockchain";
import { IListManageable } from "../utility/managers/list_manager/list_manager.interfaces";
import { OrdIdentity } from "../utility/managers/list_manager/OrdIdentity";
import { IWithBasicAccount } from "../account/account.interfaces.ts";
import { MeteorError } from "../errors/MeteorError.ts";
import { EErrorId_Transaction } from "../errors/MeteorErrorIds.ts";
import { IMeteorableTransaction } from "./transaction.interfaces";

export abstract class BlockchainTransaction
  implements IListManageable<BlockchainTransaction>, IMeteorableTransaction
{
  _ord: OrdIdentity = new OrdIdentity();
  abstract blockchain: Blockchain;
  abstract senderAccount: Account | IWithBasicAccount;
  abstract receiverAccount: Account | IWithBasicAccount;

  getSenderFullAccount(): Account {
    if (!(this.senderAccount instanceof Account)) {
      throw MeteorError.fromId(EErrorId_Transaction.transaction_sender_is_not_full_account);
    }

    return this.senderAccount;
  }

  getReceiverFullAccount(): Account {
    if (!(this.receiverAccount instanceof Account)) {
      throw MeteorError.fromId(EErrorId_Transaction.transaction_receiver_is_not_full_account);
    }

    return this.receiverAccount;
  }

  senderIsFullAccount(): boolean {
    return this.senderAccount instanceof Account;
  }

  receiverIsFullAccount(): boolean {
    return this.receiverAccount instanceof Account;
  }

  getRuntimeUniqueKey(): string | number {
    return this._ord.getOrd();
  }

  isEqualTo(other: BlockchainTransaction): boolean {
    return this._ord.getOrd() !== other._ord.getOrd();
  }

  abstract toMeteor(): MeteorTransaction;
}
