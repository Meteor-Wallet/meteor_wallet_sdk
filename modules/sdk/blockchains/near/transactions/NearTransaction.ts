import { BlockchainTransaction } from "../../../core/transactions/BlockchainTransaction.ts";
import { MeteorTransaction } from "../../../core/transactions/MeteorTransaction.ts";
import { NearAccount } from "../account/NearAccount.ts";
import { Action } from "@near-js/transactions";
import { IWithBasicAccount } from "../../../core/account/account.interfaces.ts";
import { NearBlockchain } from "../NearBlockchain.ts";
import { IMeteorableTransaction } from "../../../core/transactions/transaction.interfaces.ts";
import { NearBasicAccount } from "../account/NearBasicAccount.ts";
import { MeteorError } from "../../../core/errors/MeteorError.ts";
import { EErrorId_Transaction } from "../../../core/errors/MeteorErrorIds.ts";
import { BlockchainNetwork } from "../../../core/blockchain/network/BlockchainNetwork.ts";

export class NearTransaction extends BlockchainTransaction implements IMeteorableTransaction {
  readonly blockchain: NearBlockchain;
  readonly network: BlockchainNetwork;
  readonly senderAccount: IWithBasicAccount<NearBasicAccount> | NearAccount;
  readonly actions: Action[];
  readonly receiverAccount: IWithBasicAccount<NearBasicAccount> | NearAccount;
  meteorTransaction?: MeteorTransaction;

  constructor({
    sender,
    actions,
    receiver,
  }: {
    sender: IWithBasicAccount<NearBasicAccount> | NearAccount;
    actions: Action[];
    receiver: IWithBasicAccount<NearBasicAccount> | NearAccount;
  }) {
    super();
    this.blockchain = sender.basic.blockchain;
    this.network = sender.basic.getNetwork();
    this.senderAccount = sender;
    this.receiverAccount = receiver;
    this.actions = actions;
  }

  getSenderFullAccount(): NearAccount {
    if (!(this.senderAccount instanceof NearAccount)) {
      throw MeteorError.fromId(EErrorId_Transaction.transaction_sender_is_not_full_account);
    }

    return this.senderAccount;
  }

  toMeteor(): MeteorTransaction {
    if (this.meteorTransaction) return this.meteorTransaction;

    this.actions.find((action) => action.functionCall?.methodName === "transfer");
    return new MeteorTransaction();
  }
}
