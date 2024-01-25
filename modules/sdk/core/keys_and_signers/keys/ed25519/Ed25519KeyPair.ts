import { KeyPair } from "../KeyPair";
import { Ed25519PublicKey } from "./Ed25519PublicKey";
import { Ed25519PrivateKey } from "./Ed25519PrivateKey";
import { EKeyAlgo } from "../key.enums.ts";
import { KeyData } from "../KeyData";
import nacl from "tweetnacl";

export class Ed25519KeyPair extends KeyPair {
  readonly algo = EKeyAlgo.ed25519;
  readonly publicKey: Ed25519PublicKey;
  readonly privateKey: Ed25519PrivateKey;

  constructor(publicKey: Ed25519PublicKey, privateKey: Ed25519PrivateKey) {
    super();
    this.publicKey = publicKey;
    this.privateKey = privateKey;
  }

  static fromPrivateKey(privateKey: Ed25519PrivateKey): Ed25519KeyPair {
    const keyPair = nacl.sign.keyPair.fromSecretKey(privateKey.getKeyData().bytes());
    const publicKey = new Ed25519PublicKey(new KeyData(keyPair.publicKey));
    return new Ed25519KeyPair(publicKey, privateKey);
  }
}
