import type { IMeteorConnectAccount, MeteorConnect } from "@meteorwallet/sdk";
import { KeyPair, PublicKey } from "@near-js/crypto";
import { type Action, actionCreators } from "@near-js/transactions";
import { useLocalStorage } from "usehooks-ts";
import { ActionRow } from "./ActionRow";
import {
  FULL_ACCESS_KEY_ALLOW_LISTED_ORIGINS,
  getPartnerOriginParam,
  PARTNER_ORIGIN_PRESETS,
  resolvePartnerOrigin,
  switchPartnerOrigin,
  type TPartnerOriginPreset,
} from "./partnerOrigin";
import { useActionResults, useLatestActionResult } from "./results/ActionResultsUi";
import { summarizeTransactions } from "./results/summaries";
import { ActionButton, Notice, SegmentedControl } from "./ui";

const KEY_ADD_FULL_ACCESS = "near::sign_transactions:add_full_access_key";
const KEY_REMOVE_TEST_KEY = "near::sign_transactions:remove_test_key";

type TOriginChoice = "self" | TPartnerOriginPreset | "custom";

const ORIGIN_OPTIONS: ReadonlyArray<{ value: TOriginChoice; label: string }> = [
  { value: "self", label: "This site" },
  { value: "nearaccounts", label: "nearaccounts.com" },
  { value: "lookalike", label: "Lookalike" },
];

const getOriginChoice = (): TOriginChoice => {
  const param = getPartnerOriginParam();
  if (param == null) return "self";
  return param in PARTNER_ORIGIN_PRESETS ? (param as TPartnerOriginPreset) : "custom";
};

/**
 * Asks the wallet to add a Full Access Key, the request wallets must refuse unless it comes from an
 * allow-listed account recovery service (nearaccounts.com). The harness can claim to be that site
 * over the mobile bridge, where the origin is self-declared, to check the wallet's warning; and a
 * site that isn't on the list, to check it's blocked.
 *
 * The key is generated here and its private key thrown away, so an approved key gives nobody
 * access. "Remove last test key" deletes it again.
 */
export const FullAccessKeyRequestTest = ({
  account,
  meteorConnect,
}: {
  account: IMeteorConnectAccount;
  meteorConnect: MeteorConnect;
}) => {
  const { run } = useActionResults();
  const { accountId, network } = account.identifier;
  const target = account.identifier;
  const claimedOrigin = resolvePartnerOrigin();
  const originChoice = getOriginChoice();
  const isAllowListed = FULL_ACCESS_KEY_ALLOW_LISTED_ORIGINS.includes(claimedOrigin);

  // Kept across the reload that switching the claimed origin does
  const [lastTestKey, setLastTestKey] = useLocalStorage<string | undefined>(
    `full_access_key_test::${network}:${accountId}`,
    undefined,
  );

  const adding = useLatestActionResult(KEY_ADD_FULL_ACCESS);
  const removing = useLatestActionResult(KEY_REMOVE_TEST_KEY);

  const sendTransaction = (key: string, label: string, actions: Action[], onSuccess?: () => void) =>
    run({
      key,
      label,
      actionId: "near::sign_transactions",
      accountId,
      network,
      execute: async () => {
        const action = await meteorConnect.createAction({
          id: "near::sign_transactions",
          input: {
            target,
            transactions: [{ receiverId: accountId, actions }],
            useFunctionCallKey: false,
          },
        });
        const outcomes = await action.promptForExecution();
        onSuccess?.();
        return outcomes;
      },
      summarize: (outcomes) => summarizeTransactions(outcomes, network),
    });

  return (
    <ActionRow
      title={"Add a Full Access Key (dangerous request)"}
      description={
        <>
          Asks the wallet to add a Full Access Key to{" "}
          <b className={"font-medium text-slate-700 dark:text-slate-200"}>{accountId}</b>. The
          private key is thrown away, so an approved key gives nobody access. Remove it afterwards.
        </>
      }
      resultKeys={[KEY_ADD_FULL_ACCESS, KEY_REMOVE_TEST_KEY]}
      inputs={
        <div className={"flex flex-col gap-2 sm:col-span-2"}>
          <div className={"flex flex-wrap items-center gap-2"}>
            <span className={"text-sm text-slate-600 dark:text-slate-300"}>Claim to be</span>
            <SegmentedControl
              ariaLabel={"Origin this harness claims"}
              value={originChoice}
              options={ORIGIN_OPTIONS}
              onChange={(choice) => {
                if (choice === originChoice || choice === "custom") return;
                switchPartnerOrigin(choice === "self" ? null : choice);
              }}
            />
          </div>
          <Notice tone={isAllowListed ? "warn" : "info"}>
            Claiming <code className={"text-xs"}>{claimedOrigin}</code> (switching reloads the
            page). Expected:{" "}
            {isAllowListed ? (
              <>
                <b>Meteor Mobile</b> shows the red full-control warning, saying it can&apos;t
                confirm the site, and only enables Confirm after the checkbox. <b>Meteor Web</b> and
                the <b>extension</b> block it, because they see this page&apos;s real origin.
              </>
            ) : (
              <>every wallet blocks it with &ldquo;Full access key request blocked&rdquo;.</>
            )}
          </Notice>
        </div>
      }
      actions={
        <>
          <ActionButton
            pending={adding.pending}
            pendingLabel={"Waiting for wallet…"}
            onClick={() => {
              const publicKey = KeyPair.fromRandom("ed25519").getPublicKey();
              void sendTransaction(
                KEY_ADD_FULL_ACCESS,
                "Add Full Access Key",
                [actionCreators.addKey(publicKey, actionCreators.fullAccessKey())],
                () => setLastTestKey(publicKey.toString()),
              );
            }}
          >
            Request Full Access Key
          </ActionButton>
          <ActionButton
            variant={"secondary"}
            pending={removing.pending}
            pendingLabel={"Waiting for wallet…"}
            disabled={lastTestKey == null}
            onClick={() => {
              if (lastTestKey == null) return;
              void sendTransaction(
                KEY_REMOVE_TEST_KEY,
                "Remove test key",
                [actionCreators.deleteKey(PublicKey.fromString(lastTestKey))],
                () => setLastTestKey(undefined),
              );
            }}
          >
            Remove last test key
          </ActionButton>
        </>
      }
    >
      {lastTestKey != null && (
        <p className={"text-xs break-all text-slate-500 dark:text-slate-400"}>
          Last added test key: <code>{lastTestKey}</code>
        </p>
      )}
    </ActionRow>
  );
};
