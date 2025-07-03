import { KeyPair } from "./KeyPair";
import { KeyPart } from "./KeyPart";
import { EKeyAlgo } from "./key.enums";

export abstract class PrivateKey extends KeyPart {
  abstract algo: EKeyAlgo;
  abstract toKeyPair(): KeyPair;

  isEqualTo(privateKey: PrivateKey): boolean {
    if (privateKey.algo !== this.algo) {
      return false;
    }

    return super.isEqualTo(privateKey);
  }
}
