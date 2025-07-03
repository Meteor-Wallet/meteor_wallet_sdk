import { KeyPart } from "./KeyPart";
import { EKeyAlgo } from "./key.enums";

export abstract class PublicKey extends KeyPart {
  abstract algo: EKeyAlgo;

  isEqualTo(publicKey: PublicKey): boolean {
    if (publicKey.algo !== this.algo) {
      return false;
    }

    return super.isEqualTo(publicKey);
  }
}
