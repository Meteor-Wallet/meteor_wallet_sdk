import { PrivateKey } from "./PrivateKey";
import { PublicKey } from "./PublicKey";
import { EKeyAlgo } from "./key.enums";

export abstract class KeyPair {
  abstract readonly algo: EKeyAlgo;
  abstract readonly publicKey: PublicKey;
  abstract readonly privateKey: PrivateKey;
}
