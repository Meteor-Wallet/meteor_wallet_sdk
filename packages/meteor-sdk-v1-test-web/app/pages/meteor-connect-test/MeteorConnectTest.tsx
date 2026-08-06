import type { IMeteorConnectAccount } from "@meteorwallet/sdk";
import { EMeteorAppId, MeteorConnect, webpage_local_storage } from "@meteorwallet/sdk";
import { actionCreators } from "@near-js/transactions";
import { parseNearAmount } from "@near-js/utils";
import { QueryClient, QueryClientProvider, useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  AddMessageComponent,
  type IAddMessageParams,
} from "~/components/wallet_actions/AddMessageComponent.tsx";
import {
  createSimpleNonce,
  GUESTBOOK_CONTRACT_ID,
  GUESTBOOK_CONTRACT_METHODS,
} from "~/pages/meteor-sdk-test/guestbook";
import { NetworkSelector } from "~/pages/near-connect/NetworkSelector";
import { Button } from "~/ui/Button";
import { SignDelegateActionTest } from "./SignDelegateActionTest";
import { TransferAccountsTest } from "./TransferAccountsTest";

const PRODUCTION_BACKEND_URL = "https://mc.meteorwallet.app";
const LOCAL_BACKEND_URL = "http://localhost:8787";

/**
 * Backend selection via URL (?backend=local | ?backend=<url>), read once at init — the SDK pins
 * its config per instance (`mobile_bridge_config_mismatch` on change), so switching backends is
 * a full navigation, not a live toggle. Local = the mc_backend worker (`wrangler dev`, :8787)
 * from ../meteor-connect-bridge. Note (2026-08-06): production `mc.meteorwallet.app` hard-blocks
 * requests at the Cloudflare edge (WAF "you have been blocked" page, even on OPTIONS preflights,
 * which surfaces in the browser as a CORS failure) — zone security config, not worker code.
 */
const resolveBackendUrl = (): string => {
  if (typeof window === "undefined") return PRODUCTION_BACKEND_URL;
  const requested = new URLSearchParams(window.location.search).get("backend");
  if (requested == null) return PRODUCTION_BACKEND_URL;
  return requested === "local" ? LOCAL_BACKEND_URL : requested;
};

const MOBILE_BRIDGE_BACKEND_URL = resolveBackendUrl();
const MOBILE_BRIDGE_APP_ID = EMeteorAppId.meteor_wallet_mobile_dev;
const MOBILE_BRIDGE_DEEP_LINK = "meteorwalletdev://bridge_request";

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
      },
    },
  });

  return meteorConnectClient;
};

const queryClient = new QueryClient();

export const MeteorConnectTest = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <MeteorConnectTestInner />
    </QueryClientProvider>
  );
};

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
      <div className={"p-5 flex flex-col gap-3 items-start"}>
        <h1>Meteor Connect initialization failed</h1>
        <p className={"text-red-700"}>{errorMessage}</p>
        <Button onClick={() => window.location.reload()}>Reload test harness</Button>
      </div>
    );
  }

  if (meteorConnectQuery.data == null) {
    return <div className={"p-5"}>Initializing Meteor Connect mobile bridge...</div>;
  }

  return <MeteorConnectTestInitialized meteorConnect={meteorConnectQuery.data} />;
};

const MeteorConnectTestInitialized = ({ meteorConnect }: { meteorConnect: MeteorConnect }) => {
  const [network, setNetwork] = useState<"testnet" | "mainnet">("testnet");
  // const [account, setAccount] = useState<IMeteorConnectAccount | undefined>();

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

  console.log("Current account:", account);

  return (
    <div className={"p-5"}>
      <h1>Meteor Connect (bare Meteor SDK) Test</h1>
      <MobileBridgeTestInfo account={account} />
      <NetworkSelector
        network={network}
        onSelectNetwork={(network) => {
          setNetwork(network);
        }}
      />
      <TransferAccountsTest
        meteorConnect={meteorConnect}
        network={network}
        backendUrl={MOBILE_BRIDGE_BACKEND_URL}
      />
      {account == null ? (
        <div className={"p-5 flex flex-row flex-wrap gap-5 items-start"}>
          <Button
            onClick={async () => {
              const signInAction = await meteorConnect.createAction({
                id: "near::sign_in",
                input: {
                  target: {
                    blockchain: "near",
                    network,
                  },
                },
              });

              await signInAction.promptForExecution();

              await accountQuery.refetch({ cancelRefetch: true });
            }}
          >
            Sign In (No contract)
          </Button>
          <Button
            onClick={async () => {
              const signInAction = await meteorConnect.createAction({
                id: "near::sign_in",
                input: {
                  target: {
                    blockchain: "near",
                    network,
                  },
                  addFunctionCallKey: {
                    contractId: GUESTBOOK_CONTRACT_ID,
                    allowMethods: {
                      anyMethod: false,
                      methodNames: GUESTBOOK_CONTRACT_METHODS,
                    },
                  },
                },
              });

              await signInAction.promptForExecution();

              await accountQuery.refetch({ cancelRefetch: true });
            }}
          >
            Sign In To Guestbook
          </Button>
          <Button
            onClick={async () => {
              const signInWithMessageAction = await meteorConnect.createAction({
                id: "near::sign_in_and_sign_message",
                input: {
                  messageParams: {
                    message: "hello",
                    nonce: createSimpleNonce(),
                    recipient: GUESTBOOK_CONTRACT_ID,
                  },
                  target: {
                    blockchain: "near",
                    network,
                  },
                },
              });

              const response = await signInWithMessageAction.promptForExecution();

              console.log("Signed in with signed message:", response);

              await accountQuery.refetch({ cancelRefetch: true });
            }}
          >
            Sign In And Sign Message (1 action)
          </Button>
          <Button
            onClick={async () => {
              const signInAction = await meteorConnect.createAction({
                id: "near::sign_in",
                input: {
                  target: {
                    blockchain: "near",
                    network,
                  },
                },
              });

              const newAccount = await signInAction.promptForExecution();

              await accountQuery.refetch({ cancelRefetch: true });

              const signMessageAction = await meteorConnect.createAction({
                id: "near::sign_message",
                input: {
                  messageParams: {
                    message: "Immediate sign message after sign in",
                    nonce: createSimpleNonce(),
                    recipient: GUESTBOOK_CONTRACT_ID,
                  },
                  target: newAccount.identifier,
                },
              });

              console.log("Prompting for sign message action immediately after sign in...");

              const signedMessage = await signMessageAction.promptForExecution();

              console.log("Signed message:", signedMessage);
            }}
          >
            Sign In and Sign Message (2 actions)
          </Button>
        </div>
      ) : (
        <>
          <Button
            onClick={async () => {
              const action = await meteorConnect.createAction({
                id: "near::sign_out",
                input: {
                  target: account.identifier,
                },
              });

              await action.promptForExecution();

              await accountQuery.refetch({ cancelRefetch: true });
            }}
          >
            Sign Out
          </Button>
          <MeteorConnectWithAccount account={account} meteorConnect={meteorConnect} />
        </>
      )}
    </div>
  );
};

const MobileBridgeTestInfo = ({ account }: { account?: IMeteorConnectAccount }) => {
  const executionTarget = account?.connection.executionTarget;
  const isLegacyAccount =
    executionTarget === "v1_web" ||
    executionTarget === "v1_web_localhost" ||
    executionTarget === "v1_ext";

  return (
    <section
      className={
        "my-4 max-w-3xl rounded-md border border-sky-300 bg-sky-50 p-4 text-slate-900 dark:border-sky-700 dark:bg-slate-900 dark:text-slate-100"
      }
    >
      <h2 className={"font-semibold text-sky-950 dark:text-sky-100"}>
        Meteor Mobile development bridge is enabled
      </h2>
      <p>
        Opening a sign-in request should immediately show the <strong>Meteor Mobile</strong> panel,
        while the existing Web App and Chrome Extension choices remain available.
      </p>
      <dl className={"mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1"}>
        <dt className={"font-medium text-slate-700 dark:text-slate-300"}>Deep link</dt>
        <dd>
          <code
            className={
              "break-all rounded bg-white px-1 py-0.5 text-slate-900 dark:bg-slate-800 dark:text-sky-100"
            }
          >
            {MOBILE_BRIDGE_DEEP_LINK}
          </code>
        </dd>
        <dt className={"font-medium text-slate-700 dark:text-slate-300"}>Backend</dt>
        <dd>
          <code
            className={
              "break-all rounded bg-white px-1 py-0.5 text-slate-900 dark:bg-slate-800 dark:text-sky-100"
            }
          >
            {MOBILE_BRIDGE_BACKEND_URL}
          </code>
        </dd>
        <dt className={"font-medium text-slate-700 dark:text-slate-300"}>Current account route</dt>
        <dd>
          <code
            className={
              "break-all rounded bg-white px-1 py-0.5 text-slate-900 dark:bg-slate-800 dark:text-sky-100"
            }
          >
            {executionTarget ?? "not signed in"}
          </code>
        </dd>
      </dl>
      {isLegacyAccount ? (
        <p className={"mt-2 text-amber-800 dark:text-amber-300"}>
          This account is intentionally bound to the legacy {executionTarget} client. Sign out and
          sign in through Meteor Mobile to test subsequent push-notification requests and QR
          fallback for account actions.
        </p>
      ) : executionTarget === "v2_bridge_mobile" ? (
        <p className={"mt-2 text-emerald-800 dark:text-emerald-300"}>
          This account is mobile-bound. Account actions should attempt push delivery immediately and
          keep the QR/deep-link fallback visible.
        </p>
      ) : (
        <p className={"mt-2"}>
          Use any sign-in button below to test first-time QR pairing and the development app scheme.
        </p>
      )}
    </section>
  );
};

const SUGGESTED_DONATION = "0";
const BOATLOAD_OF_GAS = "30000000000000";

const MeteorConnectWithAccount = ({
  account,
  meteorConnect,
}: {
  account: IMeteorConnectAccount;
  meteorConnect: MeteorConnect;
}) => {
  const mutate_signMessage = useMutation({
    mutationKey: ["mutate_signMessage", account.identifier, account.publicKeys],
    mutationFn: async () => {
      const action = await meteorConnect.createAction({
        id: "near::sign_message",
        input: {
          messageParams: {
            message: "hello",
            nonce: createSimpleNonce(),
            recipient: GUESTBOOK_CONTRACT_ID,
          },
          target: account.identifier,
        },
      });

      const signed = await action.promptForExecution();
      console.log("Signed message:", signed);
      return signed;
    },
  });

  const mutate_addMessage = useMutation({
    mutationKey: ["mutate_addMessage", account.identifier],
    mutationFn: async (params: IAddMessageParams) => {
      const action = await meteorConnect.createAction({
        id: "near::sign_transactions",
        input: {
          target: account.identifier,
          transactions: [
            {
              actions: [
                actionCreators.functionCall(
                  "addMessage",
                  {
                    text: params.message,
                  },
                  BigInt(BOATLOAD_OF_GAS),
                  BigInt(parseNearAmount(params.donation)!),
                ),
              ],
              receiverId: GUESTBOOK_CONTRACT_ID,
            },
          ],
        },
      });

      return await action.promptForExecution();
    },
  });

  const mutate_signDelegateAction = useMutation({
    mutationKey: ["mutate_signDelegateAction", account.identifier],
    mutationFn: async (multiple: boolean) => {
      const action = await meteorConnect.createAction({
        id: "near::sign_delegate_actions",
        input: {
          target: account.identifier,
          delegateActions: [
            {
              receiverId: "pebble.testnet",
              actions: [actionCreators.transfer(BigInt(parseNearAmount("0.001")!))],
            },
            ...(multiple
              ? [
                  {
                    receiverId: "pebble.testnet",
                    actions: [actionCreators.transfer(BigInt(parseNearAmount("0.001")!))],
                  },
                ]
              : []),
          ],
        },
      });

      return await action.promptForExecution();
    },
  });

  const mutate_verifyOwner = useMutation({
    mutationKey: ["verify_owner", account.identifier],
    mutationFn: async () => {
      const action = await meteorConnect.createAction({
        id: "near::verify_owner",
        input: {
          target: account.identifier,
          message: "TEST",
        },
      });

      return await action.promptForExecution();
    },
  });

  return (
    <div className={"p-5 flex flex-col gap-5 items-start"}>
      <h1>{account.identifier.accountId} Signed In</h1>
      <Button
        onClick={async () => {
          const signedMessage = await mutate_signMessage.mutateAsync();
          console.log(signedMessage);
        }}
      >
        Sign Message
      </Button>
      <Button
        onClick={async () => {
          const verified = await mutate_verifyOwner.mutateAsync();
          console.log(verified);
        }}
      >
        Verify Owner
      </Button>
      <SignDelegateActionTest account={account} meteorConnect={meteorConnect} />
      <AddMessageComponent
        onPressAddMessage={async (params) => {
          console.log("Adding message");
          const response = await mutate_addMessage.mutateAsync(params);
          console.log("Sign message response", response);
        }}
      />
    </div>
  );
};

if (import.meta.hot) {
  import.meta.hot.accept("@meteorwallet/sdk", () => {
    // MeteorConnect owns stateful bridge clients, so SDK updates require a clean client instance.
    window.location.reload();
  });
}
