import { Signer } from "./Signer";
import { ESignerGenericType } from "./signer.enums.ts";
import { KeyPair } from "../keys/KeyPair";
import { IStorableDataOnly } from "../../utility/data_entity/storable/storable.interfaces.ts";
import { IKeyPairSignerStorableData } from "./signer.storable.interfaces.ts";
import { Account } from "../../account/Account.ts";

export abstract class KeyPairSigner
  extends Signer
  implements IStorableDataOnly<IKeyPairSignerStorableData>
{
  genericType = ESignerGenericType.key_pair;

  keyPair: KeyPair;

  protected constructor({
    keyPair,
    userBackedUp,
    account,
  }: {
    keyPair: KeyPair;
    userBackedUp: boolean;
    account: Account;
  }) {
    super({ userBackedUp, account });
    this.keyPair = keyPair;
  }

  getStorableData(): IKeyPairSignerStorableData {
    return {
      ...super.getStorableData(),
      privateKeyBase64: this.keyPair.privateKey.getKeyData().toBase64(),
    };
  }
}
