import type {
  INewKeyTransferAddKeyResult,
  INewKeyTransferSdkSession,
  INewKeyTransferStartOptions,
  INewKeyTransferStartResult,
  INewKeyTransferVerifyResult,
  MeteorConnect,
  TAccountTransferDataDecrypted,
  TNewKeyTransferTargetPlatform,
} from "@meteorwallet/sdk";
import { deriveNearPublicKeyFromAccountSecret } from "@meteorwallet/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { createHarnessAddKeyChain } from "./nearAddKeyChain";
import {
  explorerTxUrl,
  type IActionResultField,
  type IActionResultSummary,
  type TNearNetwork,
} from "./results/resultsModel";
import { useActionResults } from "./results/ActionResultsUi";
import { ActionButton, Chip, Notice, SubPanel } from "./ui";

/**
 * Test harness for the NEW-KEY transfer — the flow where secrets never move, and the only
 * transfer method this harness exercises.
 *
 * The older `transferAccounts.prompt()` flow encrypted the staged secrets and handed them to the
 * wallet, which decrypted them with the PIN-derived key. This one does the opposite: the wallet
 * mints a fresh keypair per account and returns only the PUBLIC halves, this side AddKeys them
 * on-chain with the source account's own full-access key, and the wallet then verifies each key
 * is live before importing. The private material for both ends stays where it was born.
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
  extension: "Meteor Extension",
};

/** Absent until the popup's chooser has been answered (the start turn records the choice). */
const platformLabel = (platform: TNewKeyTransferTargetPlatform | undefined): string =>
  platform == null ? "platform chosen in popup" : PLATFORM_LABELS[platform];

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

const networkOf = (session: INewKeyTransferSdkSession, accountId: string): TNearNetwork =>
  session.startRequest.accounts.find((account) => account.accountId === accountId)?.networkId ===
  "mainnet"
    ? "mainnet"
    : "testnet";

//
// Step summaries for the shared Results log — what a phone tester needs to see per wallet turn.
//

const summarizeStart = ({
  output,
  session,
  externalWorkHeld,
}: INewKeyTransferStartResult): IActionResultSummary => {
  const accepted = output.accounts.filter((account) => account.ok);
  const fields: IActionResultField[] = [
    { label: "Platform", value: platformLabel(session.targetPlatform), copyable: false },
    { label: "Transfer session", value: output.transferSessionId },
  ];
  for (const account of output.accounts) {
    fields.push(
      account.ok
        ? { label: account.accountId, value: account.destinationPublicKey, tone: "good" }
        : { label: account.accountId, value: `refused: ${account.issue}`, tone: "bad" },
    );
  }
  if (accepted.length === 0) {
    return {
      status: "failed",
      headline: `The wallet accepted none of ${output.accounts.length} account(s) — transfer discarded`,
      fields,
    };
  }
  fields.push({
    label: "Bridge hold",
    value: externalWorkHeld ? "held open for AddKeys" : "NOT held — step 3 will re-pair",
    tone: externalWorkHeld ? undefined : "warn",
    copyable: false,
  });
  return {
    status: accepted.length < output.accounts.length ? "warning" : "success",
    headline: `${accepted.length} of ${output.accounts.length} account(s) accepted · destination keys minted`,
    fields,
  };
};

const summarizeAddKeys = ({
  verifyInput,
  session,
}: INewKeyTransferAddKeyResult): IActionResultSummary => ({
  headline: `${verifyInput.activations.length} AddKey transaction(s) on-chain — ready to verify`,
  fields: verifyInput.activations.map((activation) => ({
    label: activation.accountId,
    value: activation.addKeyTransactionHash,
    href: explorerTxUrl(networkOf(session, activation.accountId), activation.addKeyTransactionHash),
    tone: "good" as const,
  })),
});

const summarizeVerify = ({ output }: INewKeyTransferVerifyResult): IActionResultSummary => {
  // The stabilized contract (SD4/SD6): `secured` is the only done state.
  const secured = output.accounts.filter((account) => account.activation === "secured").length;
  const finishing = output.accounts.filter(
    (account) => account.activation === "verified_pending_completion",
  ).length;
  const notVerified = output.accounts.length - secured - finishing;
  return {
    status: notVerified > 0 ? "failed" : finishing > 0 ? "warning" : "success",
    headline:
      notVerified > 0
        ? `${notVerified} of ${output.accounts.length} account(s) not verified`
        : finishing > 0
          ? `${secured} secured, ${finishing} still finishing in the wallet — re-verify later`
          : `All ${secured} account(s) secured and imported`,
    fields: output.accounts.map((account) =>
      account.activation === "secured"
        ? { label: account.accountId, value: "secured and imported", tone: "good", copyable: false }
        : account.activation === "verified_pending_completion"
          ? {
              label: account.accountId,
              value: `verified on-chain, wallet still finishing (${account.pendingFact})`,
              tone: "warn",
              copyable: false,
            }
          : { label: account.accountId, value: `not verified (${account.issue})`, tone: "bad" },
    ),
  };
};

export const NewKeyTransferTest = ({ meteorConnect }: { meteorConnect: MeteorConnect }) => {
  const queryClient = useQueryClient();
  const { run } = useActionResults();
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
   * query client — a failed AddKey still changed durable journal state worth re-reading. Each step
   * also lands in the shared Results log (`run` never throws), so its outcome is visible on a phone.
   */
  const guarded =
    <TArgs, TOutput>(step: {
      key: string;
      label: string;
      execute: (args: TArgs) => Promise<TOutput>;
      summarize: (output: TOutput) => IActionResultSummary;
    }) =>
    async (args: TArgs): Promise<void> => {
      setFlowError(undefined);
      const outcome = await run({
        key: step.key,
        label: step.label,
        execute: () => step.execute(args),
        summarize: step.summarize,
      });
      if (!outcome.ok) {
        setFlowError(errorText(outcome.error));
        append(`✗ ${errorText(outcome.error)}`);
      }
      await refresh();
    };

  const startMutation = useMutation({
    mutationFn: guarded<void, INewKeyTransferStartResult>({
      key: "new_key_transfer:start",
      label: "New-key transfer · 1. Start",
      summarize: summarizeStart,
      execute: async () => {
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

        // No targetPlatform: the popup asks (Meteor Web / Meteor Mobile), exactly like the regular
        // action popup for a not-signed-in user. The verify turn reuses whatever gets chosen.
        append(`1/3 start → ${accounts.length} account(s) — choose the platform in the popup`);
        const result = await meteorConnect.newKeyTransfer.start({ accounts });
        append(`    platform: ${platformLabel(result.session.targetPlatform)}`);
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
          append(
            `    session ${result.output.transferSessionId} — nothing accepted, transfer over`,
          );
          // Drop it now rather than leaving it to block the next attempt. There is nothing to
          // recover — no account was accepted, so no key was created and no chain call is possible.
          try {
            await meteorConnect.newKeyTransfer.clear(result.output.clientTransferId);
            append("    discarded it — fix the reason in the wallet, then start again");
          } catch (clearError) {
            append(`    could not discard it: ${String(clearError)}`);
          }
          return result;
        }
        append(
          result.externalWorkHeld
            ? `    session ${result.output.transferSessionId} — bridge held open for AddKeys`
            : `    session ${result.output.transferSessionId} — NO hold; step 3 will re-pair`,
        );
        return result;
      },
    }),
  });

  const addKeysMutation = useMutation({
    mutationFn: guarded({
      key: "new_key_transfer:add_keys",
      label: "New-key transfer · 2. AddKeys",
      summarize: summarizeAddKeys,
      execute: async (transferSessionId: string) => {
        append("2/3 runAddKeys → signing and broadcasting on-chain (no wallet involvement)");
        const result = await meteorConnect.newKeyTransfer.runAddKeys({
          transferSessionId,
          chain,
          // `index` is already 1-based — it is the job's position, not an array index.
          onProgress: ({ accountId, index, total }) =>
            append(`    [${index}/${total}] ${accountId}`),
        });
        for (const activation of result.verifyInput.activations) {
          append(`    ✓ ${activation.accountId} → tx ${activation.addKeyTransactionHash}`);
        }
        return result;
      },
    }),
  });

  const verifyMutation = useMutation({
    mutationFn: guarded({
      key: "new_key_transfer:verify",
      label: "New-key transfer · 3. Verify",
      summarize: summarizeVerify,
      execute: async (transferSessionId: string) => {
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
          // The stabilized contract (SD4/SD6): `secured` is the only done state; a chain-proven key
          // the wallet still owes completion work on is `verified_pending_completion` — re-verify
          // later to converge.
          append(
            account.activation === "secured"
              ? `    ✓ ${account.accountId} secured and imported`
              : account.activation === "verified_pending_completion"
                ? `    … ${account.accountId} verified on-chain, wallet still finishing (${account.pendingFact})`
                : `    ✗ ${account.accountId} not verified (${account.issue})`,
          );
        }
        return result;
      },
    }),
  });

  const clearMutation = useMutation({
    mutationFn: guarded({
      key: "new_key_transfer:clear",
      label: "New-key transfer · Clear",
      summarize: (clientTransferId: string) => ({ headline: `Cleared ${clientTransferId}` }),
      execute: async (clientTransferId: string) => {
        await meteorConnect.newKeyTransfer.clear(clientTransferId);
        append(`cleared ${clientTransferId}`);
        return clientTransferId;
      },
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
    <SubPanel
      title={"New-key transfer to Meteor Wallet"}
      description={
        <>
          The secret-free transfer: the wallet mints fresh keys, this side AddKeys them on-chain
          with each account&apos;s own full-access key, and the wallet verifies them live before
          importing. Uses the {staged.length} staged account(s) above — but sends only their{" "}
          <b>public</b> keys. The platform (Meteor Web / Mobile) is chosen in the popup on step 1;
          step 3 reuses it.
        </>
      }
    >
      {clearRefused && (
        <p className={"text-xs text-slate-500 dark:text-slate-400"}>
          This transfer can no longer be cleared: its AddKey intent is journaled, so the destination
          keys may be live on-chain and the record stays as a recovery fence. That is intended —
          start the next transfer alongside it rather than clearing this one.
        </p>
      )}

      {clearWouldStrandWallet && (
        <Notice tone={"warn"}>
          The wallet has already created destination keys for this transfer. Clearing now is allowed
          here — nothing is on-chain yet — but the wallet keeps its half, and will refuse the next
          transfer of these accounts with <code>pending_transfer_conflict</code> until that record
          is resolved under <b>Pending new-key transfers</b>. Prefer finishing steps 2 and 3.
        </Notice>
      )}

      {nothingAccepted && (
        <Notice tone={"warn"}>
          The wallet accepted none of these accounts, so there is nothing to AddKey — steps 2 and 3
          are closed. Fix the reason the wallet gave (most often the account still has an unfinished
          transfer there), then <b>Clear transfer</b> and start again.
        </Notice>
      )}

      {recovery?.orphanedSignedAddKey === true && (
        <Notice tone={"danger"}>
          ⚠ An orphaned signed AddKey is journaled with no start result to bind it. Its bytes may
          still land on-chain, so nothing new can start until it is reconciled.
        </Notice>
      )}

      <ol className={"grid gap-2 sm:grid-cols-3"}>
        <TransferStep
          number={1}
          title={"Start"}
          detail={"Wallet mints destination keys"}
          done={active?.startOutput != null && !nothingAccepted}
          pending={startMutation.isPending}
          button={
            <ActionButton
              fullWidth
              pending={startMutation.isPending}
              pendingLabel={"Waiting for wallet…"}
              disabled={busy || staged.length === 0 || !activeIsFinished}
              onClick={() => startMutation.mutate(undefined)}
            >
              {active == null || activeIsFinished ? "Start" : "Started ✓"}
            </ActionButton>
          }
        />
        <TransferStep
          number={2}
          title={"AddKeys"}
          detail={"This side broadcasts on-chain"}
          done={addKeysDone || verified}
          pending={addKeysMutation.isPending}
          button={
            <ActionButton
              fullWidth
              pending={addKeysMutation.isPending}
              pendingLabel={"Broadcasting…"}
              // `verified` matters as well as `addKeysDone`: verification CONSUMES the pending proof,
              // so once step 3 succeeds `addKeysDone` goes false again and this would re-open on a
              // finished transfer — straight into `start_result_journal_missing`.
              disabled={
                busy || transferSessionId == null || addKeysDone || verified || nothingAccepted
              }
              onClick={() => transferSessionId != null && addKeysMutation.mutate(transferSessionId)}
            >
              {addKeysDone || verified ? "AddKeys done ✓" : "Run AddKeys"}
            </ActionButton>
          }
        />
        <TransferStep
          number={3}
          title={"Verify"}
          detail={"Wallet checks keys live, imports"}
          done={verified}
          pending={verifyMutation.isPending}
          button={
            <ActionButton
              fullWidth
              pending={verifyMutation.isPending}
              pendingLabel={"Waiting for wallet…"}
              disabled={busy || !addKeysDone || verified || nothingAccepted}
              onClick={() => transferSessionId != null && verifyMutation.mutate(transferSessionId)}
            >
              {verified ? "Verified ✓" : "Verify active"}
            </ActionButton>
          }
        />
      </ol>

      <div>
        <ActionButton
          size={"sm"}
          variant={clearWouldStrandWallet ? "danger" : "secondary"}
          pending={clearMutation.isPending}
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
        </ActionButton>
      </div>

      {flowError != null && (
        <Notice tone={"danger"}>
          <span className={"font-mono text-xs break-all"}>{flowError}</span>
        </Notice>
      )}

      {sessions.length > 0 && (
        <div className={"flex flex-col gap-2"}>
          <h4 className={"text-xs font-semibold text-slate-600 dark:text-slate-400"}>
            Transfers ({sessions.length})
          </h4>
          <ul
            className={
              "divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800"
            }
          >
            {sessions.map((session: INewKeyTransferSdkSession) => (
              <li key={session.clientTransferId} className={"flex flex-col gap-1 px-3 py-2"}>
                <div className={"flex flex-wrap items-center gap-2"}>
                  <Chip
                    tone={
                      session.phase === "destination_keys_verified"
                        ? "green"
                        : session === active
                          ? "blue"
                          : "neutral"
                    }
                  >
                    {session.phase}
                  </Chip>
                  <span
                    className={"font-mono text-xs break-all text-slate-500 dark:text-slate-400"}
                  >
                    {session.clientTransferId}
                  </span>
                </div>
                <span className={"text-xs text-slate-600 dark:text-slate-300"}>
                  {platformLabel(session.targetPlatform)} · {session.startRequest.accounts.length}{" "}
                  account(s) · {session.verifiedAccounts.length} verified
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {log.length > 0 && (
        <details open className={"group"}>
          <summary
            className={
              "flex cursor-pointer list-none items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 [&::-webkit-details-marker]:hidden"
            }
          >
            <span>Step log ({log.length} lines)</span>
            <button
              type={"button"}
              className={"cursor-pointer font-medium underline"}
              onClick={(event) => {
                event.preventDefault();
                setLog([]);
              }}
            >
              clear log
            </button>
          </summary>
          <pre
            className={
              "mt-2 max-h-72 overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-slate-100 dark:bg-black"
            }
          >
            {log.join("\n")}
          </pre>
        </details>
      )}
    </SubPanel>
  );
};

const TransferStep = ({
  number,
  title,
  detail,
  done,
  pending,
  button,
}: {
  number: number;
  title: string;
  detail: string;
  done: boolean;
  pending: boolean;
  button: ReactNode;
}) => (
  <li
    className={
      "flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-950/40"
    }
  >
    <div className={"flex items-center gap-2"}>
      <span
        className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          done
            ? "bg-emerald-600 text-white"
            : pending
              ? "bg-blue-600 text-white"
              : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
        }`}
      >
        {done ? "✓" : number}
      </span>
      <div className={"min-w-0"}>
        <p className={"text-sm font-semibold text-slate-900 dark:text-slate-100"}>{title}</p>
        <p className={"text-xs text-slate-500 dark:text-slate-400"}>{detail}</p>
      </div>
    </div>
    {button}
  </li>
);
