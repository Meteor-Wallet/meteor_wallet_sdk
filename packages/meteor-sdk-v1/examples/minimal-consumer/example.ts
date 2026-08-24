/**
 * Minimal consumer example — the recommended new-key transfer, end to end.
 *
 * Read this top to bottom; it is ordered the way the flow runs. Every step notes the invariant it
 * depends on, because the invariants are the part that is easy to break silently.
 *
 * NOT a runnable app: it has no framework, no styling and no build. That is deliberate — a second
 * app to maintain would drift, and the point here is the shape of the calls.
 */

import {
  type IAddKeyJournalChain,
  type IAddKeyJournalJob,
  type INewKeyTransferFencedOperation,
  MeteorConnect,
  METEOR_CONNECT_BACKENDS,
  webpage_local_storage,
} from "@meteorwallet/sdk";

/* ── 1. One client, initialized once ──────────────────────────────────────────────────────── */

const meteorConnect = new MeteorConnect();

/**
 * Initialization can fail transiently — storage pressure, a lock this tab could not take. It is
 * retryable ON THE SAME INSTANCE: call `initialize()` again with the same configuration. Do not
 * reload the page to recover, and do not construct a second `MeteorConnect`.
 */
export async function initialize(): Promise<void> {
  await meteorConnect.initialize({
    storage: webpage_local_storage,
    mobileBridge: {
      enabled: true,
      backendUrl: METEOR_CONNECT_BACKENDS.production,
      partnerMetadata: {
        name: "Example Wallet",
        originUrl: window.location.origin,
      },
      transferAccounts: { enabled: true },
    },
  });
}

/* ── 2. The chain seam ────────────────────────────────────────────────────────────────────── */

/**
 * The ONE thing a host must implement, because it is the only place the source account's
 * full-access signing key is touched. That key never reaches the SDK: every method here receives
 * only the job's public identity.
 *
 * Each method has a guarantee the journal depends on:
 *
 * - `getAccessKeys` must read at FINAL finality. An optimistic read can report a key that is not
 *   there yet.
 * - `signAddKeyTransaction` must NOT broadcast. The SDK records the exact signed bytes first; a
 *   method that broadcasts creates an effect the journal has not checkpointed.
 * - `broadcastSignedTransaction` must send those EXACT bytes and wait for FINAL. A throw is treated
 *   as ambiguous and reconciled by hash — never as a signal to build a replacement transaction.
 * - `isSignedTransactionExpired` is optional but worth implementing: without it, a fenced transfer
 *   can only be resolved by revoking the destination key, never by observing that the signed bytes
 *   are dead.
 */
function createChain(): IAddKeyJournalChain {
  return {
    getAccessKeys: async (job: IAddKeyJournalJob) =>
      await rpc("query", {
        request_type: "view_access_key_list",
        account_id: job.accountId,
        finality: "final",
      }),

    signAddKeyTransaction: async (job: IAddKeyJournalJob) => {
      // Resolve the signer for job.sourcePublicKey EXACTLY. Signing with any other key of the
      // account authorizes a destination key the transfer cannot later prove.
      const signer = await resolveExactSourceSigner(job.accountId, job.sourcePublicKey);
      return await signer.signAddKey(job.destinationPublicKey);
    },

    broadcastSignedTransaction: async (_job, signed) =>
      await rpc("send_tx", {
        signed_tx_base64: signed.signedTransactionBase64,
        wait_until: "FINAL",
      }),

    getFinalTransactionStatus: async (job, transactionHash) =>
      await rpc("tx", {
        tx_hash: transactionHash,
        sender_account_id: job.accountId,
        wait_until: "FINAL",
      }),

    isSignedTransactionExpired: async (_job, signed) => {
      try {
        await rpc("send_tx", {
          signed_tx_base64: signed.signedTransactionBase64,
          wait_until: "EXECUTED_OPTIMISTIC",
        });
        return false;
      } catch (error) {
        // NEAR reports a transaction whose block hash has fallen outside the validity window as
        // `Expired`. Anything else — including a network failure — is "not known to be dead".
        return /\bExpired\b/.test(String(error));
      }
    },
  };
}

/* ── 3. The happy path ────────────────────────────────────────────────────────────────────── */

export interface IExportableAccount {
  accountId: string;
  /** The exact full-access key this wallet holds for the account. */
  sourcePublicKey: string;
}

export async function transferAccounts(accounts: readonly IExportableAccount[]): Promise<void> {
  const { session } = await meteorConnect.newKeyTransfer.start({
    targetPlatform: "web",
    accounts: accounts.map((account) => ({
      blockchainId: "near",
      networkId: "mainnet",
      accountId: account.accountId,
      sourcePublicKey: account.sourcePublicKey,
    })),
  });

  const transferSessionId = session.startOutput?.transferSessionId;
  if (transferSessionId == null) throw new Error("the wallet answered without a transfer session");

  // The wallet may refuse individual accounts. Show the reasons; they are the only thing the user
  // can act on. `accounts[].ok === false` carries a typed `issue`.
  const refused = (session.startOutput?.accounts ?? []).filter((account) => !account.ok);
  if (refused.length > 0) reportRefusedAccounts(refused);

  // The on-chain step. Progress is 1-based across the accounts still to submit.
  const { verifyInput } = await meteorConnect.newKeyTransfer.runAddKeys({
    transferSessionId,
    chain: createChain(),
    onProgress: ({ accountId, index, total }) => showProgress(accountId, index, total),
  });

  // The wallet proves each key is live on-chain, then imports. The proof is the one the journal
  // recorded — never a regenerated one.
  await meteorConnect.newKeyTransfer.verifyActive({
    transferSessionId,
    activations: verifyInput.activations,
  });
}

/* ── 4. Resuming after a reload ───────────────────────────────────────────────────────────── */

/**
 * Call this on load, before offering to start anything. This flow spans on-chain work a user can
 * and will reload in the middle of, and the durable journal — not your router state — knows where
 * they were.
 */
export async function resumeOrReconcile(): Promise<void> {
  const recovery = await meteorConnect.newKeyTransfer.getRecoveryState();

  if (recovery.reconciliation.fenced) {
    // Nothing new can start until this is resolved. Do NOT offer "start again": the fence
    // guarantees it will be refused.
    await showReconciliationScreen(recovery.reconciliation.operations, {
      supportReference: recovery.reconciliation.supportReference,
    });
    return;
  }

  if (recovery.pendingVerification != null) {
    // AddKeys finished before the reload; only the wallet's confirmation is outstanding.
    await meteorConnect.newKeyTransfer.verifyActive({
      transferSessionId: recovery.pendingVerification.transferSessionId,
      activations: recovery.pendingVerification.activations,
    });
    return;
  }

  if (recovery.startResult != null) {
    // The wallet minted destination keys; the AddKeys never ran. Resume them.
    await meteorConnect.newKeyTransfer.runAddKeys({
      transferSessionId: recovery.startResult.output.transferSessionId,
      chain: createChain(),
    });
  }
}

/* ── 5. Reconciling a fenced transfer ─────────────────────────────────────────────────────── */

/**
 * One pass per operation. Nothing here signs or broadcasts a new transaction — the worst it can do
 * is promote a proven AddKey to finalized.
 */
export async function reconcile(operation: INewKeyTransferFencedOperation): Promise<void> {
  const chain = createChain();
  const result = await meteorConnect.newKeyTransfer.reconcileFencedOperation({ operation, chain });

  switch (result.status) {
    case "finalized":
      // It did land. Back to the normal flow.
      return await resumeOrReconcile();

    case "destination_key_present_unproven":
      // The key is on the account but nothing binds it to this transfer. Remove it with the
      // account's own SOURCE key, wait for finality, then archive.
      await removeKeyWithSourceSigner(operation);
      await meteorConnect.newKeyTransfer.archiveReconciledOperation({ operation, chain });
      return;

    case "destination_key_absent":
      // The bytes can never land and the key is not there. Safe to retire the record.
      await meteorConnect.newKeyTransfer.archiveReconciledOperation({ operation, chain });
      return;

    case "ambiguous":
      // Nothing was established and nothing changed. Say so and let the user try later; do not
      // guess, and do not offer a reset.
      return showTryAgainLater(result.detail);

    case "not_found":
      return;
  }
}

/* ── Host-supplied pieces, stubbed here ───────────────────────────────────────────────────── */

declare function rpc(method: string, params: unknown): Promise<unknown>;
declare function resolveExactSourceSigner(
  accountId: string,
  sourcePublicKey: string,
): Promise<{ signAddKey(destinationPublicKey: string): Promise<{ transactionHash: string; signedTransactionBase64: string }> }>;
declare function removeKeyWithSourceSigner(
  operation: INewKeyTransferFencedOperation,
): Promise<void>;
declare function reportRefusedAccounts(refused: unknown[]): void;
declare function showProgress(accountId: string, index: number, total: number): void;
declare function showReconciliationScreen(
  operations: readonly INewKeyTransferFencedOperation[],
  meta: { supportReference: string | null },
): Promise<void>;
declare function showTryAgainLater(detail: string | undefined): void;
