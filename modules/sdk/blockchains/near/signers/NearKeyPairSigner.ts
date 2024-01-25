import { NearSignedTransaction } from "../transactions/NearSignedTransaction.ts";
import { NearTransaction } from "../transactions/NearTransaction.ts";
import { KeyPairSigner } from "../../../core/keys_and_signers/signers/KeyPairSigner";
import { Ed25519KeyPair } from "../../../core/keys_and_signers/keys/ed25519/Ed25519KeyPair";
import { Ed25519PublicKey } from "../../../core/keys_and_signers/keys/ed25519/Ed25519PublicKey";
import {
  INoOriginPrivateKeySignerDerivation,
  ISeedPhraseSignerDerivation,
} from "../../../core/keys_and_signers/signer_origins/signer_origin.interfaces";
import {
  createTransaction,
  encodeTransaction,
  Signature,
  SignedTransaction,
} from "@near-js/transactions";
import nacl from "tweetnacl";
import { encoding_base58 } from "../../../core/utility/javascript_encoding/encoding_base58.utils";
import { sha256 } from "js-sha256";
import { KeyType, PublicKey } from "@near-js/crypto";
import { BN } from "bn.js";
import { INearSignerExtras } from "./near_signers.interfaces.ts";
import { IStorableDataOnly } from "../../../core/utility/data_entity/storable/storable.interfaces.ts";
import { NearAccount } from "../account/NearAccount.ts";
import { IKeyPairSignerStorableData } from "../../../core/keys_and_signers/signers/signer.storable.interfaces.ts";
import { near_transaction_utils } from "../transactions/near_transaction.utils.ts";

export class NearKeyPairSigner
  extends KeyPairSigner
  implements INearSignerExtras, IStorableDataOnly<IKeyPairSignerStorableData>
{
  derivation: ISeedPhraseSignerDerivation | INoOriginPrivateKeySignerDerivation;
  keyPair: Ed25519KeyPair;
  keyType = KeyType.ED25519;
  account: NearAccount;
  storableUniqueKey: Promise<string>;

  constructor({
    keyPair,
    derivation,
    userBackedUp = false,
    account,
  }: {
    keyPair: Ed25519KeyPair;
    derivation: ISeedPhraseSignerDerivation | INoOriginPrivateKeySignerDerivation;
    userBackedUp?: boolean;
    account: NearAccount;
  }) {
    super({ keyPair, userBackedUp, account });
    this.keyPair = keyPair;
    this.derivation = derivation;
    this.account = account;
    this.storableUniqueKey = this.getStorableUniqueKey();
  }

  getPrefixedPublicKeyString(): string {
    return `ed25519:${this.getPublicKey().getKeyData().toBase58()}`;
  }

  getPrefixedPrivateKeyString(): string {
    return `ed25519:${this.keyPair.privateKey.getKeyData().toBase58()}`;
  }

  getPublicKey(): Ed25519PublicKey {
    return this.keyPair.publicKey;
  }

  async signTransaction(transaction: NearTransaction): Promise<NearSignedTransaction> {
    // Construct the Transaction and Sign it (using nonce and latest blockhash)
    // get latest nonce and blockhash from rpc
    const rpcProvider = transaction.getSenderFullAccount().getRpcProvider();
    const response = await rpcProvider.viewAccessKey({
      account_id: transaction.senderAccount.basic.id,
      public_key: this.getPublicKey().getKeyData().toBase58(),
    });

    console.log("View access key response", response);

    const nonce = new BN(response.nonce);
    const blockhash = response.block_hash;

    const {
      signedTransaction,
      signedTransactionBytes,
      signedTransactionBase64,
      hash,
      createdTransaction,
    } = near_transaction_utils.signTransactionWithKeyPair({
      signerKeyPair: this.keyPair,
      signerId: transaction.senderAccount.basic.id,
      blockHash: encoding_base58.decode(blockhash),
      receiverId: transaction.receiverAccount.basic.id,
      actions: transaction.actions,
      nonce: nonce.add(new BN(1)).toString(),
    });

    return new NearSignedTransaction({
      nativeSignedTransaction: signedTransaction,
      nativeSignedTransactionBytes: signedTransactionBytes,
      nativeSignedTransactionBase64: signedTransactionBase64,
      nativeTransaction: createdTransaction,
      signerUsed: this,
      transaction,
    });
  }
}
