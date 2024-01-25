import { PublicKey } from "@near-js/crypto";
import { Action } from "@near-js/transactions";
import BN from "bn.js";
// https://near.github.io/near-api-js/modules/transaction#parameters-1
export interface IOCreateTransaction_Inputs {
  signerId: string;
  publicKey: PublicKey;
  receiverId: string;
  nonce: string | number | BN;
  actions: Action[];
  blockHash: Uint8Array;
}

export interface INearSignerExtras {
  getPrefixedPublicKeyString(): string;
}
