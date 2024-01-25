import { BlockchainTransaction } from "../../transactions/BlockchainTransaction";
import { BlockchainSignedTransaction } from "../../transactions/BlockchainSignedTransaction";
import { ESignerGenericType } from "./signer.enums.ts";
import { PublicKey } from "../keys/PublicKey";
import { TSignerDerivation_All } from "../signer_origins/signer_origin.interfaces";
import { IListManageable } from "../../utility/managers/list_manager/list_manager.interfaces";
import { OrdIdentity } from "../../utility/managers/list_manager/OrdIdentity";
import {
  IStorable,
  IStorableDataOnly,
} from "../../utility/data_entity/storable/storable.interfaces.ts";
import { ISignerStorableData } from "./signer.storable.interfaces.ts";
import { TSignerDerivation_All_StorableData } from "../signer_origins/signer_origin.storable.interfaces.ts";
import { ESignerOriginGenericType } from "../signer_origins/signer_origin.enums.ts";
import { MeteorInternalError } from "../../errors/MeteorError.ts";
import { Account } from "../../account/Account.ts";
import { hash_utils } from "../../utility/hashing/hashing.utils.ts";

export abstract class Signer implements IListManageable<Signer>, IStorable<ISignerStorableData> {
  _ord: OrdIdentity = new OrdIdentity();
  account: Account;

  abstract genericType: ESignerGenericType;

  abstract derivation: TSignerDerivation_All;

  abstract getPublicKey(): PublicKey;

  userBackedUp: boolean;

  storableUniqueKey: Promise<string>;

  protected constructor({ userBackedUp, account }: { userBackedUp: boolean; account: Account }) {
    this.account = account;
    this.userBackedUp = userBackedUp;
    this.storableUniqueKey = this.getStorableUniqueKey();
  }

  async getStorableUniqueKey(): Promise<string> {
    return hash_utils.hashObjectForStorageKey({
      genericType: this.genericType,
      accountKey: await this.account.storableUniqueKey,
      publicKey: this.getPublicKey().getKeyData().toBase64(),
    });
  }

  getStorableData(): ISignerStorableData {
    return {
      derivation: this.getDerivationStorableData(),
      genericType: this.genericType,
      userBackedUp: this.userBackedUp,
      account: {
        blockchainId: this.account.getBlockchain().id,
        id: this.account.basic.id,
        genericNetworkId: this.account.basic.genericNetworkId,
        customNetworkId: this.account.basic.customNetworkId,
      },
    };
  }

  getDerivationStorableData(): TSignerDerivation_All_StorableData {
    if (
      this.derivation.originType === ESignerOriginGenericType.seed_phrase ||
      this.derivation.originType === ESignerOriginGenericType.hardware
    ) {
      return {
        ...this.derivation.origin.getStorableData(),
        derivation: this.derivation.derivation,
      };
    }

    if (this.derivation.originType === ESignerOriginGenericType.no_origin_private_key) {
      return {
        originType: ESignerOriginGenericType.no_origin_private_key,
        derivation: this.derivation.derivation,
      };
    }

    throw new MeteorInternalError(
      "Signer didn't have storable data for its signer origin derivation",
    );
  }

  getRuntimeUniqueKey(): string | number {
    return this._ord.getOrd();
  }

  isEqualTo(other: Signer): boolean {
    if (this.genericType !== other.genericType) {
      return false;
    }

    return this.getPublicKey().isEqualTo(other.getPublicKey());
  }

  abstract signTransaction(
    blockchainTransaction: BlockchainTransaction,
  ): Promise<BlockchainSignedTransaction>;
}
