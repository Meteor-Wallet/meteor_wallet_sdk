import { IListManageable } from "../utility/managers/list_manager/list_manager.interfaces";
import { OrdIdentity } from "../utility/managers/list_manager/OrdIdentity";
import { Blockchain } from "../blockchain/Blockchain";
import { BlockchainTransaction } from "./BlockchainTransaction";
import { Account } from "../account/Account";
import { BasicAccount } from "../account/BasicAccount";
import { Token } from "../assets/token/Token";

class MeteorAction {}

export class MeteorTransaction implements IListManageable<MeteorTransaction> {
  _ord = new OrdIdentity();
  // subTransaction: MeteorTransaction[];
  // senderAccount: BasicAccount;
  // receiverAccount: BasicAccount;
  // asset: Token
  // blockchain: Blockchain;
  // blockchainTransaction: BlockchainTransaction;

  getRuntimeUniqueKey(): string | number {
    return this._ord.getOrd();
  }

  isEqualTo(other: MeteorTransaction): boolean {
    return false;
  }
}
