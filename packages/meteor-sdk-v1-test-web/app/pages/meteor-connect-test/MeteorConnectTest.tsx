import type { IMeteorConnectAccount } from "@meteorwallet/sdk";
import { METEOR_CONNECT_BACKENDS, MeteorConnect, webpage_local_storage } from "@meteorwallet/sdk";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { DEPLOYMENT } from "~/core/deployment";
import {
  createSimpleNonce,
  GUESTBOOK_CONTRACT_ID,
  GUESTBOOK_CONTRACT_METHODS,
} from "~/pages/meteor-sdk-test/guestbook";
import { ActionList, ActionRow } from "./ActionRow";
import { NewKeyTransferTest } from "./NewKeyTransferTest";
import { explorerAccountUrl, type TNearNetwork } from "./results/resultsModel";
import {
  ActionResultsPanel,
  ActionResultsProvider,
  ResultToast,
  useActionResults,
  useLatestActionResult,
} from "./results/ActionResultsUi";
import {
  describeExecutionTarget,
  summarizeSignedMessage,
  summarizeSignIn,
  summarizeSignInAndSignMessage,
  summarizeSignOut,
} from "./results/summaries";
import { StagedAccountsPanel } from "./StagedAccountsPanel";
import {
  ActionButton,
  Chip,
  CollapsibleSection,
  cx,
  ExternalIcon,
  Notice,
  Section,
  SegmentedControl,
  Spinner,
} from "./ui";
import { WalletActionsPanel } from "./WalletActionsPanel";

const LOCAL_BACKEND_URL = "http://localhost:8787";

/**
 * Backend selection via URL, read once at init — the SDK pins its config per instance
 * (`mobile_bridge_config_mismatch` on change), so switching backends is a full navigation, not a
 * live toggle.
 *
 *   (default)             this deployment kind's backend (`DEPLOYMENT.bridgeBackend`)
 *   ?backend=local        the mc_backend worker (`wrangler dev`, :8787) from ../meteor-connect-bridge
 *   ?backend=development  the development backend
 *   ?backend=production   the production backend
 *   ?backend=<url>        anything else, verbatim
 *
 * An override changes only the backend: the mobile app id stays the deployment kind's, so pairing
 * a production mobile wallet through the development backend (or the reverse) is on the tester.
 */
const resolveBackendUrl = (): string => {
  const deploymentDefault = METEOR_CONNECT_BACKENDS[DEPLOYMENT.bridgeBackend];
  if (typeof window === "undefined") return deploymentDefault;
  const requested = new URLSearchParams(window.location.search).get("backend");
  if (requested == null) return deploymentDefault;
  if (requested === "local") return LOCAL_BACKEND_URL;
  if (requested === "production") return METEOR_CONNECT_BACKENDS.production;
  if (requested === "development") return METEOR_CONNECT_BACKENDS.development;
  return requested;
};

const MOBILE_BRIDGE_BACKEND_URL = resolveBackendUrl();
const MOBILE_BRIDGE_APP_ID = DEPLOYMENT.mobileAppId;
const MOBILE_BRIDGE_DEEP_LINK = DEPLOYMENT.mobileDeepLink;
/**
 * `?autoOpen=off` disables the SDK's same-device auto-open of Meteor Mobile, so both behaviours
 * can be compared on a phone. Read once at init for the same reason as `?backend=`.
 */
const AUTO_OPEN_PAIRED_WALLET =
  typeof window === "undefined" ||
  new URLSearchParams(window.location.search).get("autoOpen") !== "off";

const meteorConnectClient =
  (import.meta.hot?.data.meteorConnectClient as MeteorConnect | undefined) ?? new MeteorConnect();

if (import.meta.hot) {
  import.meta.hot.data.meteorConnectClient = meteorConnectClient;
}

const initializedMeteorConnect = async (): Promise<MeteorConnect> => {
  if (typeof window === "undefined") {
    throw new Error("MeteorConnect must be initialized in the browser");
  }

  await meteorConnectClient.initialize({
    storage: webpage_local_storage,
    mobileBridge: {
      enabled: true,
      backendUrl: MOBILE_BRIDGE_BACKEND_URL,
      meteorAppId: MOBILE_BRIDGE_APP_ID,
      autoOpenPairedWallet: AUTO_OPEN_PAIRED_WALLET,
      partnerMetadata: {
        name: "Meteor SDK test web",
        description: "Development harness for the Meteor Connect mobile bridge",
        iconUrl: `${window.location.origin}/favicon.ico`,
        originUrl: window.location.origin,
      },
      transferAccounts: {
        // Dark by default in the SDK — the test harness opts in explicitly.
        enabled: true,
        // TEST HARNESS ONLY: persists staged secrets as plaintext in this origin's
        // localStorage so test runs are repeatable. Never do this with mainnet key material.
        persistStagedAccounts: true,
        // Default targets follow the mobile app id (mobile_dev → meteor_wallet_web_dev).
        // Uncomment to test against the local mc_backend demo wallet instead:
        // meteorAppIds: [EMeteorAppId.meteor_bridge_test_web],
        // TEST HARNESS ONLY: stage far beyond the 50-per-transfer protocol bound so volume
        // testing isn't capped (see StagedAccountsPanel). Still required by the new-key flow:
        // this config gates the transfer execution targets for both transfer action families.
        maxStagedAccounts: 250,
      },
    },
  });

  return meteorConnectClient;
};

const queryClient = new QueryClient();

export const MeteorConnectTest = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ActionResultsProvider>
        <MeteorConnectTestInner />
      </ActionResultsProvider>
    </QueryClientProvider>
  );
};

const PageShell = ({ children }: { children: ReactNode }) => (
  <main className={"w-full max-w-6xl px-4 pb-28 sm:px-5"}>{children}</main>
);

const MeteorConnectTestInner = () => {
  const meteorConnectQuery = useQuery({
    queryKey: ["meteor-connect", "mobile-bridge", MOBILE_BRIDGE_APP_ID],
    queryFn: initializedMeteorConnect,
    enabled: typeof window !== "undefined",
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });

  if (meteorConnectQuery.isError) {
    const errorMessage =
      meteorConnectQuery.error instanceof Error
        ? meteorConnectQuery.error.message
        : String(meteorConnectQuery.error);

    return (
      <PageShell>
        <Section title={"Meteor Connect initialization failed"}>
          <div className={"flex flex-col items-start gap-3"}>
            <Notice tone={"danger"}>
              <span className={"font-mono text-xs break-all"}>{errorMessage}</span>
            </Notice>
            {/*
              Retry IN PROCESS, on the same `MeteorConnect` instance — that is the recovery a real
              integration has. Offering only a page reload hid whether the SDK could recover at all,
              which is how the sticky-rejection bug went unnoticed
              (REVIEW-consumer-implementation H-01/M-04).
            */}
            <ActionButton
              pending={meteorConnectQuery.isFetching}
              pendingLabel={"Retrying…"}
              onClick={() => void meteorConnectQuery.refetch()}
            >
              Retry initialization
            </ActionButton>
            <details className={"text-sm text-slate-500 dark:text-slate-400"}>
              <summary className={"cursor-pointer"}>Reload the whole harness instead</summary>
              <p className={"mt-2"}>
                A reload throws away every in-memory client, so it proves nothing about whether the
                SDK can recover on its own. Use it only if the retry above keeps failing.
              </p>
              <div className={"mt-2"}>
                <ActionButton variant={"secondary"} onClick={() => window.location.reload()}>
                  Reload test harness
                </ActionButton>
              </div>
            </details>
          </div>
        </Section>
      </PageShell>
    );
  }

  if (meteorConnectQuery.data == null) {
    return (
      <PageShell>
        <div className={"flex items-center gap-3 py-10 text-sm text-slate-600 dark:text-slate-300"}>
          <Spinner /> Initializing Meteor Connect mobile bridge…
        </div>
      </PageShell>
    );
  }

  return <MeteorConnectTestInitialized meteorConnect={meteorConnectQuery.data} />;
};

const NETWORK_OPTIONS = [
  { value: "testnet", label: "Testnet" },
  { value: "mainnet", label: "Mainnet" },
] as const;

const MeteorConnectTestInitialized = ({ meteorConnect }: { meteorConnect: MeteorConnect }) => {
  const [network, setNetwork] = useState<TNearNetwork>("testnet");
  const { run } = useActionResults();
  const signOut = useLatestActionResult("near::sign_out");

  const accountQuery = useQuery({
    queryKey: ["getAccount", network],
    queryFn: async () => {
      return {
        account: await meteorConnect.getAccount({
          blockchain: "near",
          network,
        }),
      };
    },
  });

  const account = accountQuery.data?.account;
  const refetchAccount = () => accountQuery.refetch({ cancelRefetch: true });

  return (
    <PageShell>
      {/*
        Mobile order: connection → actions → results → transfer tools. On large screens the results
        log moves to a sticky right-hand column so it stays in view whatever is being tested.
      */}
      <div className={"grid gap-4 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-start lg:gap-5"}>
        <ConnectionCard
          className={"lg:col-start-1"}
          account={account}
          checking={accountQuery.isPending}
          network={network}
          onSelectNetwork={setNetwork}
          signOutPending={signOut.pending}
          onSignOut={async () => {
            if (account == null) return;
            await run({
              key: "near::sign_out",
              label: "Sign out",
              actionId: "near::sign_out",
              accountId: account.identifier.accountId,
              network,
              execute: async () => {
                const action = await meteorConnect.createAction({
                  id: "near::sign_out",
                  input: { target: account.identifier },
                });
                return action.promptForExecution();
              },
              summarize: summarizeSignOut,
            });
            await refetchAccount();
          }}
        />

        <div className={"min-w-0 lg:col-start-1"}>
          {account == null ? (
            <SignInPanel
              meteorConnect={meteorConnect}
              network={network}
              onAccountChanged={refetchAccount}
            />
          ) : (
            <WalletActionsPanel account={account} meteorConnect={meteorConnect} />
          )}
        </div>

        <ActionResultsPanel
          className={
            "lg:sticky lg:top-4 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:max-h-[calc(100dvh-2rem)]"
          }
        />

        <CollapsibleSection
          className={"lg:col-start-1"}
          storageKey={"meteor_connect_test.transfer_tools_open"}
          defaultOpen
          title={"Account transfer (new-key)"}
          description={
            "Stage source accounts, then move them into Meteor Wallet without their secrets leaving this page."
          }
        >
          <StagedAccountsPanel meteorConnect={meteorConnect} network={network} />
          <NewKeyTransferTest meteorConnect={meteorConnect} />
        </CollapsibleSection>
      </div>
      <ResultToast />
    </PageShell>
  );
};

//
// CONNECTION
//

type TBackendChoice = "local" | "development" | "production" | "custom";

const currentBackendChoice = (): TBackendChoice => {
  if (
    MOBILE_BRIDGE_BACKEND_URL.includes("localhost") ||
    MOBILE_BRIDGE_BACKEND_URL.includes("127.0.0.1")
  ) {
    return "local";
  }
  if (MOBILE_BRIDGE_BACKEND_URL === METEOR_CONNECT_BACKENDS.production) return "production";
  if (MOBILE_BRIDGE_BACKEND_URL === METEOR_CONNECT_BACKENDS.development) return "development";
  return "custom";
};

// The deployment kind's backend is the default, so it is the absence of the param, not a value.
const switchBackend = (target: Exclude<TBackendChoice, "custom">) => {
  const url = new URL(window.location.href);
  if (target === DEPLOYMENT.bridgeBackend) url.searchParams.delete("backend");
  else url.searchParams.set("backend", target);
  window.location.href = url.toString();
};

const switchAutoOpen = (enabled: boolean) => {
  const url = new URL(window.location.href);
  if (enabled) url.searchParams.delete("autoOpen");
  else url.searchParams.set("autoOpen", "off");
  window.location.href = url.toString();
};

const AUTO_OPEN_OPTIONS = [
  { value: "on", label: "On" },
  { value: "off", label: "Off" },
] as const;

const BACKEND_OPTIONS = [
  { value: "local", label: "Local" },
  { value: "development", label: "Dev" },
  { value: "production", label: "Prod" },
] as const;

const ConnectionCard = ({
  className,
  account,
  checking,
  network,
  onSelectNetwork,
  onSignOut,
  signOutPending,
}: {
  className?: string;
  account?: IMeteorConnectAccount;
  checking: boolean;
  network: TNearNetwork;
  onSelectNetwork: (network: TNearNetwork) => void;
  onSignOut: () => void;
  signOutPending: boolean;
}) => {
  const executionTarget = account?.connection.executionTarget;
  const isLegacyAccount =
    executionTarget === "v1_web" ||
    executionTarget === "v1_web_localhost" ||
    executionTarget === "v1_ext";
  const backendChoice = currentBackendChoice();
  const functionCallKeys = account?.publicKeys.filter((key) => key.meta?.addFunctionCallKey) ?? [];

  return (
    <Section
      className={className}
      title={"Meteor Connect"}
      description={`Bare SDK harness · ${DEPLOYMENT.kind === "production" ? "prod" : "dev"} bridge`}
      aside={
        <SegmentedControl
          ariaLabel={"Network"}
          value={network}
          options={NETWORK_OPTIONS}
          onChange={onSelectNetwork}
        />
      }
    >
      <div className={"flex flex-col gap-4"}>
        <div
          className={
            "flex flex-col gap-3 rounded-xl bg-slate-50 p-3 sm:flex-row sm:items-center dark:bg-slate-950/50"
          }
        >
          <div className={"flex min-w-0 flex-1 items-start gap-3"}>
            <span
              aria-hidden
              className={cx(
                "mt-1.5 size-2.5 shrink-0 rounded-full",
                checking
                  ? "animate-pulse bg-slate-400"
                  : account != null
                    ? "bg-emerald-500 ring-4 ring-emerald-500/20"
                    : "bg-slate-300 dark:bg-slate-600",
              )}
            />
            <div className={"min-w-0"}>
              {checking ? (
                <p className={"text-sm text-slate-600 dark:text-slate-300"}>Checking session…</p>
              ) : account == null ? (
                <>
                  <p className={"text-sm font-medium text-slate-900 dark:text-slate-100"}>
                    Not signed in on {network}
                  </p>
                  <p className={"text-xs text-slate-500 dark:text-slate-400"}>
                    Pick a sign-in option below — the popup offers Meteor Mobile, Web and Extension.
                  </p>
                </>
              ) : (
                <>
                  <a
                    href={explorerAccountUrl(network, account.identifier.accountId)}
                    target={"_blank"}
                    rel={"noreferrer"}
                    className={
                      "inline-flex max-w-full items-center gap-1 text-base font-semibold break-all text-slate-900 hover:underline dark:text-slate-100"
                    }
                  >
                    {account.identifier.accountId}
                    <ExternalIcon className={"size-3.5 shrink-0 text-slate-400"} />
                  </a>
                  <div className={"mt-1.5 flex flex-wrap gap-1.5"}>
                    <Chip tone={executionTarget === "v2_bridge_mobile" ? "green" : "blue"}>
                      {describeExecutionTarget(account.connection.executionTarget)}
                    </Chip>
                    <Chip>{network}</Chip>
                    {functionCallKeys.map((key) => (
                      <Chip key={key.publicKey}>
                        Key for {key.meta.addFunctionCallKey.contractId}
                      </Chip>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          {account != null && (
            <ActionButton
              variant={"danger"}
              pending={signOutPending}
              pendingLabel={"Signing out…"}
              onClick={onSignOut}
            >
              Sign out
            </ActionButton>
          )}
        </div>

        {isLegacyAccount && (
          <Notice tone={"warn"}>
            This account is bound to the legacy {executionTarget} client. Sign out and sign in
            through Meteor Mobile to test push-notification requests and the QR fallback for account
            actions.
          </Notice>
        )}

        {backendChoice === "production" && (
          <Notice tone={"warn"}>
            Using the <b>production</b> bridge backend
            {DEPLOYMENT.bridgeBackend === "production" ? " (this deployment's default)" : ""} — real
            user sessions live here. A CORS error on bridge creation has meant the Cloudflare edge
            (WAF on <code>mc.meteorwallet.app</code>) blocked the preflight, not the worker.
          </Notice>
        )}

        <details className={"group"}>
          <summary
            className={
              "inline-flex min-h-9 cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 [&::-webkit-details-marker]:hidden"
            }
          >
            <span className={"transition-transform group-open:rotate-90"} aria-hidden>
              ›
            </span>
            Bridge &amp; backend
          </summary>
          <div className={"mt-2 flex flex-col gap-3"}>
            <div className={"flex flex-wrap items-center gap-3"}>
              <span className={"text-xs font-medium text-slate-600 dark:text-slate-400"}>
                Bridge backend
              </span>
              <SegmentedControl<TBackendChoice>
                ariaLabel={"Bridge backend"}
                value={backendChoice}
                options={BACKEND_OPTIONS}
                onChange={(choice) => {
                  if (choice !== "custom" && choice !== backendChoice) switchBackend(choice);
                }}
              />
              <span className={"text-xs text-slate-500 dark:text-slate-400"}>
                (reloads the page)
              </span>
            </div>
            {backendChoice === "local" && (
              <p className={"text-xs text-slate-500 dark:text-slate-400"}>
                Run the local backend with <code>bun dev</code> in{" "}
                <code>../meteor-connect-bridge/packages/meteor-connect-backend</code>.
              </p>
            )}
            <div className={"flex flex-wrap items-center gap-3"}>
              <span className={"text-xs font-medium text-slate-600 dark:text-slate-400"}>
                Auto-open Meteor Mobile
              </span>
              <SegmentedControl<"on" | "off">
                ariaLabel={"Auto-open Meteor Mobile"}
                value={AUTO_OPEN_PAIRED_WALLET ? "on" : "off"}
                options={AUTO_OPEN_OPTIONS}
                onChange={(choice) => {
                  if ((choice === "on") !== AUTO_OPEN_PAIRED_WALLET)
                    switchAutoOpen(choice === "on");
                }}
              />
              <span className={"text-xs text-slate-500 dark:text-slate-400"}>
                (reloads the page)
              </span>
            </div>
            <p className={"text-xs text-slate-500 dark:text-slate-400"}>
              For a Meteor Mobile account on a phone, a request started by a tap opens the app
              directly — once this browser has opened that wallet&apos;s app before (tap Open Meteor
              Mobile once). Otherwise the push and the Open button work as before.
            </p>
            <dl className={"grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[auto_1fr]"}>
              {[
                ["Backend", MOBILE_BRIDGE_BACKEND_URL],
                ["Deep link", MOBILE_BRIDGE_DEEP_LINK],
                ["Mobile app", MOBILE_BRIDGE_APP_ID],
                ["Web wallet", DEPLOYMENT.webWalletUrl],
                ["Account route", executionTarget ?? "not signed in"],
              ].map(([label, value]) => (
                <div key={label} className={"contents"}>
                  <dt className={"text-xs text-slate-500 sm:text-sm dark:text-slate-400"}>
                    {label}
                  </dt>
                  <dd
                    className={
                      "mb-1 font-mono text-xs break-all text-slate-800 sm:mb-0 dark:text-slate-200"
                    }
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className={"text-xs text-slate-500 dark:text-slate-400"}>
              {executionTarget === "v2_bridge_mobile"
                ? "This account is mobile-bound: account actions should attempt push delivery immediately and keep the QR/deep-link fallback visible."
                : "Signing in should immediately show the Meteor Mobile panel (QR pairing), with the Web App and Chrome Extension choices still available."}
            </p>
          </div>
        </details>
      </div>
    </Section>
  );
};

//
// SIGN IN
//

const KEY_SIGN_IN = "near::sign_in";
const KEY_SIGN_IN_GUESTBOOK = "near::sign_in:guestbook";
const KEY_SIGN_IN_AND_MESSAGE = "near::sign_in_and_sign_message";
const KEY_SIGN_IN_THEN_SIGN_IN = "sign_in_then_message:sign_in";
const KEY_SIGN_IN_THEN_MESSAGE = "sign_in_then_message:sign_message";

const SignInPanel = ({
  meteorConnect,
  network,
  onAccountChanged,
}: {
  meteorConnect: MeteorConnect;
  network: TNearNetwork;
  onAccountChanged: () => Promise<unknown>;
}) => {
  const { run } = useActionResults();
  const plain = useLatestActionResult(KEY_SIGN_IN);
  const guestbook = useLatestActionResult(KEY_SIGN_IN_GUESTBOOK);
  const withMessage = useLatestActionResult(KEY_SIGN_IN_AND_MESSAGE);
  const thenSignIn = useLatestActionResult(KEY_SIGN_IN_THEN_SIGN_IN);
  const thenMessage = useLatestActionResult(KEY_SIGN_IN_THEN_MESSAGE);
  const anyPending =
    plain.pending || guestbook.pending || withMessage.pending || thenSignIn.pending;

  const signIn = (key: string, label: string, withGuestbookKey: boolean) =>
    run({
      key,
      label,
      actionId: "near::sign_in",
      network,
      execute: async () => {
        const action = await meteorConnect.createAction({
          id: "near::sign_in",
          input: {
            target: { blockchain: "near", network },
            ...(withGuestbookKey
              ? {
                  addFunctionCallKey: {
                    contractId: GUESTBOOK_CONTRACT_ID,
                    allowMethods: { anyMethod: false, methodNames: GUESTBOOK_CONTRACT_METHODS },
                  },
                }
              : {}),
          },
        });
        return action.promptForExecution();
      },
      summarize: summarizeSignIn,
    });

  return (
    <Section
      title={"Sign in"}
      description={`Every option opens the Meteor Connect popup for ${network}.`}
    >
      <ActionList>
        <ActionRow
          title={"Sign in"}
          description={"Plain sign-in — no function-call key is added."}
          resultKeys={[KEY_SIGN_IN]}
          actions={
            <ActionButton
              pending={plain.pending}
              pendingLabel={"Waiting for wallet…"}
              disabled={anyPending}
              onClick={async () => {
                await signIn(KEY_SIGN_IN, "Sign in", false);
                await onAccountChanged();
              }}
            >
              Sign in
            </ActionButton>
          }
        />
        <ActionRow
          title={"Sign in to Guestbook"}
          description={`Also adds a function-call key for ${GUESTBOOK_CONTRACT_ID} (${GUESTBOOK_CONTRACT_METHODS.join(", ")}).`}
          resultKeys={[KEY_SIGN_IN_GUESTBOOK]}
          actions={
            <ActionButton
              pending={guestbook.pending}
              pendingLabel={"Waiting for wallet…"}
              disabled={anyPending}
              onClick={async () => {
                await signIn(KEY_SIGN_IN_GUESTBOOK, "Sign in to Guestbook", true);
                await onAccountChanged();
              }}
            >
              Sign in with key
            </ActionButton>
          }
        />
        <ActionRow
          title={"Sign in + sign message"}
          description={"One request: sign in and sign a NEP-413 message together."}
          resultKeys={[KEY_SIGN_IN_AND_MESSAGE]}
          actions={
            <ActionButton
              pending={withMessage.pending}
              pendingLabel={"Waiting for wallet…"}
              disabled={anyPending}
              onClick={async () => {
                const messageParams = {
                  message: "hello",
                  nonce: createSimpleNonce(),
                  recipient: GUESTBOOK_CONTRACT_ID,
                };
                await run({
                  key: KEY_SIGN_IN_AND_MESSAGE,
                  label: "Sign in + sign message",
                  actionId: "near::sign_in_and_sign_message",
                  network,
                  execute: async () => {
                    const action = await meteorConnect.createAction({
                      id: "near::sign_in_and_sign_message",
                      input: { messageParams, target: { blockchain: "near", network } },
                    });
                    return action.promptForExecution();
                  },
                  summarize: (output) => summarizeSignInAndSignMessage(output, messageParams),
                });
                await onAccountChanged();
              }}
            >
              Sign in + sign
            </ActionButton>
          }
        />
        <ActionRow
          title={"Sign in, then sign message"}
          description={
            "Two back-to-back requests: tests a second wallet prompt straight after sign-in."
          }
          resultKeys={[KEY_SIGN_IN_THEN_SIGN_IN, KEY_SIGN_IN_THEN_MESSAGE]}
          actions={
            <ActionButton
              pending={thenSignIn.pending || thenMessage.pending}
              pendingLabel={
                thenMessage.pending ? "Waiting for 2nd request…" : "Waiting for wallet…"
              }
              disabled={anyPending}
              onClick={async () => {
                const signedIn = await signIn(KEY_SIGN_IN_THEN_SIGN_IN, "Sign in (1 of 2)", false);
                if (!signedIn.ok) return;

                const messageParams = {
                  message: "Immediate sign message after sign in",
                  nonce: createSimpleNonce(),
                  recipient: GUESTBOOK_CONTRACT_ID,
                };
                const accountId = signedIn.output.identifier.accountId;
                // Refreshing swaps this panel for the signed-in view; the second request keeps
                // reporting into the shared log (and toast) regardless.
                await onAccountChanged();
                await run({
                  key: KEY_SIGN_IN_THEN_MESSAGE,
                  label: "Sign message (2 of 2)",
                  actionId: "near::sign_message",
                  accountId,
                  network,
                  execute: async () => {
                    const action = await meteorConnect.createAction({
                      id: "near::sign_message",
                      input: { messageParams, target: signedIn.output.identifier },
                    });
                    return action.promptForExecution();
                  },
                  summarize: (signed) => summarizeSignedMessage(signed, messageParams, accountId),
                });
              }}
            >
              Sign in, then sign
            </ActionButton>
          }
        />
      </ActionList>
    </Section>
  );
};

if (import.meta.hot) {
  import.meta.hot.accept("@meteorwallet/sdk", () => {
    // MeteorConnect owns stateful bridge clients, so SDK updates require a clean client instance.
    window.location.reload();
  });
}
