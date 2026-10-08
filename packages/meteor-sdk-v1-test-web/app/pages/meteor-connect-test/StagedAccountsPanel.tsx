import type { MeteorConnect, TStagedTransferAccountSummary } from "@meteorwallet/sdk";
import { parseTransferSecretInput } from "@meteorwallet/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { buildFakeTransferAccountBatch } from "./fakeTransferAccounts";
import { ActionButton, Notice, SubPanel, TextArea, TextField } from "./ui";

/**
 * Source-account staging for the new-key transfer.
 *
 * Staging is deliberately separate from the transfer itself: `NewKeyTransferTest` reads the same
 * staged set through `transferAccounts.getStagedWithSecrets()` and sends only the PUBLIC halves.
 * Staged secrets persist in plaintext localStorage (harness opt-in) so runs are repeatable —
 * testnet material only. (The bridge backend switcher lives in the connection card.)
 *
 * The old existing-secret flow (`transferAccounts.prompt()`) was removed from this harness: it is
 * not the method we ship, and no Meteor mobile wallet advertises `transfer_accounts_v1`, so its
 * mobile QR could only ever end in `wallet_update_required`.
 */
export const StagedAccountsPanel = ({
  meteorConnect,
  network,
}: {
  meteorConnect: MeteorConnect;
  network: "testnet" | "mainnet";
}) => {
  const queryClient = useQueryClient();
  const [accountId, setAccountId] = useState("");
  const [secretInput, setSecretInput] = useState("");
  const [stageError, setStageError] = useState<string>();

  const stagedQuery = useQuery({
    queryKey: ["transfer-accounts", "staged"],
    queryFn: () => meteorConnect.transferAccounts.getStagedSummaries(),
  });
  const staged = stagedQuery.data ?? [];

  const refreshStaged = () =>
    queryClient.invalidateQueries({ queryKey: ["transfer-accounts", "staged"] });

  const detected = secretInput.trim().length > 0 ? parseTransferSecretInput(secretInput) : null;

  const stageMutation = useMutation({
    mutationFn: async () => {
      setStageError(undefined);
      const result = await meteorConnect.transferAccounts.stage({
        networkId: network,
        accountId,
        secretInput,
      });
      if (!result.ok) {
        setStageError(`${result.reason}: ${result.message}`);
        return;
      }
      setAccountId("");
      setSecretInput("");
      await refreshStaged();
    },
  });

  const addFakeBatchMutation = useMutation({
    mutationFn: async () => {
      setStageError(undefined);
      // Volume testing: 5 diverse fake accounts per click (see fakeTransferAccounts.ts). A
      // mid-batch failure (e.g. hitting the harness `maxStagedAccounts` cap) stops and surfaces
      // the reason.
      for (const account of buildFakeTransferAccountBatch(network)) {
        for (const secret of account.secrets) {
          const result = await meteorConnect.transferAccounts.stage({
            networkId: network,
            accountId: account.accountId,
            secretInput: secret.secretInput,
            derivationPath: secret.derivationPath,
          });
          if (!result.ok) {
            setStageError(`${account.accountId} → ${result.reason}: ${result.message}`);
            await refreshStaged();
            return;
          }
        }
      }
      await refreshStaged();
    },
  });

  return (
    <SubPanel
      title={`Staged source accounts (${staged.length})`}
      description={
        <>
          Testnet material only — staged secrets persist in plaintext localStorage for repeatable
          runs. New stages go to <b>{network}</b>.
        </>
      }
    >
      <div className={"flex flex-col gap-3"}>
        <TextField
          label={"Account ID"}
          placeholder={"alice.testnet"}
          value={accountId}
          onChange={setAccountId}
          mono
        />
        <TextArea
          label={"Secret"}
          placeholder={'12/24-word mnemonic OR "ed25519:<base58>" private key'}
          value={secretInput}
          onChange={setSecretInput}
          hint={
            detected != null && (
              <span
                className={
                  detected.type === "invalid"
                    ? "text-xs text-amber-700 dark:text-amber-400"
                    : "text-xs text-emerald-700 dark:text-emerald-400"
                }
              >
                {detected.type === "invalid"
                  ? `Not yet a valid secret (${detected.reason})`
                  : `Detected: ${detected.type.replace("_", " ")}`}
              </span>
            )
          }
        />
        {stageError != null && <Notice tone={"danger"}>{stageError}</Notice>}
        {stageMutation.error != null && (
          <Notice tone={"danger"}>Stage failed: {String(stageMutation.error)}</Notice>
        )}
        <div className={"flex flex-col gap-2 sm:flex-row sm:flex-wrap"}>
          <ActionButton
            pending={stageMutation.isPending}
            disabled={accountId.trim() === "" || secretInput.trim() === ""}
            onClick={() => stageMutation.mutate()}
          >
            Stage account secret
          </ActionButton>
          <ActionButton
            variant={"secondary"}
            pending={addFakeBatchMutation.isPending}
            pendingLabel={"Adding fake accounts…"}
            onClick={() => addFakeBatchMutation.mutate()}
          >
            Add 5 fake accounts
          </ActionButton>
        </div>
        <p className={"text-xs text-slate-500 dark:text-slate-400"}>
          Volume testing: each fake batch stages 5 diverse accounts (12/24-word mnemonics, custom
          derivation path, private keys, implicit-style id, one multi-secret account).
        </p>
      </div>

      <div className={"flex flex-col gap-2"}>
        {staged.length === 0 ? (
          <p className={"text-sm text-slate-500 dark:text-slate-400"}>Nothing staged yet.</p>
        ) : (
          <>
            <ul
              className={
                "max-h-72 divide-y divide-slate-200 overflow-auto rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800"
              }
            >
              {staged.map((summary: TStagedTransferAccountSummary) => (
                <li
                  key={`${summary.blockchainId}:${summary.networkId}:${summary.accountId}`}
                  className={"flex items-center gap-3 px-3 py-2 text-sm"}
                >
                  <div className={"min-w-0 flex-1"}>
                    <p className={"truncate font-mono text-xs text-slate-900 dark:text-slate-100"}>
                      {summary.accountId}
                    </p>
                    <p className={"text-xs text-slate-500 dark:text-slate-400"}>
                      {summary.networkId} · {summary.secretTypes.join(", ")}
                    </p>
                  </div>
                  <ActionButton
                    size={"sm"}
                    variant={"ghost"}
                    onClick={async () => {
                      await meteorConnect.transferAccounts.removeStaged(summary);
                      await refreshStaged();
                    }}
                  >
                    Remove
                  </ActionButton>
                </li>
              ))}
            </ul>
            <div>
              <ActionButton
                size={"sm"}
                variant={"danger"}
                onClick={async () => {
                  await meteorConnect.transferAccounts.clearStaged();
                  await refreshStaged();
                }}
              >
                Clear all staged
              </ActionButton>
            </div>
          </>
        )}
      </div>
    </SubPanel>
  );
};
