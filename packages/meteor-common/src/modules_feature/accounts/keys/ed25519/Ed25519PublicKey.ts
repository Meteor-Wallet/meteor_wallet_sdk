import { PublicKey } from "../PublicKey";
import { EKeyAlgo } from "../key.enums";

export class Ed25519PublicKey extends PublicKey {
  algo = EKeyAlgo.ed25519;

  toPrefixedString(): string {
    return `ed25519:${this.data.toBase58()}`;
  }
}
