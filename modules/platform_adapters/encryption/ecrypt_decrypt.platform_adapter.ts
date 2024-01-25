import { createPlatformAdapter } from "../platform_adapter_utils.ts";

export interface IEncryptionResult {
  payload: string;
  salt: string;
}

interface IEncryptDecryptAdapter {
  encryptData: <R>(cipherKey: string, dataObj: R) => Promise<IEncryptionResult>;
  decryptData: <R>(cipherKey: string, salt: string, payload: string) => Promise<R>;
  generateSalt: (byteCount?: number) => string;
}

const { setAdapter, getAdapter } = createPlatformAdapter<IEncryptDecryptAdapter>("encrypt_decrypt");

export const setEncryptDecryptAdapter = setAdapter;
export const getEncryptDecryptAdapter = getAdapter;
