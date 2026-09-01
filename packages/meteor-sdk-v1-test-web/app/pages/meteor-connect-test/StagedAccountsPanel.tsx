import type { MeteorConnect, TStagedTransferAccountSummary } from "@meteorwallet/sdk";
import { METEOR_CONNECT_BACKENDS, parseTransferSecretInput } from "@meteorwallet/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "~/ui/Button";
import { buildFakeTransferAccountBatch } from "./fakeTransferAccounts";

/**
 * Source-account staging for the new-key transfer, plus the harness's backend switcher.
 *
 * Staging is deliberately separate from the transfer itself: `NewKeyTransferTest` reads the same
 * staged set through `transferAccounts.getStagedWithSecrets()` and sends only the PUBLIC halves.
 * Staged secrets persist in plaintext localStorage (harness opt-in) so runs are repeatable —
 * testnet material only.
 *
 * The old existing-secret flow (`transferAccounts.prompt()`) was removed from this harness: it is
 * not the method we ship, and no Meteor mobile wallet advertises `transfer_accounts_v1`, so its
 * mobile QR could only ever end in `wallet_update_required`.
 */
export const StagedAccountsPanel = ({
  meteorConnect,
  network,
  backendUrl,
}: {
  meteorConnect: MeteorConnect;
  network: "testnet" | "mainnet";
  backendUrl: string;
}) => {
  const usingLocalBackend = backendUrl.includes("localhost") || backendUrl.includes("127.0.0.1");
  const usingProductionBackend = backendUrl === METEOR_CONNECT_BACKENDS.production;
  // `development` is the default, so it is the absence of the param rather than a value.
  const switchBackend = (target: "local" | "development" | "production") => {
    const url = new URL(window.location.href);
    if (target === "development") url.searchParams.delete("backend");
    else url.searchParams.set("backend", target);
    window.location.href = url.toString();
  };
  const switchLink = (target: "local" | "development" | "production", label: string) => (
    <button className={"underline cursor-pointer"} onClick={() => switchBackend(target)}>
      {label}
    </button>
  );
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
    <div className={"mt-6 p-4 border-2 border-slate-500 rounded-xl flex flex-col gap-3"}>
      <h2 className={"text-lg font-bold"}>Staged source accounts</h2>
      <p className={"text-sm text-gray-500"}>
        Stage account secrets below (testnet material only — staged secrets persist in plaintext
        localStorage for repeatable test runs), then run the new-key transfer underneath. Network
        for new stages: <b>{network}</b>
      </p>
      {usingLocalBackend ? (
        <p className={"text-sm text-green-700"}>
          Using the local mc backend at <code>{backendUrl}</code> — run it with <code>bun dev</code>{" "}
          in <code>../meteor-connect-bridge/packages/meteor-connect-backend</code>.{" "}
          {switchLink("development", "Switch to development")} ·{" "}
          {switchLink("production", "production")}
        </p>
      ) : usingProductionBackend ? (
        <p className={"text-sm text-amber-700"}>
          ⚠ Using the PRODUCTION backend — real user sessions live here. If bridge creation fails
          with a CORS error, the request is being stopped at the Cloudflare edge (WAF block on{" "}
          <code>mc.meteorwallet.app</code> — preflights can never pass a challenge), not by the
          worker. {switchLink("development", "Switch back to development")} ·{" "}
          {switchLink("local", "local")}
        </p>
      ) : (
        <p className={"text-sm text-green-700"}>
          Using the development backend at <code>{backendUrl}</code> — the default for this harness.{" "}
          {switchLink("local", "Switch to local")} · {switchLink("production", "production")}
        </p>
      )}

      <div className={"flex flex-col gap-2 max-w-xl"}>
        <input
          className={"border-2 rounded-lg py-1.5 px-3"}
          placeholder={"Account ID (e.g. alice.testnet)"}
          value={accountId}
          autoComplete={"off"}
          onChange={(e) => setAccountId(e.target.value)}
        />
        <textarea
          className={"border-2 rounded-lg py-1.5 px-3 font-mono text-sm"}
          placeholder={'12/24-word mnemonic OR "ed25519:<base58>" private key'}
          value={secretInput}
          autoComplete={"off"}
          rows={2}
          onChange={(e) => setSecretInput(e.target.value)}
        />
        {detected != null && (
          <span
            className={`text-xs ${detected.type === "invalid" ? "text-amber-600" : "text-green-700"}`}
          >
            {detected.type === "invalid"
              ? `Not yet a valid secret (${detected.reason})`
              : `Detected: ${detected.type.replace("_", " ")}`}
          </span>
        )}
        {stageError != null && <span className={"text-sm text-red-700"}>{stageError}</span>}
        {stageMutation.error != null && (
          <span className={"text-sm text-red-700"}>
            Stage failed: {String(stageMutation.error)}
          </span>
        )}
        <div className={"flex flex-row flex-wrap gap-3 items-center"}>
          <Button
            disabled={
              stageMutation.isPending || accountId.trim() === "" || secretInput.trim() === ""
            }
            onClick={() => stageMutation.mutate()}
          >
            Stage account secret
          </Button>
          <Button
            disabled={addFakeBatchMutation.isPending}
            onClick={() => addFakeBatchMutation.mutate()}
          >
            {addFakeBatchMutation.isPending ? "Adding fake accounts..." : "Add 5 fake accounts"}
          </Button>
          <span className={"text-xs text-gray-500"}>
            Volume testing: each click stages 5 diverse fake accounts (12/24-word mnemonics, custom
            derivation path, private keys, implicit-style id, one multi-secret account).
          </span>
        </div>
      </div>

      <div className={"flex flex-col gap-1"}>
        <h3 className={"font-bold text-sm"}>Staged accounts ({staged.length})</h3>
        {staged.length === 0 ? (
          <span className={"text-sm text-gray-500"}>Nothing staged yet.</span>
        ) : (
          staged.map((summary: TStagedTransferAccountSummary) => (
            <div
              key={`${summary.blockchainId}:${summary.networkId}:${summary.accountId}`}
              className={"flex flex-row items-center gap-3 text-sm"}
            >
              <span className={"font-mono"}>{summary.accountId}</span>
              <span className={"text-gray-500"}>
                {summary.networkId} · {summary.secretTypes.join(", ")}
              </span>
              <button
                className={"text-red-700 underline cursor-pointer"}
                onClick={async () => {
                  await meteorConnect.transferAccounts.removeStaged(summary);
                  await refreshStaged();
                }}
              >
                remove
              </button>
            </div>
          ))
        )}
      </div>

      <div className={"flex flex-row flex-wrap gap-3 items-center"}>
        <Button
          disabled={staged.length === 0}
          onClick={async () => {
            await meteorConnect.transferAccounts.clearStaged();
            await refreshStaged();
          }}
        >
          Clear staged
        </Button>
      </div>
    </div>
  );
};
