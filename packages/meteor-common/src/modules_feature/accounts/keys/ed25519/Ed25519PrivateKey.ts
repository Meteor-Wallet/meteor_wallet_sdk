import { KeyPair } from "../KeyPair";
import { PrivateKey } from "../PrivateKey";
import { EKeyAlgo } from "../key.enums";
import { Ed25519KeyPair } from "./Ed25519KeyPair";

export class Ed25519PrivateKey extends PrivateKey {
  algo = EKeyAlgo.ed25519;
  toKeyPair(): KeyPair {
    return Ed25519KeyPair.fromPrivateKey(this);
  }

  toPrefixedString(): string {
    return `ed25519:${this.data.toBase58()}`;
  }
}
