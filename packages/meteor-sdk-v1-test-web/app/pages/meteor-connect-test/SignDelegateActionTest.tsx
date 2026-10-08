import type { IMeteorConnectAccount, MeteorConnect } from "@meteorwallet/sdk";
import { actionCreators, type SignedDelegate } from "@near-js/transactions";
import { parseNearAmount } from "@near-js/utils";
import { useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { ActionRow } from "./ActionRow";
import type { IActionResultField } from "./results/resultsModel";
import { useActionResults, useLatestActionResult } from "./results/ActionResultsUi";
import { summarizeSignedDelegates } from "./results/summaries";
import { ActionButton, TextField } from "./ui";

BigInt.prototype["toJSON"] = function () {
  return `${this.toString()}`;
};

const RELAYER_URL = "http://localhost:8787/test-relayed-transaction";

const KEY_SIGN_DELEGATES = "near::sign_delegate_actions";
const KEY_RELAY = "relay_signed_delegates";

export const SignDelegateActionTest = ({
  account,
  meteorConnect,
}: {
  account: IMeteorConnectAccount;
  meteorConnect: MeteorConnect;
}) => {
  const { run } = useActionResults();
  const { accountId, network } = account.identifier;
  const [receiverId, setReceiverId] = useState("pebble.testnet");
  const [amount, setAmount] = useState("0.001");
  const [signedDelegates, setSignedDelegates] = useLocalStorage<SignedDelegate[] | undefined>(
    "sign_delegate_action_test",
    undefined,
  );

  const signing = useLatestActionResult(KEY_SIGN_DELEGATES);
  const relaying = useLatestActionResult(KEY_RELAY);
  const amountYocto = parseNearAmount(amount.trim());

  const signDelegates = (count: 1 | 2) => {
    if (amountYocto == null) return;
    const delegateActions = Array.from({ length: count }, () => ({
      receiverId: receiverId.trim(),
      actions: [actionCreators.transfer(BigInt(amountYocto))],
    }));
    void run({
      key: KEY_SIGN_DELEGATES,
      label: count > 1 ? "Sign delegate actions (2)" : "Sign delegate action",
      actionId: "near::sign_delegate_actions",
      accountId,
      network,
      execute: async () => {
        const action = await meteorConnect.createAction({
          id: "near::sign_delegate_actions",
          input: { target: account.identifier, delegateActions },
        });
        const output = await action.promptForExecution();
        setSignedDelegates(output.signedDelegatesWithHashes.map((d) => d.signedDelegate));
        return output;
      },
      summarize: (output) => summarizeSignedDelegates(output, count),
    });
  };

  const relay = () => {
    if (signedDelegates == null) return;
    void run({
      key: KEY_RELAY,
      label: "Relay signed delegates",
      accountId,
      network,
      execute: async () => {
        const response = await fetch(RELAYER_URL, {
          body: JSON.stringify({ signedDelegates }),
          method: "POST",
        });
        const text = await response.text();
        let body: unknown = text;
        try {
          body = JSON.parse(text);
        } catch {
          // Not JSON — keep the text.
        }
        if (!response.ok) throw new Error(`Relayer answered HTTP ${response.status}: ${text}`);
        return { status: response.status, body };
      },
      summarize: ({ status, body }) => {
        const fields: IActionResultField[] = [];
        if (body != null && typeof body === "object") {
          for (const [label, value] of Object.entries(body).slice(0, 6)) {
            if (value == null || typeof value === "object") continue;
            fields.push({ label, value: String(value) });
          }
        }
        return {
          headline: `Relayer accepted ${signedDelegates.length} delegate(s) (HTTP ${status})`,
          fields,
        };
      },
    });
  };

  return (
    <ActionRow
      title={"Sign delegate actions"}
      description={
        "Meta-transactions: the wallet signs NEAR transfers for a relayer to submit. The last signed set is kept so it can be relayed."
      }
      resultKeys={[KEY_SIGN_DELEGATES, KEY_RELAY]}
      inputs={
        <>
          <TextField label={"Receiver"} value={receiverId} onChange={setReceiverId} mono />
          <TextField
            label={"Amount per transfer (NEAR)"}
            value={amount}
            onChange={setAmount}
            inputMode={"decimal"}
            hint={amountYocto == null ? "Enter a valid NEAR amount" : undefined}
          />
        </>
      }
      actions={
        <>
          <ActionButton
            pending={signing.pending}
            pendingLabel={"Waiting for wallet…"}
            disabled={amountYocto == null || receiverId.trim() === ""}
            onClick={() => signDelegates(1)}
          >
            Sign 1 delegate action
          </ActionButton>
          <ActionButton
            variant={"secondary"}
            disabled={signing.pending || amountYocto == null || receiverId.trim() === ""}
            onClick={() => signDelegates(2)}
          >
            Sign 2 delegate actions
          </ActionButton>
        </>
      }
    >
      {signedDelegates != null && signedDelegates.length > 0 && (
        <div
          className={
            "flex flex-col gap-2 rounded-xl border border-dashed border-slate-300 p-3 dark:border-slate-700"
          }
        >
          <div className={"flex flex-wrap items-center gap-2"}>
            <span className={"mr-auto text-sm text-slate-700 dark:text-slate-300"}>
              {signedDelegates.length} signed delegate(s) ready to relay
            </span>
            <ActionButton
              size={"sm"}
              variant={"secondary"}
              pending={relaying.pending}
              pendingLabel={"Relaying…"}
              onClick={relay}
            >
              Relay via local relayer
            </ActionButton>
            <ActionButton
              size={"sm"}
              variant={"ghost"}
              onClick={() => setSignedDelegates(undefined)}
            >
              Forget
            </ActionButton>
          </div>
          <p className={"text-xs text-slate-500 dark:text-slate-400"}>
            Posts to <code>{RELAYER_URL}</code> — reachable from the desktop running the backend,
            not from a phone.
          </p>
          <details>
            <summary
              className={"cursor-pointer text-xs font-medium text-slate-500 dark:text-slate-400"}
            >
              Show stored delegates
            </summary>
            <pre
              className={
                "mt-1 max-h-60 overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-slate-100 dark:bg-black"
              }
            >
              {JSON.stringify(signedDelegates, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </ActionRow>
  );
};
