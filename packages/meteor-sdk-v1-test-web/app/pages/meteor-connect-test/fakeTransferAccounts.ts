import { KeyPair } from "@near-js/crypto";

/**
 * Deliberately fake account material for exercising the transfer flow at volume. Mnemonics are
 * word-count-valid strings from a fixed BIP-39 word pool (not checksum-valid wallets); private
 * keys are freshly generated ed25519 keys that have never touched a chain. The receiving
 * wallet's on-chain verification is EXPECTED to reject all of it — the point is bulk testing of
 * staging, bounds, and the transfer protocol without ever handling real secrets.
 *
 * Each batch of 5 covers a diverse spread: 12- and 24-word mnemonics, default and custom
 * derivation paths, private keys, an implicit-style (64-hex) account id, and one account
 * carrying multiple secrets (exercises staged-secret merging).
 */

const WORD_POOL = [
  "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract",
  "acid", "across", "action", "actor", "adapt", "add", "adjust", "admit",
  "advance", "advice", "aerobic", "affair", "afford", "agent", "agree", "ahead",
  "alarm", "album", "alert", "alien", "all", "alley", "allow", "almost",
  "banana", "banner", "barely", "bargain", "barrel", "basic", "basket", "battle",
  "beach", "bean", "beauty", "because", "become", "beef", "before", "begin",
  "cabin", "cable", "cactus", "cage", "cake", "call", "calm", "camera",
  "canal", "cancel", "candy", "cannon", "canoe", "canvas", "canyon", "capable",
  "damage", "damp", "dance", "danger", "daring", "dash", "daughter", "dawn",
  "eagle", "early", "earn", "earth", "easily", "east", "easy", "echo",
] as const;

function randomInt(maxExclusive: number): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0]! % maxExclusive;
}

function randomHex(chars: number): string {
  const bytes = new Uint8Array(Math.ceil(chars / 2));
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, chars);
}

function fakeMnemonic(wordCount: 12 | 24): string {
  return Array.from({ length: wordCount }, () => WORD_POOL[randomInt(WORD_POOL.length)]).join(" ");
}

function fakePrivateKey(): string {
  return KeyPair.fromRandom("ed25519").toString();
}

export interface IFakeTransferAccount {
  accountId: string;
  secrets: Array<{ secretInput: string; derivationPath?: string }>;
}

export function buildFakeTransferAccountBatch(
  network: "testnet" | "mainnet",
): IFakeTransferAccount[] {
  const suffix = network === "testnet" ? ".testnet" : ".near";
  // Fresh tag per batch keeps ids unique across repeated clicks.
  const tag = randomHex(6);
  return [
    {
      accountId: `fake-${tag}-a${suffix}`,
      secrets: [{ secretInput: fakeMnemonic(12) }],
    },
    {
      accountId: `fake-${tag}-b${suffix}`,
      secrets: [
        { secretInput: fakeMnemonic(24), derivationPath: `m/44'/397'/${randomInt(5)}'` },
      ],
    },
    {
      accountId: `fake-${tag}-c${suffix}`,
      secrets: [{ secretInput: fakePrivateKey() }],
    },
    {
      // Implicit-account style: 64 hex chars, no suffix.
      accountId: randomHex(64),
      secrets: [{ secretInput: fakePrivateKey() }],
    },
    {
      // Multi-secret account: mnemonic + private key merge into one staged entry.
      accountId: `fake_${tag}.multi${suffix}`,
      secrets: [{ secretInput: fakeMnemonic(12) }, { secretInput: fakePrivateKey() }],
    },
  ];
}
