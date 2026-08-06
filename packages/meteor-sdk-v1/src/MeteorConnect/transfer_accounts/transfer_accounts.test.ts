import { describe, expect, it } from "bun:test";
import {
  decryptAccountsTransferRequestData,
  TRANSFER_ACCOUNTS_MAX_ACCOUNTS,
  TRANSFER_ACCOUNTS_MAX_SECRETS_PER_ACCOUNT,
} from "@meteorwallet/connect-shared";
import type { ITypedStorageHelper } from "../../ported_common/utils/storage/TypedStorageHelper";
import type { IMeteorConnectTypedStorage } from "../MeteorConnect.types";
import type {
  IMobileBridgeSnapshot,
  MobileBridgeSession,
} from "../target_clients/mobile_bridge/MobileBridgeSession";
import { parseTransferSecretInput, TransferAccountsStaging } from "./TransferAccountsStaging";
import { TransferSensitiveAttachment } from "./TransferSensitiveAttachment";

const MNEMONIC_12 =
  "shoot island position soft burden budget tooth cruel issue economy destroy above";
const PRIVATE_KEY =
  "ed25519:3D4YudUahN1nawWogh8pAKSj92sUNMdbZGjn7kERKzYoTy8tnFQuwoGUC51DowKqorvkr2pytJSnwuSbsNVfqygr";

function makeMemoryStorage(): {
  helper: ITypedStorageHelper<IMeteorConnectTypedStorage>;
  raw: Map<string, unknown>;
} {
  const raw = new Map<string, unknown>();
  return {
    raw,
    helper: {
      getJson: async (key) => raw.get(key) as any,
      getJsonOrDef: async (key, def) => (raw.get(key) as any) ?? def,
      setJson: async (key, val) => void raw.set(key, val),
      removeItem: async (key) => void raw.delete(key),
    },
  };
}

function makeStaging(persist = false) {
  const storage = makeMemoryStorage();
  const staging = new TransferAccountsStaging({
    persist,
    getStorage: () => storage.helper,
  });
  return { staging, storage };
}

function makeFakeSession(initialPhase: IMobileBridgeSnapshot["phase"] = "creating_bridge") {
  const listeners = new Set<(snapshot: IMobileBridgeSnapshot) => void>();
  let snapshot: IMobileBridgeSnapshot = {
    phase: initialPhase,
    push: "not_attempted",
    pinAttemptsUsed: 0,
    reconnecting: false,
  };
  const fake = {
    getSnapshot: () => ({ ...snapshot }),
    subscribe: (listener: (s: IMobileBridgeSnapshot) => void) => {
      listeners.add(listener);
      listener({ ...snapshot });
      return () => listeners.delete(listener);
    },
    setPhase: (phase: IMobileBridgeSnapshot["phase"]) => {
      snapshot = { ...snapshot, phase };
      for (const listener of listeners) listener({ ...snapshot });
    },
  };
  return fake as typeof fake & MobileBridgeSession;
}

describe("parseTransferSecretInput", () => {
  it("detects secret kinds via the shared encoder", () => {
    expect(parseTransferSecretInput(MNEMONIC_12)).toEqual({ type: "mnemonic" });
    expect(parseTransferSecretInput(PRIVATE_KEY)).toEqual({ type: "private_key" });
    expect(parseTransferSecretInput("")).toEqual({ type: "invalid", reason: "empty_secret_input" });
    expect(parseTransferSecretInput("one two three")).toEqual({
      type: "invalid",
      reason: "invalid_mnemonic_word_count",
    });
  });
});

describe("TransferAccountsStaging", () => {
  it("passes shared-encoder failure reasons through verbatim", async () => {
    const { staging } = makeStaging();
    const empty = await staging.stage({
      networkId: "testnet",
      accountId: "a.testnet",
      secretInput: " ",
    });
    expect(empty).toMatchObject({ ok: false, reason: "empty_secret_input" });
    const badKey = await staging.stage({
      networkId: "testnet",
      accountId: "a.testnet",
      secretInput: "ed25519:",
    });
    expect(badKey).toMatchObject({ ok: false, reason: "invalid_private_key" });
    const badCount = await staging.stage({
      networkId: "testnet",
      accountId: "a.testnet",
      secretInput: "eleven words only one two three four five six seven eight",
    });
    expect(badCount).toMatchObject({
      ok: false,
      reason: "invalid_mnemonic_word_count",
      wordCount: 11,
    });
  });

  it("rejects bad account ids with a friendly message", async () => {
    const { staging } = makeStaging();
    const badChars = await staging.stage({
      networkId: "testnet",
      accountId: "Bad!Account",
      secretInput: MNEMONIC_12,
    });
    expect(badChars).toMatchObject({ ok: false, reason: "invalid_account_id" });
    const tooShort = await staging.stage({
      networkId: "testnet",
      accountId: "a",
      secretInput: MNEMONIC_12,
    });
    expect(tooShort).toMatchObject({ ok: false, reason: "invalid_account_id" });
  });

  it("merges secrets on re-staging the same identity tuple and dedupes exact repeats", async () => {
    const { staging } = makeStaging();
    const first = await staging.stage({
      networkId: "testnet",
      accountId: " Alice.Testnet ",
      secretInput: MNEMONIC_12,
    });
    expect(first).toMatchObject({ ok: true });
    const second = await staging.stage({
      networkId: "testnet",
      accountId: "alice.testnet",
      secretInput: PRIVATE_KEY,
    });
    expect(second).toMatchObject({
      ok: true,
      account: { accountId: "alice.testnet", secretTypes: ["mnemonic", "private_key"] },
    });
    const duplicate = await staging.stage({
      networkId: "testnet",
      accountId: "alice.testnet",
      secretInput: MNEMONIC_12,
    });
    expect(duplicate).toMatchObject({ ok: false, reason: "duplicate_secret" });
    expect(await staging.getStagedSummaries()).toHaveLength(1);
  });

  it("enforces the shared per-account and per-set bounds", async () => {
    const { staging } = makeStaging();
    for (let i = 0; i < TRANSFER_ACCOUNTS_MAX_SECRETS_PER_ACCOUNT; i++) {
      const result = await staging.stage({
        networkId: "testnet",
        accountId: "alice.testnet",
        secretInput: MNEMONIC_12.replace(
          "shoot",
          [
            "ability",
            "able",
            "about",
            "above",
            "absent",
            "absorb",
            "abstract",
            "absurd",
            "abuse",
            "access",
          ][i]!,
        ),
      });
      expect(result.ok).toBe(true);
    }
    const overflow = await staging.stage({
      networkId: "testnet",
      accountId: "alice.testnet",
      secretInput: MNEMONIC_12.replace("shoot", "accident"),
    });
    expect(overflow).toMatchObject({ ok: false, reason: "too_many_secrets" });

    const { staging: setStaging } = makeStaging();
    for (let i = 0; i < TRANSFER_ACCOUNTS_MAX_ACCOUNTS; i++) {
      const result = await setStaging.stage({
        networkId: "testnet",
        accountId: `account-${i}.testnet`,
        secretInput: MNEMONIC_12,
      });
      expect(result.ok).toBe(true);
    }
    const overflowSet = await setStaging.stage({
      networkId: "testnet",
      accountId: "one-too-many.testnet",
      secretInput: MNEMONIC_12,
    });
    expect(overflowSet).toMatchObject({ ok: false, reason: "too_many_accounts" });
  });

  it("summaries never contain secret material", async () => {
    const { staging } = makeStaging();
    await staging.stage({
      networkId: "testnet",
      accountId: "alice.testnet",
      secretInput: MNEMONIC_12,
    });
    const summaries = await staging.getStagedSummaries();
    const serialized = JSON.stringify(summaries);
    expect(serialized).not.toContain("prefixedBase64DataString");
    expect(serialized).not.toContain(Buffer.from(MNEMONIC_12).toString("base64").slice(0, 16));
  });

  it("persists opt-in, revalidates on load, and drops invalid stored data", async () => {
    const { staging, storage } = makeStaging(true);
    await staging.stage({
      networkId: "testnet",
      accountId: "alice.testnet",
      secretInput: MNEMONIC_12,
    });
    expect(storage.raw.get("stagedTransferAccounts")).toBeDefined();

    const reloaded = new TransferAccountsStaging({
      persist: true,
      getStorage: () => storage.helper,
    });
    expect(await reloaded.getStagedSummaries()).toHaveLength(1);

    storage.raw.set("stagedTransferAccounts", [{ not: "valid" }]);
    const corrupted = new TransferAccountsStaging({
      persist: true,
      getStorage: () => storage.helper,
    });
    expect(await corrupted.getStagedSummaries()).toHaveLength(0);

    await staging.clearStaged();
    expect(storage.raw.has("stagedTransferAccounts")).toBe(false);
  });

  it("does not touch storage when persistence is off", async () => {
    const { staging, storage } = makeStaging(false);
    await staging.stage({
      networkId: "testnet",
      accountId: "alice.testnet",
      secretInput: MNEMONIC_12,
    });
    expect(storage.raw.size).toBe(0);
  });
});

describe("TransferSensitiveAttachment + TransferKeyHandle", () => {
  async function makeBoundAttachment() {
    const staging = makeStaging().staging;
    await staging.stage({
      networkId: "testnet",
      accountId: "alice.testnet",
      secretInput: MNEMONIC_12,
    });
    const accounts = await staging.getStagedWithSecrets();
    const attachment = new TransferSensitiveAttachment({ formatVersion: 1, accounts });
    const actionInput = await attachment.buildFreshBridgePayload();
    const session = makeFakeSession();
    attachment.bindPendingHandleToSession(session);
    return { attachment, actionInput, session };
  }

  it("reveals only at wallet_action, only for the bound session, and round-trips the decrypt", async () => {
    const { attachment, actionInput, session } = await makeBoundAttachment();
    const handle = attachment.getActiveHandle()!;

    expect(handle.getRevealPayload(session)).toBeNull(); // creating_bridge — gate closed
    session.setPhase("wallet_action");
    const payload = handle.getRevealPayload(session);
    expect(payload).not.toBeNull();
    expect(payload!.raw.startsWith("mck1.")).toBe(true);
    expect(payload!.grouped.replaceAll(" ", "")).toBe(payload!.raw);

    // A different session can never unlock the handle, whatever its phase claims.
    const impostor = makeFakeSession("wallet_action");
    expect(handle.getRevealPayload(impostor)).toBeNull();

    // The revealed key decrypts exactly the ciphertext this bridge carried.
    const decrypted = await decryptAccountsTransferRequestData({
      transferKeyString: payload!.raw,
      actionInput,
    });
    expect(decrypted.ok).toBe(true);
    if (decrypted.ok) {
      expect(decrypted.data.accounts[0]!.accountId).toBe("alice.testnet");
    }
  });

  it("wipes on terminal phases and regenerates a fresh key per bridge", async () => {
    const { attachment, actionInput, session } = await makeBoundAttachment();
    const firstHandle = attachment.getActiveHandle()!;
    session.setPhase("wallet_action");
    const firstKey = firstHandle.getRevealPayload(session)!.raw;

    // Refresh: new payload, new key, old handle wiped even before its session ends.
    const secondInput = await attachment.buildFreshBridgePayload();
    expect(firstHandle.isWiped()).toBe(true);
    expect(firstHandle.getRevealPayload(session)).toBeNull();
    const secondSession = makeFakeSession("wallet_action");
    attachment.bindPendingHandleToSession(secondSession);
    const secondHandle = attachment.getActiveHandle()!;
    const secondKey = secondHandle.getRevealPayload(secondSession)!.raw;
    expect(secondKey).not.toBe(firstKey);
    expect(JSON.stringify(secondInput)).not.toBe(JSON.stringify(actionInput));

    // Terminal phase wipes (idempotently).
    secondSession.setPhase("failed");
    expect(secondHandle.isWiped()).toBe(true);
    secondHandle.wipe();
    expect(secondHandle.getRevealPayload(secondSession)).toBeNull();

    // Dispose drops the retained snapshot: no further payloads can be built.
    attachment.dispose();
    await expect(attachment.buildFreshBridgePayload()).rejects.toThrow(
      "transfer_accounts_attachment_disposed",
    );
  });

  it("canary: the key never appears in any serialization or the wire payload", async () => {
    const { attachment, actionInput, session } = await makeBoundAttachment();
    const handle = attachment.getActiveHandle()!;
    session.setPhase("wallet_action");
    const key = handle.getRevealPayload(session)!.raw;

    expect(JSON.stringify(attachment)).toBe('"[REDACTED]"');
    expect(JSON.stringify(handle)).toBe('"[REDACTED]"');
    expect(String(handle)).toBe("[REDACTED]");
    expect(Object.keys(handle)).toEqual([]);
    expect(JSON.stringify(actionInput)).not.toContain(key);
    expect(JSON.stringify(actionInput)).not.toContain(key.split(".")[1]!);
    // The plaintext never appears in the encrypted wire payload either.
    expect(JSON.stringify(actionInput)).not.toContain(
      Buffer.from(MNEMONIC_12).toString("base64").slice(0, 16),
    );
  });
});
