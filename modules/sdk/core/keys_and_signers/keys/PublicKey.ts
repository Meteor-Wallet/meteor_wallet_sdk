import { KeyPart } from "./KeyPart";
import { EKeyAlgo } from "./key.enums.ts";
import { IEqualityCheckable } from "../../utility/managers/list_manager/list_manager.interfaces";

export abstract class PublicKey extends KeyPart implements IEqualityCheckable<PublicKey> {
  abstract algo: EKeyAlgo;

  isEqualTo(publicKey: PublicKey): boolean {
    if (publicKey.algo !== this.algo) {
      return false;
    }

    return super.isEqualTo(publicKey);
  }
}
