import { KeyPart } from "./KeyPart";
import { KeyPair } from "./KeyPair";
import { PublicKey } from "./PublicKey";
import { EKeyAlgo } from "./key.enums.ts";

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
