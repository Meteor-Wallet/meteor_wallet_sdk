import bs58 from "bs58";
import nacl from "tweetnacl";
import { TNearWalletBatchAccountTuple } from "../types_nearOfficialWallet";

const STATIC_NONCE = new Uint8Array([
  190, 12, 82, 22, 119, 120, 120, 8, 122, 124, 234, 14, 28, 83, 74, 168, 174, 124, 146, 88, 46, 200,
  208, 82,
]);

export function generateKeyPair() {
  return nacl.sign.keyPair();
}

export function generatePublicKey() {
  return generateKeyPair().publicKey;
}

export function encodeMessage(message, publicKey): Uint8Array {
  const encoder = new TextEncoder();

  return nacl.secretbox(encoder.encode(message), STATIC_NONCE, publicKey);
}

export function decodeMessage(cipherText: Uint8Array, publicKey: Uint8Array) {
  try {
    const opened = nacl.secretbox.open(cipherText, STATIC_NONCE, publicKey);
    if (opened === null) {
      return opened;
    }

    const decoder = new TextDecoder();
    return decoder.decode(opened);
  } catch (e) {
    return null;
  }
}

export function encodeAccountsToHash(
  accountsData: TNearWalletBatchAccountTuple[],
  publicKey: string,
): string {
  const message = accountsData
    .reduce((msg, accountData) => {
      msg.push(accountData.join("="));

      return msg;
    }, [] as string[])
    .join("*");

  return window.btoa(encodeMessage(message, publicKey).toString());
}

/**
 * @deprecated
 *
 * @param hash
 * @param publicKey
 */
export function decodeAccountsFrom(
  hash: string,
  publicKey: string,
): TNearWalletBatchAccountTuple[] {
  const cipherText = Uint8Array.from(window.atob(hash).split(",").map(Number));
  const decoded = decodeMessage(cipherText, keyFromString(publicKey));

  if (decoded == null) {
    throw new Error("Decrypting accounts failed. Make sure the provided password is correct.");
  }

  return (decoded || "")
    .split("*")
    .map((account) => account.split("=") as TNearWalletBatchAccountTuple);
}

function keyFromString(key: string): Uint8Array {
  return bs58.decode(key);
}

function keyToString(key: Uint8Array) {
  return bs58.encode(Buffer.from(key));
}
