import { PublicKey } from "../PublicKey";
import { EKeyAlgo } from "../key.enums.ts";

export class Ed25519PublicKey extends PublicKey {
  algo = EKeyAlgo.ed25519;
}
