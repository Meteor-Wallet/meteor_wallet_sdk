import { Signer } from "../keys_and_signers/signers/Signer";
import { BlockchainTransaction } from "./BlockchainTransaction";
import { IListManageable } from "../utility/managers/list_manager/list_manager.interfaces";
import { OrdIdentity } from "../utility/managers/list_manager/OrdIdentity";

export abstract class BlockchainSignedTransaction
  implements IListManageable<{ transaction: BlockchainTransaction }>
{
  _ord: OrdIdentity = new OrdIdentity();

  abstract transaction: BlockchainTransaction;
  abstract signerUsed: Signer;

  getRuntimeUniqueKey(): string | number {
    return this._ord.getOrd();
  }

  isEqualTo(other: { transaction: BlockchainTransaction }): boolean {
    return this.transaction.isEqualTo(other.transaction);
  }
}
