import { nanoid } from "nanoid";
import { INewPasswordData } from "../../modules_feature/accounts/account_types";
import {
  CRYPTO_SALT_PASSWORD_CIPHER_KEY,
  CRYPTO_SALT_PASSWORD_MATCH,
  METEOR_GLOBAL_PASSWORD_PADDING_HASH_END,
  METEOR_GLOBAL_PASSWORD_PADDING_HASH_STA,
} from "./meteor_crypto_constants";

function arrayBufferToHex(buffer: ArrayBuffer): string {
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function getOldPasswordMatchHash(password: string): Promise<string> {
  const data = new TextEncoder().encode(`${password}${CRYPTO_SALT_PASSWORD_MATCH}`);
  return arrayBufferToHex(await crypto.subtle.digest("SHA-256", data));
}

async function getOldPasswordCipherKeyHash(password: string): Promise<string> {
  const data = new TextEncoder().encode(`${password}${CRYPTO_SALT_PASSWORD_CIPHER_KEY}`);
  return arrayBufferToHex(await crypto.subtle.digest("SHA-256", data));
}

async function getOldPasswordHashes(password: string): Promise<{
  matchHash: string;
  cipherHash: string;
}> {
  return {
    matchHash: await getOldPasswordMatchHash(password),
    cipherHash: await getOldPasswordCipherKeyHash(password),
  };
}

async function getWalletIdHash(walletId: string): Promise<string> {
  const data = new TextEncoder().encode(`${walletId}${CRYPTO_SALT_PASSWORD_CIPHER_KEY}`);
  return arrayBufferToHex(await crypto.subtle.digest("SHA-256", data));
}

async function createPaddedPasswordHash(password: string): Promise<string> {
  const data = new TextEncoder().encode(
    `${METEOR_GLOBAL_PASSWORD_PADDING_HASH_STA}${password}${METEOR_GLOBAL_PASSWORD_PADDING_HASH_END}`,
  );
  return arrayBufferToHex(await crypto.subtle.digest("SHA-256", data));
}

function getNewWalletUserSalt(): string {
  return nanoid(16);
}

async function getNewPasswordMatchHash(paddedPasswordHash: string, userSalt: string) {
  const data = new TextEncoder().encode(
    `${userSalt}${paddedPasswordHash}${CRYPTO_SALT_PASSWORD_MATCH}`,
  );
  return arrayBufferToHex(await crypto.subtle.digest("SHA-256", data));
}

async function getNewPasswordCipherKeyHash(paddedPasswordHash: string, userSalt: string) {
  const data = new TextEncoder().encode(
    `${userSalt}${paddedPasswordHash}${CRYPTO_SALT_PASSWORD_CIPHER_KEY}`,
  );
  return arrayBufferToHex(await crypto.subtle.digest("SHA-256", data));
}

async function getNewPasswordDataFromPassword(
  password: string,
  userSalt: string,
): Promise<INewPasswordData> {
  const paddedPasswordHash = await createPaddedPasswordHash(password);
  return getNewPasswordDataFromPaddedHash(paddedPasswordHash, userSalt);
}

async function getNewPasswordDataFromPaddedHash(
  paddedPasswordHash: string,
  userSalt: string,
): Promise<INewPasswordData> {
  return {
    paddedPasswordHash,
    matchHash: await getNewPasswordMatchHash(paddedPasswordHash, userSalt),
    cipherHash: await getNewPasswordCipherKeyHash(paddedPasswordHash, userSalt),
  };
}

export const MeteorEncryptionUtils = {
  getOldPasswordMatchHash,
  getOldPasswordCipherKeyHash,
  getWalletIdHash,
  createPaddedPasswordHash,
  getNewWalletUserSalt,
  getNewPasswordMatchHash,
  getNewPasswordCipherKeyHash,
  getOldPasswordHashes,
  getNewPasswordDataFromPassword,
  getNewPasswordDataFromPaddedHash,
};
