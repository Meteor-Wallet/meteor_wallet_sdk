import * as bip39 from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
// @ts-ignore
import bs58 from "bs58";
import nacl from "tweetnacl";

import { KeyPair, KeyPairString } from "@near-js/crypto";
import { derivePath } from "ed25519-hd-key";

const KEY_DERIVATION_PATH = "m/44'/397'/0'";

function generateSeedPhrase(): string {
  return bip39.generateMnemonic(wordlist);
}

function normalizeSeedPhrase(seedPhrase: string): string {
  return seedPhrase
    .trim()
    .split(/\s+/)
    .map((part) => part.toLowerCase())
    .join(" ");
}

export interface IParseSecretKey_Output {
  privateKey: string;
  publicKey: string;
  implicitId: string;
}

interface IParseSeedPhrase_Output extends IParseSecretKey_Output {
  seedPhrase: string;
}

function parseKeyPair(keyPair: nacl.SignKeyPair): IParseSecretKey_Output {
  const publicKey = "ed25519:" + bs58.encode(Buffer.from(keyPair.publicKey));
  const privateKey = "ed25519:" + bs58.encode(Buffer.from(keyPair.secretKey));

  const recoveryKeyPair = KeyPair.fromString(privateKey as KeyPairString);
  const implicitId = Buffer.from(recoveryKeyPair.getPublicKey().data).toString("hex");
  /*const implicitAccountIdTwo = Buffer.from(keyPair.publicKey).toString("hex");

  console.log(
    `Implicit compare: [${implicitId}] or [${implicitAccountIdTwo}] (public key: ${publicKey} == ${bs58.encode(
      Buffer.from(recoveryKeyPair.getPublicKey().data),
    )})`,
  );*/

  return {
    publicKey,
    privateKey,
    implicitId,
  };
}

function parseSeedPhrase(seedPhrase: string, derivationPath?: string): IParseSeedPhrase_Output {
  const seedPhraseNormalized = normalizeSeedPhrase(seedPhrase);
  const seed = bip39.mnemonicToSeedSync(seedPhraseNormalized);
  const { key } = derivePath(
    derivationPath ?? KEY_DERIVATION_PATH,
    Buffer.from(seed).toString("hex"),
  );
  const keyPair = nacl.sign.keyPair.fromSeed(key);
  /*const publicKey = "ed25519:" + bs58.encode(Buffer.from(keyPair.publicKey));
  const privateKey = "ed25519:" + bs58.encode(Buffer.from(keyPair.secretKey));

  const recoveryKeyPair = KeyPair.fromString(privateKey);
  const implicitId = Buffer.from(recoveryKeyPair.getPublicKey().data).toString("hex");
  const implicitAccountIdTwo = Buffer.from(keyPair.publicKey).toString("hex");

  console.log(
    `Implicit compare: [${implicitId}] or [${implicitAccountIdTwo}] (public key: ${publicKey} == ${bs58.encode(
      Buffer.from(recoveryKeyPair.getPublicKey().data),
    )})`,
  );*/

  return {
    seedPhrase: seedPhraseNormalized,
    ...parseKeyPair(keyPair),
  };
}

/*
const ED25519_CURVE = "ed25519 seed";

interface IKeys {
  key: Buffer;
  chainCode: Buffer;
}

const getMasterKeyFromSeed = async (seed: string): Promise<IKeys> => {
  const key = await crypto.subtle.generateKey({ name: "HMAC", hash: "SHA-512" }, true, ["sign", "verify"]);

  const hmac = crypto.subtle.sign({ name: "HMAC" }, ED25519_CURVE, seed);
  const I = hmac.update(Buffer.from(seed, "hex")).digest();
  const IL = I.slice(0, 32);
  const IR = I.slice(32);
  return {
    key: IL,
    chainCode: IR,
  };
};*/

function parseSecretKey(secretKey: string): IParseSecretKey_Output {
  const keyPair = KeyPair.fromString(secretKey as KeyPairString);

  const privateKey = keyPair.toString();
  const publicKey = keyPair.getPublicKey().toString();
  const implicitId = Buffer.from(keyPair.getPublicKey().data).toString("hex");

  // console.log(keyPair);
  /*const publicKey = "ed25519:" + bs58.encode(Buffer.from(keyPair.publicKey));
  const privateKey = "ed25519:" + bs58.encode(Buffer.from(keyPair.secretKey));

  const recoveryKeyPair = KeyPair.fromString(privateKey);
  const implicitId = Buffer.from(recoveryKeyPair.getPublicKey().data).toString("hex");
  const implicitAccountIdTwo = Buffer.from(keyPair.publicKey).toString("hex");

  console.log(
    `Implicit compare: [${implicitId}] or [${implicitAccountIdTwo}] (public key: ${publicKey} == ${bs58.encode(
      Buffer.from(recoveryKeyPair.getPublicKey().data),
    )})`,
  );

  return {
    seedPhrase,
    publicKey,
    privateKey,
    implicitId,
  };*/

  // return parseKeyPair(keyPair);
  return {
    privateKey,
    publicKey,
    implicitId,
  };
}

function validatePrivateKey(privateKey) {
  try {
    KeyPair.fromString(privateKey);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export const SeedPhraseAndKeysUtil = {
  KEY_DERIVATION_PATH,
  generateSeedPhrase,
  normalizeSeedPhrase,
  parseSeedPhrase,
  parseSecretKey,
  validatePrivateKey,
};
