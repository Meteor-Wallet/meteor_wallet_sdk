import * as bip39 from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { getBip39Adapter } from "../../../../../platform_adapters/cryptography/bip39Adapter.ts";

function normalizeSeedPhrase(seedPhrase: string): string {
  return seedPhrase
    .trim()
    .split(/\s+/)
    .map((part) => part.toLowerCase())
    .join(" ");
}

async function generateSeedPhrase(): Promise<string> {
  const seedPhrase = await getBip39Adapter().generateMnemonic(wordlist);
  return normalizeSeedPhrase(seedPhrase);
}

async function seedPhraseToKeyBytes(seedPhrase: string): Promise<Uint8Array> {
  return getBip39Adapter().mnemonicToSeed(normalizeSeedPhrase(seedPhrase));
}

function isValidSeedPhrase(seedPhrase: string): boolean {
  const normalizedArray = normalizeSeedPhrase(seedPhrase).split(" ");
  return normalizedArray.length === 12 && !normalizedArray.some((word) => word.length < 3);
}

export const seed_phrase_utils = {
  normalizeSeedPhrase,
  seedPhraseToKeyBytes,
  generateSeedPhrase,
  isValidSeedPhrase,
};
