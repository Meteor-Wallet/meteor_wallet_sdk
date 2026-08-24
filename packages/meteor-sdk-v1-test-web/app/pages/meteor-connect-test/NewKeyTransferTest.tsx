import type {
  INewKeyTransferSdkSession,
  INewKeyTransferStartOptions,
  MeteorConnect,
  TAccountTransferDataDecrypted,
  TNewKeyTransferTargetPlatform,
} from "@meteorwallet/sdk";
import { deriveNearPublicKeyFromAccountSecret } from "@meteorwallet/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "~/ui/Button";
import { createHarnessAddKeyChain } from "./nearAddKeyChain";

/**
 * Test harness for the NEW-KEY transfer — the flow where secrets never move.
 *
 * The older `transferAccounts` flow encrypts the staged secrets and hands them to the wallet,
 * which decrypts them with the PIN-derived key. This one does the opposite: the wallet mints a
 * fresh keypair per account and returns only the PUBLIC halves, this side AddKeys them on-chain
 * with the source account's own full-access key, and the wallet then verifies each key is live
 * before importing. The private material for both ends stays where it was born.
 *
 * Three wallet turns, in order, over one held bridge session:
 *
 *   1. start()        → wallet mints destination keys, returns their public halves
 *   2. runAddKeys()   → THIS side signs + broadcasts the AddKeys (no wallet involvement)
 *   3. verifyActive() → wallet confirms each key is live on-chain, then imports
 *
 * Step 2 runs under the SDK's crash-safe AddKey journal, through the `IAddKeyJournalChain` seam
 * implemented in `nearAddKeyChain.ts`. Because a broadcast AddKey cannot be un-broadcast, the
 * journal — not this component — owns what happens after a crash; `getRecoveryState()` below is
 * the window onto it.
 */

const PLATFORM_LABELS: Record<TNewKeyTransferTargetPlatform, string> = {
  web_local_dev: "Meteor Web (Local Dev)",
  web: "Meteor Web",
  mobile: "Meteor Mobile",
};

/** Staged accounts are secrets; the protocol's start input wants public keys. Bridge the two. */
const toStartAccounts = (
  staged: readonly TAccountTransferDataDecrypted[],
): { accounts: INewKeyTransferStartOptions["accounts"]; skipped: string[] } => {
  const accounts: INewKeyTransferStartOptions["accounts"] = [];
  const skipped: string[] = [];
  for (const account of staged) {
    // The first secret that yields a public key is the one this account will sign its AddKey
    // with; `nearAddKeyChain` re-derives from the same set and matches on this exact key.
    const derived = account.secret
      .map((secret) => deriveNearPublicKeyFromAccountSecret(secret))
      .find((result) => result.ok);
    if (derived == null || !derived.ok) {
      skipped.push(account.accountId);
      continue;
    }
    accounts.push({
      blockchainId: account.blockchainId,
      networkId: account.networkId,
      accountId: account.accountId,
      sourcePublicKey: derived.publicKey,
    });
  }
  return { accounts, skipped };
};

const errorText = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const NewKeyTransferTest = ({ meteorConnect }: { meteorConnect: MeteorConnect }) => {
  const queryClient = useQueryClient();
  const [platform, setPlatform] = useState<TNewKeyTransferTargetPlatform>("web_local_dev");
  const [log, setLog] = useState<string[]>([]);
  const [flowError, setFlowError] = useState<string>();

  const append = (line: string) => setLog((lines) => [...lines, line]);

  const sessionsQuery = useQuery({
    queryKey: ["new-key-transfer", "sessions"],
    queryFn: () => meteorConnect.newKeyTransfer.getSessions(),
  });
  const recoveryQuery = useQuery({
    queryKey: ["new-key-transfer", "recovery"],
    queryFn: () => meteorConnect.newKeyTransfer.getRecoveryState(),
  });
  const stagedQuery = useQuery({
    queryKey: ["transfer-accounts", "staged"],
    queryFn: () => meteorConnect.transferAccounts.getStagedSummaries(),
  });

  const sessions = sessionsQuery.data ?? [];
  const staged = stagedQuery.data ?? [];
  const recovery = recoveryQuery.data;
  // One transfer at a time in the harness: the newest session is the one the buttons act on.
  const active = sessions.at(-1);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["new-key-transfer"] });
    await queryClient.invalidateQueries({ queryKey: ["transfer-accounts", "staged"] });
  };

  // Read the secrets fresh on every chain call rather than closing over a snapshot — the journal
  // may drive this seam long after the click that started it.
  const chain = createHarnessAddKeyChain(() =>
    meteorConnect.transferAccounts.getStagedWithSecrets(),
  );

  /**
   * Every step ends by refreshing, and surfaces its own failure rather than throwing into the
   * query client — a failed AddKey still changed durable journal state worth re-reading.
   */
  const guarded =
    <TArgs,>(step: (args: TArgs) => Promise<void>) =>
    async (args: TArgs): Promise<void> => {
      setFlowError(undefined);
      try {
        await step(args);
      } catch (error) {
        setFlowError(errorText(error));
        append(`✗ ${errorText(error)}`);
      }
      await refresh();
    };

  const startMutation = useMutation({
    mutationFn: guarded<void>(async () => {
      const stagedWithSecrets = await meteorConnect.transferAccounts.getStagedWithSecrets();
      const { accounts, skipped } = toStartAccounts(stagedWithSecrets);
      if (accounts.length === 0) throw new Error("No staged account yields a NEAR public key");
      for (const accountId of skipped) append(`… skipped ${accountId} (no derivable public key)`);

      /*
       * The AddKey journal holds exactly ONE start result, and only `clear()` on that exact
       * transfer removes it. A start result is written whenever the wallet ANSWERS — including
       * when it accepts nothing — so a refused transfer left behind poisons the journal and every
       * later start dies on `start_result_conflict`. Clearing the active transfer does not help:
       * `clear()` only discards a start result belonging to the transfer being cleared.
       *
       * So sweep the leftover first. Only transfers with no journaled AddKey intent can be
       * cleared, which is exactly the set that is safe to drop: nothing of theirs reached a chain.
       */
      const leftover = (await meteorConnect.newKeyTransfer.getRecoveryState()).startResult;
      if (leftover != null) {
        const stale = (await meteorConnect.newKeyTransfer.getSessions()).find(
          (candidate) =>
            candidate.startOutput?.transferSessionId === leftover.output.transferSessionId,
        );
        if (stale != null) {
          try {
            await meteorConnect.newKeyTransfer.clear(stale.clientTransferId);
            append(`… discarded a leftover transfer (${stale.clientTransferId})`);
          } catch (clearError) {
            // Not clearable means it holds real recovery state — say so rather than failing later
            // with the journal's own, much more cryptic, conflict message.
            throw new Error(
              `A previous transfer (${stale.clientTransferId}) still needs resolving before a new one can start: ${
                clearError instanceof Error ? clearError.message : String(clearError)
              }`,
            );
          }
        }
      }

      append(`1/3 start → ${PLATFORM_LABELS[platform]} with ${accounts.length} account(s)`);
      const result = await meteorConnect.newKeyTransfer.start({
        accounts,
        targetPlatform: platform,
      });
      for (const account of result.output.accounts) {
        append(
          account.ok
            ? `    ✓ ${account.accountId} → ${account.destinationPublicKey}`
            : `    ✗ ${account.accountId} refused (${account.issue})`,
        );
      }
      const acceptedCount = result.output.accounts.filter((account) => account.ok).length;
      if (acceptedCount === 0) {
        // Saying "held for AddKeys" here would be doubly wrong: there are no AddKeys to run, and
        // the next two steps cannot do anything but fail. The transfer is over — say so.
        append(`    session ${result.output.transferSessionId} — nothing accepted, transfer over`);
        // Drop it now rather than leaving it to block the next attempt. There is nothing to
        // recover — no account was accepted, so no key was created and no chain call is possible.
        try {
          await meteorConnect.newKeyTransfer.clear(result.output.clientTransferId);
          append("    discarded it — fix the reason in the wallet, then start again");
        } catch (clearError) {
          append(`    could not discard it: ${String(clearError)}`);
        }
        return;
      }
      append(
        result.externalWorkHeld
          ? `    session ${result.output.transferSessionId} — bridge held open for AddKeys`
          : `    session ${result.output.transferSessionId} — NO hold; step 3 will re-pair`,
      );
    }),
  });

  const addKeysMutation = useMutation({
    mutationFn: guarded(async (transferSessionId: string) => {
      append("2/3 runAddKeys → signing and broadcasting on-chain (no wallet involvement)");
      const result = await meteorConnect.newKeyTransfer.runAddKeys({
        transferSessionId,
        chain,
        // `index` is already 1-based — it is the job's position, not an array index.
        onProgress: ({ accountId, index, total }) => append(`    [${index}/${total}] ${accountId}`),
      });
      for (const activation of result.verifyInput.activations) {
        append(`    ✓ ${activation.accountId} → tx ${activation.addKeyTransactionHash}`);
      }
    }),
  });

  const verifyMutation = useMutation({
    mutationFn: guarded(async (transferSessionId: string) => {
      const pending = (await meteorConnect.newKeyTransfer.getRecoveryState()).pendingVerification;
      if (pending == null || pending.transferSessionId !== transferSessionId) {
        // The journal holds the exact proof the wallet must be asked with; a regenerated one is
        // refused, so there is nothing useful to send without it.
        throw new Error("No journaled verification proof for this transfer — run AddKeys first");
      }
      append("3/3 verifyActive → wallet confirms each key is live, then imports");
      const result = await meteorConnect.newKeyTransfer.verifyActive({
        transferSessionId,
        activations: pending.activations,
      });
      for (const account of result.output.accounts) {
        append(
          account.activation === "verified"
            ? `    ✓ ${account.accountId} verified and imported`
            : `    ✗ ${account.accountId} not verified (${account.issue})`,
        );
      }
    }),
  });

  const clearMutation = useMutation({
    mutationFn: guarded(async (clientTransferId: string) => {
      await meteorConnect.newKeyTransfer.clear(clientTransferId);
      append(`cleared ${clientTransferId}`);
    }),
  });

  const busy =
    startMutation.isPending ||
    addKeysMutation.isPending ||
    verifyMutation.isPending ||
    clearMutation.isPending;
  const transferSessionId = active?.startOutput?.transferSessionId;

  /**
   * AddKeys is finished exactly when its verification proof is journaled — `commitVerificationIntent`
   * writes that proof and DISCARDS the start result in the same step.
   *
   * This, not the session phase, is the gate for step 2. The phase here is still
   * `add_key_in_progress` (it only becomes `verification_pending` inside `verifyActive`), so gating
   * on it left the button live after a successful run. A second press then met a transfer whose
   * start result is deliberately gone and failed `new_key_transfer_start_result_journal_missing` —
   * the SDK fencing a duplicate AddKey submission, which is the right answer to a question the UI
   * should never have let the user ask.
   */
  const addKeysDone =
    transferSessionId != null &&
    recovery?.pendingVerification?.transferSessionId === transferSessionId;
  const verified = active?.phase === "destination_keys_verified";
  /**
   * How many accounts the wallet actually accepted. Zero is a finished, failed transfer — the SDK
   * refuses `runAddKeys` with `new_key_transfer_no_accounts_ready` — so steps 2 and 3 must be shut
   * rather than left live to produce that error and then the far more confusing "No journaled
   * verification proof" from step 3.
   */
  const acceptedCount = active?.startOutput?.accounts.filter((account) => account.ok).length ?? 0;
  const nothingAccepted = active != null && active.startOutput != null && acceptedCount === 0;
  /**
   * The wallet has minted and stored destination keys, but nothing is on-chain yet — so the SDK's
   * `clear()` guard (which only fences a journaled AddKey intent) still allows clearing. Clearing
   * here is legal and silent on THIS side, and leaves the WALLET holding a signer for a transfer
   * this side has forgotten; that stranded record is what later refuses the account with
   * `pending_transfer_conflict`. It is recoverable in the wallet, but it should be a choice.
   */
  const clearWouldStrandWallet = acceptedCount > 0 && active?.phase === "destination_keys_staged";
  /**
   * A finished transfer is NOT clearable, and must not be: once an AddKey intent is journaled the
   * destination keys may be live on-chain, so `clear()` fences behind `markDestinationKeysRevoked`
   * and otherwise throws `new_key_transfer_recovery_required`.
   *
   * So "clear it, then start the next one" is not a flow that exists. The next transfer simply
   * starts alongside — the SDK keeps a list of sessions, not one slot. Gating step 1 on
   * `active != null` made this harness a one-shot: after the first success nothing could be
   * cleared and nothing new could begin.
   */
  const clearRefused = (active?.addKeyIntentAccounts.length ?? 0) > 0;
  const activeIsFinished = active == null || verified || nothingAccepted;

  return (
    <div className={"mt-6 p-4 border-2 border-emerald-800 rounded-xl flex flex-col gap-3"}>
      <h2 className={"text-lg font-bold"}>New-Key Transfer to Meteor Wallet</h2>
      <p className={"text-sm text-gray-500"}>
        The secret-free transfer: the wallet mints fresh keys, this side AddKeys them on-chain with
        each account&apos;s own full-access key, and the wallet verifies them live before importing.
        Uses the same staged accounts as the transfer above ({staged.length} staged) — but sends
        only their <b>public</b> keys.
      </p>

      <div className={"flex flex-row flex-wrap gap-3 items-center"}>
        <span className={"text-sm font-medium"}>Target:</span>
        {(Object.keys(PLATFORM_LABELS) as TNewKeyTransferTargetPlatform[]).map((option) => (
          <label key={option} className={"text-sm flex flex-row gap-1 items-center"}>
            <input
              type={"radio"}
              name={"new-key-target-platform"}
              checked={platform === option}
              disabled={!activeIsFinished}
              onChange={() => setPlatform(option)}
            />
            {PLATFORM_LABELS[option]}
          </label>
        ))}
        {!activeIsFinished && (
          // The old copy said "clear it to change", which is wrong for a transfer past AddKey:
          // clear() fences on a journaled intent and would just throw
          // (REVIEW-consumer-implementation M-04).
          <span className={"text-xs text-gray-500"}>
            fixed until this transfer finishes — the next transfer can target anything
          </span>
        )}
      </div>

      {clearRefused && (
        <p className={"text-xs text-gray-500"}>
          This transfer can no longer be cleared: its AddKey intent is journaled, so the destination
          keys may be live on-chain and the record stays as a recovery fence. That is intended —
          start the next transfer alongside it rather than clearing this one.
        </p>
      )}

      {clearWouldStrandWallet && (
        <p className={"text-sm text-amber-700"}>
          The wallet has already created destination keys for this transfer. Clearing now is allowed
          here — nothing is on-chain yet — but the wallet keeps its half, and will refuse the next
          transfer of these accounts with <code>pending_transfer_conflict</code> until that record
          is resolved under <b>Pending new-key transfers</b>. Prefer finishing steps 2 and 3.
        </p>
      )}

      {nothingAccepted && (
        <p className={"text-sm text-amber-700"}>
          The wallet accepted none of these accounts, so there is nothing to AddKey — steps 2 and 3
          are closed. Fix the reason the wallet gave (most often the account still has an unfinished
          transfer there), then <b>Clear transfer</b> and start again.
        </p>
      )}

      {recovery?.orphanedSignedAddKey === true && (
        <p className={"text-sm text-red-700"}>
          ⚠ An orphaned signed AddKey is journaled with no start result to bind it. Its bytes may
          still land on-chain, so nothing new can start until it is reconciled.
        </p>
      )}

      <div className={"flex flex-row flex-wrap gap-3 items-center"}>
        <Button
          disabled={busy || staged.length === 0 || !activeIsFinished}
          onClick={() => startMutation.mutate(undefined)}
        >
          {active == null || activeIsFinished ? "1. Start (mint destination keys)" : "1. Started ✓"}
        </Button>
        <Button
          // `verified` matters as well as `addKeysDone`: verification CONSUMES the pending proof,
          // so once step 3 succeeds `addKeysDone` goes false again and this would re-open on a
          // finished transfer — straight into `start_result_journal_missing`.
          disabled={busy || transferSessionId == null || addKeysDone || verified || nothingAccepted}
          onClick={() => transferSessionId != null && addKeysMutation.mutate(transferSessionId)}
        >
          {addKeysDone || verified ? "2. AddKeys done ✓" : "2. Run AddKeys (on-chain)"}
        </Button>
        <Button
          disabled={busy || !addKeysDone || verified || nothingAccepted}
          onClick={() => transferSessionId != null && verifyMutation.mutate(transferSessionId)}
        >
          {verified ? "3. Verified ✓" : "3. Verify Active (import)"}
        </Button>
        <Button
          disabled={busy || active == null || clearRefused}
          onClick={() => {
            if (active == null) return;
            // A destructive simulation on a PUBLICLY HOSTED lab. Clearing here is legal on this
            // side and leaves the wallet holding a signer for a transfer we have forgotten — the
            // stranded record that later refuses the account with `pending_transfer_conflict`.
            // It is a legitimate thing to exercise, and it must be a deliberate one
            // (REVIEW-consumer-implementation M-04).
            if (
              clearWouldStrandWallet &&
              !window.confirm(
                "This is a destructive simulation.\n\n" +
                  "Meteor Wallet has already created and stored destination keys for this " +
                  "transfer. Clearing it here leaves the wallet holding a signer for a transfer " +
                  "this side has forgotten, and that account will be refused with " +
                  "`pending_transfer_conflict` until the record is resolved in the wallet.\n\n" +
                  "Strand the wallet?",
              )
            ) {
              return;
            }
            clearMutation.mutate(active.clientTransferId);
          }}
        >
          {clearWouldStrandWallet ? "⚠ Clear transfer (strands the wallet)" : "Clear transfer"}
        </Button>
      </div>

      {sessions.length > 0 && (
        <div className={"flex flex-col gap-1"}>
          <h3 className={"font-bold text-sm"}>Transfers ({sessions.length})</h3>
          {sessions.map((session: INewKeyTransferSdkSession) => (
            <div key={session.clientTransferId} className={"text-sm flex flex-row gap-3"}>
              <span className={"font-mono text-xs"}>{session.clientTransferId}</span>
              <span className={"font-medium"}>{session.phase}</span>
              <span className={"text-gray-500"}>
                {PLATFORM_LABELS[session.targetPlatform]} · {session.startRequest.accounts.length}{" "}
                account(s) · {session.verifiedAccounts.length} verified
              </span>
            </div>
          ))}
        </div>
      )}

      {log.length > 0 && (
        <pre
          className={
            "text-xs font-mono whitespace-pre-wrap rounded bg-slate-100 p-3 dark:bg-slate-800 max-h-72 overflow-auto"
          }
        >
          {log.join("\n")}
        </pre>
      )}
      {flowError != null && <p className={"text-sm text-red-700"}>Error: {flowError}</p>}
      {log.length > 0 && (
        <button
          className={"text-xs underline cursor-pointer self-start"}
          onClick={() => setLog([])}
        >
          clear log
        </button>
      )}
    </div>
  );
};
