import {
  deriveNearSigningKeyFromAccountSecret,
  type IAddKeyJournalChain,
  type IAddKeyJournalJob,
  type IAddKeySignedTransaction,
  type TAccountTransferDataDecrypted,
} from "@meteorwallet/sdk";
import { PublicKey } from "@near-js/crypto";
import { KeyPairSigner } from "@near-js/signers";
import { actionCreators, createTransaction } from "@near-js/transactions";
import { base58, base64 } from "@scure/base";

/**
 * The host half of the new-key transfer: sign and broadcast the AddKey that puts the destination
 * wallet's freshly minted public key onto each source account.
 *
 * This is the `IAddKeyJournalChain` seam. The SDK owns the crash-safe journal around it — intent
 * recorded before signing, signed bytes recorded before broadcast, rebroadcast of the identical
 * bytes when a result is ambiguous — and hands these methods nothing but the job's PUBLIC identity.
 * The source full-access key never reaches the SDK; it is resolved here, from the staged secrets
 * this harness already holds.
 *
 * Harness-grade on purpose: it signs with the staged secret and talks to the public NEAR RPC. A
 * production host would resolve the signing key from its own keystore, but the seam is the same
 * shape — My NEAR Wallet's (`meteorConnectAddKeyChain.js`) is the one this mirrors.
 */

const RPC_URLS = {
  mainnet: "https://rpc.mainnet.near.org",
  testnet: "https://rpc.testnet.near.org",
} as const;

type TNearNetworkId = keyof typeof RPC_URLS;

let rpcRequestId = 0;

const RPC_ATTEMPTS = 4;

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const rpcOnce = async (
  networkId: TNearNetworkId,
  method: string,
  params: unknown,
): Promise<unknown> => {
  const response = await fetch(RPC_URLS[networkId], {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: (rpcRequestId += 1), method, params }),
  });
  if (!response.ok) throw new Error(`NEAR RPC ${method} failed with HTTP ${response.status}`);
  const body: { result?: unknown; error?: { message?: string } } = await response.json();
  if (body.error != null) {
    throw new Error(`NEAR RPC ${method} failed: ${body.error.message ?? "unknown error"}`);
  }
  return body.result;
};

/**
 * Retry only TRANSPORT failures — a `fetch` that never produced a response. A public RPC drops
 * connections often enough that a single blip would otherwise abort a transfer mid-AddKey and
 * leave the journal to recover from something that was never really a failure.
 *
 * An RPC-level error (an `error` member, or a non-2xx) is an answer, not a lost request, and is
 * surfaced immediately. Re-sending is safe for every method here including `send_tx`: the bytes
 * are already signed and fixed, so a duplicate is the same transaction, which is exactly what the
 * journal's own rebroadcast relies on.
 */
const rpcCall = async (
  networkId: TNearNetworkId,
  method: string,
  params: unknown,
): Promise<unknown> => {
  let lastError: unknown;
  for (let attempt = 0; attempt < RPC_ATTEMPTS; attempt += 1) {
    try {
      return await rpcOnce(networkId, method, params);
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
      lastError = error;
      await delay(400 * 2 ** attempt);
    }
  }
  throw new Error(
    `NEAR RPC ${method} could not be reached after ${RPC_ATTEMPTS} attempts: ${String(lastError)}`,
  );
};

/** Narrow the access-key view to the one field this needs, or say plainly that it was not there. */
const readNonce = (result: unknown): bigint => {
  if (typeof result === "object" && result != null && "nonce" in result) {
    const { nonce } = result;
    if (typeof nonce === "number" || typeof nonce === "string" || typeof nonce === "bigint") {
      return BigInt(nonce);
    }
  }
  throw new Error("NEAR RPC view_access_key returned no usable nonce");
};

/** Narrow the block view to its hash, or say plainly that it was not there. */
const readBlockHash = (result: unknown): string => {
  if (typeof result === "object" && result != null && "header" in result) {
    const { header } = result;
    if (typeof header === "object" && header != null && "hash" in header) {
      const { hash } = header;
      if (typeof hash === "string") return hash;
    }
  }
  throw new Error("NEAR RPC block returned no usable header hash");
};

/** A field of an RPC answer as a bigint (NEAR sends u128s as strings), or say plainly it was not there. */
const readBigIntField = (result: unknown, field: string, method: string): bigint => {
  if (typeof result === "object" && result != null && field in result) {
    const value: unknown = Reflect.get(result, field);
    if (typeof value === "number" || typeof value === "string" || typeof value === "bigint") {
      return BigInt(value);
    }
  }
  throw new Error(`NEAR RPC ${method} returned no usable ${field}`);
};

/**
 * Every key of the account at FINAL finality, read 100 at a time and pinned to the first page's
 * block. Nodes refuse an unpaginated `view_access_key_list` for an account with more than 100
 * keys, and the journal decides from the whole list, so a single call made such an account
 * impossible to transfer. Throws rather than return part of the list.
 */
const readCompleteAccessKeyList = async (
  networkId: TNearNetworkId,
  accountId: string,
): Promise<{ keys: unknown[]; pages: number }> => {
  const keys: unknown[] = [];
  let blockHeight: unknown;
  let afterKey: string | undefined;
  for (let page = 0; page < 1_000; page++) {
    const result = await rpcCall(networkId, "query", {
      request_type: "view_access_key_list",
      account_id: accountId,
      ...(blockHeight == null ? { finality: "final" } : { block_id: blockHeight }),
      limit: 100,
      ...(afterKey != null ? { after_key: afterKey } : {}),
    });
    if (typeof result !== "object" || result == null || !("keys" in result)) break;
    if (!Array.isArray(result.keys)) break;
    blockHeight ??= "block_height" in result ? result.block_height : undefined;
    keys.push(...result.keys);
    const lastKey =
      "last_key" in result && typeof result.last_key === "string" ? result.last_key : undefined;
    if (lastKey == null) return { keys, pages: page + 1 };
    if (result.keys.length === 0 || lastKey === afterKey || blockHeight == null) break;
    afterKey = lastKey;
  }
  throw new Error(`NEAR RPC could not list every access key of ${accountId}`);
};

/** My NEAR Wallet's floor for an AddKey (0.002 NEAR): its storage deposit, with room for gas. */
export const MIN_ADD_KEY_BALANCE_YOCTO = 2_000_000_000_000_000_000_000n;

/**
 * What the account can actually spend, as near-api-js `getAccountBalance().available` (which MNW
 * checks) computes it: the total less whichever is larger of its stake and its storage. Not the
 * plain `amount`, because locked and storage-bound NEAR cannot pay for the AddKey.
 */
const readAvailableBalance = async (
  networkId: TNearNetworkId,
  accountId: string,
): Promise<bigint> => {
  const [account, protocolConfig] = await Promise.all([
    rpcCall(networkId, "query", {
      request_type: "view_account",
      account_id: accountId,
      finality: "final",
    }),
    rpcCall(networkId, "EXPERIMENTAL_protocol_config", { finality: "final" }),
  ]);
  const runtimeConfig: unknown =
    typeof protocolConfig === "object" && protocolConfig != null
      ? Reflect.get(protocolConfig, "runtime_config")
      : undefined;
  const costPerByte = readBigIntField(
    runtimeConfig,
    "storage_amount_per_byte",
    "EXPERIMENTAL_protocol_config",
  );
  const locked = readBigIntField(account, "locked", "view_account");
  const storageStaked = readBigIntField(account, "storage_usage", "view_account") * costPerByte;
  const total = readBigIntField(account, "amount", "view_account") + locked;
  return total - (locked > storageStaked ? locked : storageStaked);
};

const normalizePublicKey = (publicKey: string): string | undefined => {
  try {
    return PublicKey.fromString(publicKey).toString();
  } catch {
    return undefined;
  }
};

/** An access-key list entry's public key and whether it is full access, or nothing if malformed. */
const readKeyEntry = (entry: unknown): { publicKey: string; fullAccess: boolean } | undefined => {
  if (typeof entry !== "object" || entry == null) return undefined;
  const publicKey: unknown = Reflect.get(entry, "public_key");
  const accessKey: unknown = Reflect.get(entry, "access_key");
  if (typeof publicKey !== "string" || typeof accessKey !== "object" || accessKey == null) {
    return undefined;
  }
  const normalized = normalizePublicKey(publicKey);
  if (normalized == null) return undefined;
  return {
    publicKey: normalized,
    fullAccess: Reflect.get(accessKey, "permission") === "FullAccess",
  };
};

export interface ISourceAccountCheck {
  accountId: string;
  networkId: TNearNetworkId;
  /** Every key on the account at final finality, and how many pages reading them took. */
  keyCount: number;
  pages: number;
  sourceKey: "full_access" | "not_full_access" | "absent";
  availableYocto: bigint;
  /** My NEAR Wallet's eligibility, decided before start: the source key is on it with full access. */
  eligible: boolean;
  /** What it checks before the first AddKey is signed: the available balance covers one. */
  canAffordAddKey: boolean;
}

/**
 * The checks My NEAR Wallet makes on an account in a new-key transfer: eligibility before start
 * (`accountExportAccounts`: the source key is on the account with full access, decided from the
 * COMPLETE key list — the read that broke for accounts with more than 100 keys), and the balance
 * before the AddKeys (`assertSelectionCanAffordAddKeys`).
 */
export const checkSourceAccount = async (account: {
  networkId: string;
  accountId: string;
  sourcePublicKey: string;
}): Promise<ISourceAccountCheck> => {
  const networkId: TNearNetworkId = account.networkId === "mainnet" ? "mainnet" : "testnet";
  const [{ keys, pages }, availableYocto] = await Promise.all([
    readCompleteAccessKeyList(networkId, account.accountId),
    readAvailableBalance(networkId, account.accountId),
  ]);
  const source = normalizePublicKey(account.sourcePublicKey);
  const entry = keys.map(readKeyEntry).find((key) => key != null && key.publicKey === source);
  const sourceKey = entry == null ? "absent" : entry.fullAccess ? "full_access" : "not_full_access";
  return {
    accountId: account.accountId,
    networkId,
    keyCount: keys.length,
    pages,
    sourceKey,
    availableYocto,
    eligible: sourceKey === "full_access",
    canAffordAddKey: availableYocto >= MIN_ADD_KEY_BALANCE_YOCTO,
  };
};

/**
 * The accounts that provably cannot pay for their AddKey — MNW checks the whole selection before
 * the first one is signed, so a transfer is never left half on-chain by an empty account. An
 * unreadable balance is not provably short; the per-job check in the chain decides that one.
 */
export const findAccountsShortOfAddKeyBalance = async (
  accounts: ReadonlyArray<{ networkId: string; accountId: string }>,
): Promise<string[]> => {
  const short: string[] = [];
  for (const account of accounts) {
    try {
      const network: TNearNetworkId = account.networkId === "mainnet" ? "mainnet" : "testnet";
      if ((await readAvailableBalance(network, account.accountId)) < MIN_ADD_KEY_BALANCE_YOCTO) {
        short.push(account.accountId);
      }
    } catch {
      // Unknown, not short.
    }
  }
  return short;
};

/**
 * Resolve the source account's full-access signer from the staged secrets.
 *
 * Fails closed on a mismatch: the key derived from a stored secret must equal the
 * `sourcePublicKey` the job names. Signing with any other key would produce a transaction the
 * account cannot authorize, and the failure would surface much later and far less clearly.
 */
const signerFor = (
  job: IAddKeyJournalJob,
  staged: readonly TAccountTransferDataDecrypted[],
): KeyPairSigner => {
  const account = staged.find(
    (candidate) => candidate.accountId === job.accountId && candidate.networkId === job.networkId,
  );
  if (account == null) throw new Error(`No staged secret for ${job.accountId}`);

  for (const secret of account.secret) {
    const derived = deriveNearSigningKeyFromAccountSecret(secret);
    if (derived.ok && derived.publicKey === job.sourcePublicKey) {
      return KeyPairSigner.fromSecretKey(derived.privateKey);
    }
  }
  throw new Error(
    `No staged secret for ${job.accountId} derives its source key ${job.sourcePublicKey}`,
  );
};

const networkOf = (job: IAddKeyJournalJob): TNearNetworkId =>
  job.networkId === "mainnet" ? "mainnet" : "testnet";

/**
 * `checkBalanceBeforeSigning` is My NEAR Wallet's per-job check: it refuses to sign an AddKey the
 * account cannot pay for. Off, the harness signs and broadcasts it anyway, so the journal meets
 * the on-chain failure.
 */
export const createHarnessAddKeyChain = (
  getStaged: () => Promise<readonly TAccountTransferDataDecrypted[]>,
  { checkBalanceBeforeSigning }: { checkBalanceBeforeSigning: boolean },
): IAddKeyJournalChain => ({
  getAccessKeys: async (job) => ({
    keys: (await readCompleteAccessKeyList(networkOf(job), job.accountId)).keys,
  }),

  signAddKeyTransaction: async (job): Promise<IAddKeySignedTransaction> => {
    const network = networkOf(job);
    const signer = signerFor(job, await getStaged());
    // Before signing, not after: signed bytes are journaled as replayable, and there is no reason
    // to create ones that can only ever fail on-chain.
    if (
      checkBalanceBeforeSigning &&
      (await readAvailableBalance(network, job.accountId)) < MIN_ADD_KEY_BALANCE_YOCTO
    ) {
      throw new Error(`${job.accountId} does not have enough available NEAR to add Meteor's key`);
    }
    const [accessKey, block] = await Promise.all([
      rpcCall(network, "query", {
        request_type: "view_access_key",
        finality: "final",
        account_id: job.accountId,
        public_key: job.sourcePublicKey,
      }),
      rpcCall(network, "block", { finality: "final" }),
    ]);

    // Full access, deliberately: the destination wallet must be able to act for this account
    // exactly as the source can — that is what transferring it means.
    const transaction = createTransaction(
      job.accountId,
      await signer.getPublicKey(),
      job.accountId,
      readNonce(accessKey) + 1n,
      [
        actionCreators.addKey(
          PublicKey.fromString(job.destinationPublicKey),
          actionCreators.fullAccessKey(),
        ),
      ],
      base58.decode(readBlockHash(block)),
    );

    const [transactionHashBytes, signed] = await signer.signTransaction(transaction);
    return {
      transactionHash: base58.encode(transactionHashBytes),
      signedTransactionBase64: base64.encode(signed.encode()),
    };
  },

  // FINAL waits, both. The runner proves the AddKey off THIS result, and its verifier requires
  // `final_execution_status === "FINAL"` — so `broadcast_tx_commit` is the wrong call here: it
  // returns once the transaction is EXECUTED_OPTIMISTIC, which the proof reads as not-final and
  // rejects even though the key did land. `send_tx` with an explicit FINAL wait is the one that
  // returns a provable outcome. A throw is read as AMBIGUOUS and reconciled by hash, never retried
  // with fresh bytes.
  broadcastSignedTransaction: (job, signed) =>
    rpcCall(networkOf(job), "send_tx", {
      signed_tx_base64: signed.signedTransactionBase64,
      wait_until: "FINAL",
    }),

  getFinalTransactionStatus: (job, transactionHash) =>
    rpcCall(networkOf(job), "tx", {
      tx_hash: transactionHash,
      sender_account_id: job.accountId,
      wait_until: "FINAL",
    }),
});
