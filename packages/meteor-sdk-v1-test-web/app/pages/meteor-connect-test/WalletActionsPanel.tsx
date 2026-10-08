import type { IMeteorConnectAccount, MeteorConnect } from "@meteorwallet/sdk";
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
import { ActionButton, Section, TextField, Toggle } from "./ui";

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

  const signMessage = useLatestActionResult(KEY_SIGN_MESSAGE);
  const verifyOwner = useLatestActionResult(KEY_VERIFY_OWNER);
  const guestbook = useLatestActionResult(KEY_GUESTBOOK);

  const donationYocto = withDonation ? parseNearAmount(donation.trim()) : "0";

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
              </div>
            </>
          }
          actions={
            <ActionButton
              pending={guestbook.pending}
              pendingLabel={"Waiting for wallet…"}
              disabled={donationYocto == null}
              onClick={() => {
                if (donationYocto == null) return;
                const count = twoTransactions ? 2 : 1;
                const transactions = Array.from({ length: count }, (_, index) => ({
                  receiverId: GUESTBOOK_CONTRACT_ID,
                  actions: [
                    actionCreators.functionCall(
                      "addMessage",
                      {
                        text:
                          count > 1 ? `${guestbookText} (${index + 1}/${count})` : guestbookText,
                      },
                      BigInt(BOATLOAD_OF_GAS),
                      BigInt(donationYocto),
                    ),
                  ],
                }));
                void run({
                  key: KEY_GUESTBOOK,
                  label: count > 1 ? "Guestbook transactions (2)" : "Guestbook transaction",
                  actionId: "near::sign_transactions",
                  accountId,
                  network,
                  execute: async () => {
                    const action = await meteorConnect.createAction({
                      id: "near::sign_transactions",
                      input: { target, transactions },
                    });
                    return action.promptForExecution();
                  },
                  summarize: (outcomes) => summarizeTransactions(outcomes, network),
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
