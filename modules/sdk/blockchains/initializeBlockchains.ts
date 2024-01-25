import { Blockchain } from "../core/blockchain/Blockchain.ts";
import { initializeNearBlockchain } from "./near/initializeNearBlockchain.ts";

export function initializeBlockchains(): Blockchain[] {
  const near = initializeNearBlockchain();

  return [near];
}
