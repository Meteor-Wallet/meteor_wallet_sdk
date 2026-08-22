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
 * Harness-grade on purpose: it signs with the staged testnet secret and talks to the public NEAR
 * RPC. A production host would resolve the signing key from its own keystore, but the seam is the
 * same shape.
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

export const createHarnessAddKeyChain = (
  getStaged: () => Promise<readonly TAccountTransferDataDecrypted[]>,
): IAddKeyJournalChain => ({
  getAccessKeys: (job) =>
    rpcCall(networkOf(job), "query", {
      request_type: "view_access_key_list",
      finality: "final",
      account_id: job.accountId,
    }),

  signAddKeyTransaction: async (job): Promise<IAddKeySignedTransaction> => {
    const network = networkOf(job);
    const signer = signerFor(job, await getStaged());
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
