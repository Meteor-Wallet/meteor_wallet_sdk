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
              disabled={active != null}
              onChange={() => setPlatform(option)}
            />
            {PLATFORM_LABELS[option]}
          </label>
        ))}
        {active != null && (
          <span className={"text-xs text-gray-500"}>
            fixed for the life of a transfer — clear it to change
          </span>
        )}
      </div>

      {recovery?.orphanedSignedAddKey === true && (
        <p className={"text-sm text-red-700"}>
          ⚠ An orphaned signed AddKey is journaled with no start result to bind it. Its bytes may
          still land on-chain, so nothing new can start until it is reconciled.
        </p>
      )}

      <div className={"flex flex-row flex-wrap gap-3 items-center"}>
        <Button
          disabled={busy || staged.length === 0 || active != null}
          onClick={() => startMutation.mutate(undefined)}
        >
          1. Start (mint destination keys)
        </Button>
        <Button
          disabled={busy || transferSessionId == null || active?.phase === "verification_pending"}
          onClick={() => transferSessionId != null && addKeysMutation.mutate(transferSessionId)}
        >
          2. Run AddKeys (on-chain)
        </Button>
        <Button
          disabled={busy || transferSessionId == null || recovery?.pendingVerification == null}
          onClick={() => transferSessionId != null && verifyMutation.mutate(transferSessionId)}
        >
          3. Verify Active (import)
        </Button>
        <Button
          disabled={busy || active == null}
          onClick={() => active != null && clearMutation.mutate(active.clientTransferId)}
        >
          Clear transfer
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
