import { PrivateKey } from "../PrivateKey";
import { KeyPair } from "../KeyPair";
import { EKeyAlgo } from "../key.enums.ts";
import { Ed25519KeyPair } from "./Ed25519KeyPair";

export class Ed25519PrivateKey extends PrivateKey {
  algo = EKeyAlgo.ed25519;
  toKeyPair(): KeyPair {
    return Ed25519KeyPair.fromPrivateKey(this);
  }
}
