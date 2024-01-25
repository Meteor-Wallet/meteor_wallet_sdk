import { SignedTransaction, Transaction } from "@near-js/transactions";
import { BlockchainSignedTransaction } from "../../../core/transactions/BlockchainSignedTransaction.ts";
import { NearSigner } from "../signers/NearSigner.ts";
import { NearTransaction } from "./NearTransaction.ts";

export class NearSignedTransaction extends BlockchainSignedTransaction {
  readonly nativeSignedTransaction: SignedTransaction;
  readonly nativeSignedTransactionBytes: Uint8Array;
  readonly nativeSignedTransactionBase64: string;
  readonly nativeTransaction: Transaction;
  readonly transaction: NearTransaction;
  signerUsed: NearSigner;

  constructor({
    transaction,
    nativeSignedTransaction,
    nativeSignedTransactionBytes,
    nativeSignedTransactionBase64,
    nativeTransaction,
    signerUsed,
  }: {
    transaction: NearTransaction;
    nativeSignedTransactionBase64: string;
    nativeSignedTransactionBytes: Uint8Array;
    nativeSignedTransaction: SignedTransaction;
    nativeTransaction: Transaction;
    signerUsed: NearSigner;
  }) {
    super();
    this.nativeSignedTransaction = nativeSignedTransaction;
    this.nativeSignedTransactionBytes = nativeSignedTransactionBytes;
    this.nativeSignedTransactionBase64 = nativeSignedTransactionBase64;
    this.nativeTransaction = nativeTransaction;
    this.signerUsed = signerUsed;
    this.transaction = transaction;
  }
}
