import type {
  IMeteorConnectAccount,
  MeteorConnect,
  TFunctionCallKeyCoverage,
} from "@meteorwallet/sdk";
import { functionCallKeyCoverage } from "@meteorwallet/sdk";
import { actionCreators } from "@near-js/transactions";
import { parseNearAmount } from "@near-js/utils";
import { useState } from "react";
import { createSimpleNonce, GUESTBOOK_CONTRACT_ID } from "~/pages/meteor-sdk-test/guestbook";
import { ActionList, ActionRow } from "./ActionRow";
import { useActionResults, useLatestActionResult } from "./results/ActionResultsUi";
import {
  summarizeSignedMessage,
  summarizeTransactions,
  summarizeVerifyOwner,
} from "./results/summaries";
import { SignDelegateActionTest } from "./SignDelegateActionTest";
import { ActionButton, Notice, Section, TextField, Toggle } from "./ui";

const BOATLOAD_OF_GAS = "30000000000000";

const KEY_SIGN_MESSAGE = "near::sign_message";
const KEY_VERIFY_OWNER = "near::verify_owner";
const KEY_GUESTBOOK = "near::sign_transactions:guestbook";

/** Everything a signed-in account can ask the wallet for, each with its own inline outcome. */
export const WalletActionsPanel = ({
  account,
  meteorConnect,
}: {
  account: IMeteorConnectAccount;
  meteorConnect: MeteorConnect;
}) => {
  const { run } = useActionResults();
  const { accountId, network } = account.identifier;
  const target = account.identifier;

  const [signMessageText, setSignMessageText] = useState("hello");
  const [verifyOwnerText, setVerifyOwnerText] = useState("TEST");
  const [guestbookText, setGuestbookText] = useState("Hello from the Meteor Connect harness");
  const [withDonation, setWithDonation] = useState(false);
  const [donation, setDonation] = useState("0.001");
  const [twoTransactions, setTwoTransactions] = useState(false);
  const [useFunctionCallKey, setUseFunctionCallKey] = useState(true);

  const signMessage = useLatestActionResult(KEY_SIGN_MESSAGE);
  const verifyOwner = useLatestActionResult(KEY_VERIFY_OWNER);
  const guestbook = useLatestActionResult(KEY_GUESTBOOK);

  const donationYocto = withDonation ? parseNearAmount(donation.trim()) : "0";
  const guestbookCount = twoTransactions ? 2 : 1;
  const guestbookTransactions =
    donationYocto == null
      ? undefined
      : Array.from({ length: guestbookCount }, (_, index) => ({
          receiverId: GUESTBOOK_CONTRACT_ID,
          actions: [
            actionCreators.functionCall(
              "addMessage",
              {
                text:
                  guestbookCount > 1
                    ? `${guestbookText} (${index + 1}/${guestbookCount})`
                    : guestbookText,
              },
              BigInt(BOATLOAD_OF_GAS),
              BigInt(donationYocto),
            ),
          ],
        }));
  // The same check the SDK makes before deciding — so the row can say up front which way it goes.
  const keyCoverage =
    guestbookTransactions == null
      ? undefined
      : functionCallKeyCoverage(account, guestbookTransactions);
  const signsWithKey = useFunctionCallKey && keyCoverage?.covered === true;

  return (
    <Section
      title={"Wallet actions"}
      description={
        <>
          Requests for{" "}
          <b className={"font-medium text-slate-700 dark:text-slate-200"}>{accountId}</b>. Each
          result shows under its button and in the Results log.
        </>
      }
    >
      <ActionList>
        <ActionRow
          title={"Sign message"}
          description={`NEP-413 message for ${GUESTBOOK_CONTRACT_ID}. The returned signature is verified locally.`}
          resultKeys={[KEY_SIGN_MESSAGE]}
          inputs={
            <TextField label={"Message"} value={signMessageText} onChange={setSignMessageText} />
          }
          actions={
            <ActionButton
              pending={signMessage.pending}
              pendingLabel={"Waiting for wallet…"}
              onClick={() => {
                const messageParams = {
                  message: signMessageText,
                  nonce: createSimpleNonce(),
                  recipient: GUESTBOOK_CONTRACT_ID,
                };
                void run({
                  key: KEY_SIGN_MESSAGE,
                  label: "Sign message",
                  actionId: "near::sign_message",
                  accountId,
                  network,
                  execute: async () => {
                    const action = await meteorConnect.createAction({
                      id: "near::sign_message",
                      input: { messageParams, target },
                    });
                    return action.promptForExecution();
                  },
                  summarize: (signed) => summarizeSignedMessage(signed, messageParams, accountId),
                });
              }}
            >
              Sign message
            </ActionButton>
          }
        />

        <ActionRow
          title={"Verify owner"}
          description={"Asks the wallet to prove it controls this account by signing a message."}
          resultKeys={[KEY_VERIFY_OWNER]}
          inputs={
            <TextField label={"Message"} value={verifyOwnerText} onChange={setVerifyOwnerText} />
          }
          actions={
            <ActionButton
              pending={verifyOwner.pending}
              pendingLabel={"Waiting for wallet…"}
              onClick={() => {
                void run({
                  key: KEY_VERIFY_OWNER,
                  label: "Verify owner",
                  actionId: "near::verify_owner",
                  accountId,
                  network,
                  execute: async () => {
                    const action = await meteorConnect.createAction({
                      id: "near::verify_owner",
                      input: { target, message: verifyOwnerText },
                    });
                    return action.promptForExecution();
                  },
                  summarize: (output) => summarizeVerifyOwner(output, accountId),
                });
              }}
            >
              Verify owner
            </ActionButton>
          }
        />

        <ActionRow
          title={"Guestbook transaction"}
          description={
            <>
              Calls <code className={"text-xs"}>addMessage</code> on {GUESTBOOK_CONTRACT_ID}, then
              checks each outcome on-chain.
              {network === "mainnet" && " This contract is testnet only, so expect a failure here."}
            </>
          }
          resultKeys={[KEY_GUESTBOOK]}
          inputs={
            <>
              <TextField label={"Message"} value={guestbookText} onChange={setGuestbookText} />
              <TextField
                label={"Donation (NEAR)"}
                value={donation}
                onChange={setDonation}
                inputMode={"decimal"}
                disabled={!withDonation}
                hint={
                  withDonation && donationYocto == null ? "Enter a valid NEAR amount" : undefined
                }
              />
              <div className={"flex flex-wrap gap-x-6 sm:col-span-2"}>
                <Toggle
                  label={"Attach donation"}
                  checked={withDonation}
                  onChange={setWithDonation}
                />
                <Toggle
                  label={"Send as 2 transactions"}
                  checked={twoTransactions}
                  onChange={setTwoTransactions}
                />
                <Toggle
                  label={"Use function-call key"}
                  checked={useFunctionCallKey}
                  onChange={setUseFunctionCallKey}
                />
              </div>
              <div className={"sm:col-span-2"}>
                <SigningPath coverage={keyCoverage} useFunctionCallKey={useFunctionCallKey} />
              </div>
            </>
          }
          actions={
            <ActionButton
              pending={guestbook.pending}
              pendingLabel={signsWithKey ? "Sending…" : "Waiting for wallet…"}
              disabled={guestbookTransactions == null}
              onClick={() => {
                if (guestbookTransactions == null) return;
                const transactions = guestbookTransactions;
                void run({
                  key: KEY_GUESTBOOK,
                  label:
                    guestbookCount > 1 ? "Guestbook transactions (2)" : "Guestbook transaction",
                  actionId: "near::sign_transactions",
                  accountId,
                  network,
                  execute: async () => {
                    const action = await meteorConnect.createAction({
                      id: "near::sign_transactions",
                      input: { target, transactions, useFunctionCallKey },
                    });
                    const outcomes = await action.promptForExecution();
                    return { outcomes, signedWith: action.getExecutionMethod() };
                  },
                  summarize: ({ outcomes, signedWith }) => {
                    const summary = summarizeTransactions(outcomes, network);
                    return {
                      ...summary,
                      fields: [
                        {
                          label: "Signed with",
                          value:
                            signedWith === "function_call_key"
                              ? "Function-call key — no wallet prompt"
                              : "Wallet",
                          tone: signedWith === "function_call_key" ? "good" : undefined,
                          copyable: false,
                        },
                        ...(summary.fields ?? []),
                      ],
                    };
                  },
                });
              }}
            >
              {twoTransactions ? "Send 2 transactions" : "Send transaction"}
            </ActionButton>
          }
        />

        <SignDelegateActionTest account={account} meteorConnect={meteorConnect} />
      </ActionList>
    </Section>
  );
};

const COVERAGE_COPY: Record<
  Extract<TFunctionCallKeyCoverage, { covered: false }>["reason"],
  string
> = {
  deposit_attached:
    "Opens the wallet: a function-call key cannot attach a deposit, so the donation needs approval.",
  no_function_call_key:
    "Opens the wallet: this account has no guestbook key. Sign in with “Sign in to Guestbook” to add one.",
  wrong_receiver: "Opens the wallet: the account's key is for a different contract.",
  method_not_allowed: "Opens the wallet: the account's key does not allow this method.",
  not_a_function_call: "Opens the wallet: only function calls can use the key.",
  no_transactions: "Nothing to send.",
};

/** Which way a send will go — local function-call key, or the wallet — before it is made. */
const SigningPath = ({
  coverage,
  useFunctionCallKey,
}: {
  coverage?: TFunctionCallKeyCoverage;
  useFunctionCallKey: boolean;
}) => {
  if (coverage == null) return null;
  if (!coverage.covered) {
    return <Notice tone={"warn"}>{COVERAGE_COPY[coverage.reason]}</Notice>;
  }
  if (!useFunctionCallKey) {
    return <Notice tone={"warn"}>Opens the wallet: the function-call key is switched off.</Notice>;
  }
  return (
    <Notice tone={"success"}>
      Signs with the account&apos;s function-call key — no wallet prompt.
    </Notice>
  );
};
