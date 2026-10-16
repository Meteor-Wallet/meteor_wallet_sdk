import type { IMeteorConnectAccount, MeteorConnect } from "@meteorwallet/sdk";
import { useLocalStorage } from "usehooks-ts";
import { ActionList, ActionRow } from "./ActionRow";
import { useActionResults, useLatestActionResult } from "./results/ActionResultsUi";
import { summarizeSignedDelegates, summarizeTransactions } from "./results/summaries";
import { type ISwapSafetyScenario, SWAP_SAFETY_SCENARIOS } from "./swapSafetyScenarios";
import { ActionButton, Notice, SegmentedControl } from "./ui";

type TSendAs = "transaction" | "delegate";

const SEND_AS_OPTIONS: ReadonlyArray<{ value: TSendAs; label: string }> = [
  { value: "transaction", label: "Transaction" },
  { value: "delegate", label: "Delegate action" },
];

const resultKey = (scenario: ISwapSafetyScenario, sendAs: TSendAs) =>
  `swap_safety::${scenario.id}::${sendAs}`;

/**
 * The RHEA swap requests the wallets' Developer settings › Swap testing opens (swapSafetyScenarios.ts),
 * sent as a real dApp would, so each wallet's own approval screen — Meteor Mobile's, Meteor Web's,
 * the extension's — shows its swap value check: the warnings, the confirmations it waits for, the
 * calls it can't read.
 *
 * As a transaction, the request is real: approved, it's signed and sent, and fails on-chain at its
 * pool, which doesn't exist (the deposit is refunded, gas is spent). As a delegate action, the
 * wallet signs it and the harness throws the signature away: nothing is sent.
 */
export const SwapSafetyTest = ({
  account,
  meteorConnect,
}: {
  account: IMeteorConnectAccount;
  meteorConnect: MeteorConnect;
}) => {
  const { accountId, network } = account.identifier;
  const [sendAs, setSendAs] = useLocalStorage<TSendAs>("swap_safety_test.send_as", "transaction");
  const isMainnet = network === "mainnet";

  return (
    <div className={"flex flex-col gap-4"}>
      <div className={"flex flex-wrap items-center gap-2"}>
        <span className={"text-sm text-slate-600 dark:text-slate-300"}>Send as</span>
        <SegmentedControl
          ariaLabel={"How the request is sent"}
          value={sendAs}
          options={SEND_AS_OPTIONS}
          onChange={setSendAs}
        />
      </div>

      {!isMainnet ? (
        <Notice tone={"info"}>
          The scenarios use RHEA&apos;s mainnet contracts: switch to mainnet and sign in with a
          mainnet account.
        </Notice>
      ) : sendAs === "transaction" ? (
        <Notice tone={"warn"}>
          These are real requests from <b>{accountId}</b>: review the approval screen, then reject.
          Approved by mistake, each fails on-chain — every route goes through a pool that
          doesn&apos;t exist, so RHEA refuses the swap and the token refunds the deposit — and only
          gas is spent.
        </Notice>
      ) : (
        <Notice tone={"info"}>
          The wallet shows its delegate-action approval with the same checks. Approved, it signs and
          this page discards the signature: nothing is sent.
        </Notice>
      )}

      <ActionList>
        {SWAP_SAFETY_SCENARIOS.map((scenario) => (
          <ScenarioRow
            key={scenario.id}
            scenario={scenario}
            sendAs={sendAs}
            account={account}
            meteorConnect={meteorConnect}
            disabled={!isMainnet}
          />
        ))}
      </ActionList>
    </div>
  );
};

const ScenarioRow = ({
  scenario,
  sendAs,
  account,
  meteorConnect,
  disabled,
}: {
  scenario: ISwapSafetyScenario;
  sendAs: TSendAs;
  account: IMeteorConnectAccount;
  meteorConnect: MeteorConnect;
  disabled: boolean;
}) => {
  const { run } = useActionResults();
  const { accountId, network } = account.identifier;
  const key = resultKey(scenario, sendAs);
  const latest = useLatestActionResult(key);
  const count = scenario.transactions.length;

  const send = () => {
    if (sendAs === "transaction") {
      void run({
        key,
        label: scenario.title,
        actionId: "near::sign_transactions",
        accountId,
        network,
        execute: async () => {
          const action = await meteorConnect.createAction({
            id: "near::sign_transactions",
            input: {
              target: account.identifier,
              transactions: scenario.transactions,
              useFunctionCallKey: false,
            },
          });
          return action.promptForExecution();
        },
        summarize: (outcomes) => summarizeTransactions(outcomes, network),
      });
      return;
    }
    void run({
      key,
      label: `${scenario.title} (delegate)`,
      actionId: "near::sign_delegate_actions",
      accountId,
      network,
      execute: async () => {
        const action = await meteorConnect.createAction({
          id: "near::sign_delegate_actions",
          input: { target: account.identifier, delegateActions: scenario.transactions },
        });
        return action.promptForExecution();
      },
      summarize: (output) => {
        const summary = summarizeSignedDelegates(output, count);
        // Never relayed: "ready to relay" would invite it
        return summary.status != null
          ? summary
          : { ...summary, headline: "Signed, then discarded: nothing was sent" };
      },
    });
  };

  return (
    <ActionRow
      title={scenario.title}
      description={<>Expect: {scenario.expect}</>}
      resultKeys={[key]}
      actions={
        <ActionButton
          variant={sendAs === "transaction" ? "secondary" : "primary"}
          pending={latest.pending}
          pendingLabel={"Waiting for wallet…"}
          disabled={disabled}
          onClick={send}
        >
          {sendAs === "transaction" ? "Send to wallet" : "Send as delegate action"}
        </ActionButton>
      }
    />
  );
};
