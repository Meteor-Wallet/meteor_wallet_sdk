import { PublicKey } from "./PublicKey";
import { PrivateKey } from "./PrivateKey";
import { EKeyAlgo } from "./key.enums.ts";

export abstract class KeyPair {
  abstract readonly algo: EKeyAlgo;
  abstract readonly publicKey: PublicKey;
  abstract readonly privateKey: PrivateKey;
}
