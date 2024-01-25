import { BlockchainTransaction } from "./BlockchainTransaction";

export abstract class BlockchainFinalizedTransaction {
  abstract transaction: BlockchainTransaction;
}
