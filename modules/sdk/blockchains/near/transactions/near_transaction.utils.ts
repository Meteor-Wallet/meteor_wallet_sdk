import {
  Action,
  createTransaction,
  encodeTransaction,
  Signature,
  SignedTransaction,
  Transaction,
} from "@near-js/transactions";
import { BN } from "bn.js";
import { PublicKey } from "@near-js/crypto";
import { sha256 } from "js-sha256";
import nacl from "tweetnacl";
import { Ed25519KeyPair } from "../../../core/keys_and_signers/keys/ed25519/Ed25519KeyPair.ts";
import { encoding_base58 } from "../../../core/utility/javascript_encoding/encoding_base58.utils.ts";

interface IOSignTransaction_Inputs {
  receiverId: string;
  signerId: string;
  signerKeyPair: Ed25519KeyPair;
  nonce: string;
  actions: Action[];
  blockHash: Uint8Array;
}

interface IOSignTransaction_Outputs {
  hash: string;
  signedTransaction: SignedTransaction;
  signedTransactionBytes: Uint8Array;
  signedTransactionBase64: string;
  createdTransaction: Transaction;
}

function signTransactionWithKeyPair({
  receiverId,
  nonce,
  signerKeyPair,
  signerId,
  actions,
  blockHash,
}: IOSignTransaction_Inputs): IOSignTransaction_Outputs {
  const transaction = createTransaction(
    signerId,
    PublicKey.fromString(signerKeyPair.publicKey.getKeyData().toBase58()),
    receiverId,
    new BN(nonce),
    actions,
    blockHash,
  );

  // Using borsh library to serialize data in the form of Uint8Array
  const message = encodeTransaction(transaction);

  // sha256 hash of the encoded transaction (becomes the transaction hash, which can be referenced in Explorer)
  const hash = new Uint8Array(sha256.array(message));
  const signature = nacl.sign.detached(hash, signerKeyPair.privateKey.getKeyData().bytes());

  const signedTransaction = new SignedTransaction({
    transaction,
    signature: new Signature({ keyType: transaction.publicKey.keyType, data: signature }),
  });

  const signedTransactionBytes = encodeTransaction(signedTransaction);

  return {
    hash: encoding_base58.encode(hash),
    signedTransaction,
    signedTransactionBytes,
    signedTransactionBase64: Buffer.from(signedTransactionBytes).toString("base64"),
    createdTransaction: transaction,
  };
}

export const near_transaction_utils = {
  signTransactionWithKeyPair,
};
