import {
  type SetupParams,
  useWalletSelector,
  WalletSelectorProvider,
} from "@near-wallet-selector/react-hook";
import { setupMeteorWallet } from "~/meteor-wallet/setup/setupMeteorWallet";
import "@near-wallet-selector/modal-ui/styles.css";
import { EMeteorWalletSignInType } from "@meteorwallet/sdk";
import { QueryClient, QueryClientProvider, useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useImmer } from "use-immer";
import {
  addMessage,
  createSimpleNonce,
  GUESTBOOK_CONTRACT_ID,
  getMessages,
  signTestMessage,
} from "~/meteor-sdk-test/guestbook";
import { createNativeMeteorWallet } from "~/meteor-wallet/setup/createNativeMeteorWallet";

const walletSelectorConfig: SetupParams = {
  network: "testnet",
  debug: true,
  modules: [setupMeteorWallet()],
  createAccessKeyFor: {
    contractId: GUESTBOOK_CONTRACT_ID,
    methodNames: [],
  },
};

const queryClient = new QueryClient();

export function MeteorSdkTest() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletSelectorProvider config={walletSelectorConfig}>
        <MeteorSdkTestInner />
      </WalletSelectorProvider>
    </QueryClientProvider>
  );
}

function MeteorSdkTestInner() {
  const walletSelector = useWalletSelector();

  const {
    signedAccountId: signedAccountIdWalletSelector,
    signOut: signOutWalletSelector,
    signIn: signInWalletSelector,
  } = walletSelector;

  const query_messages = useQuery({
    queryKey: ["get_messages"],
    queryFn: async () => {
      return getMessages(walletSelector);
    },
  });

  const query_nativeMeteorSdk = useQuery({
    queryKey: ["get_native_meteor_sdk"],
    queryFn: async () => {
      return await createNativeMeteorWallet();
    },
  });

  const nativeMeteorWallet = query_nativeMeteorSdk.data?.wallet!;

  const [useMeteorSdkDirectly, setUseNativeSdkDirectly] = useState(false);
  const [signedAccountId, setSignedInAccountId] = useState<string | undefined | null>(undefined);

  useEffect(() => {
    if (nativeMeteorWallet != null && useMeteorSdkDirectly) {
      setSignedInAccountId(nativeMeteorWallet.getAccountId());
    } else {
      setSignedInAccountId(signedAccountIdWalletSelector);
    }
  }, [nativeMeteorWallet, useMeteorSdkDirectly, signedAccountIdWalletSelector]);

  const [testState, updateTestState] = useImmer({
    message: "",
    donation: "0.001",
    withDonation: false,
    multiple: false,
  });

  const mutate_addMessageWalletSelector = useMutation({
    mutationKey: ["add_message_wallet_selector", testState],
    mutationFn: async () => {
      return addMessage(walletSelector, {
        ...testState,
        donation: testState.withDonation ? testState.donation : "0",
      });
    },
  });

  const mutate_signMessageWalletSelector = useMutation({
    mutationKey: ["sign_test_message_wallet_selector", testState],
    mutationFn: async () => {
      return signTestMessage(walletSelector);
    },
  });

  const mutate_signMessage = useMutation({
    mutationKey: ["sign_test_message", useMeteorSdkDirectly],
    mutationFn: async () => {
      if (useMeteorSdkDirectly) {
        const response = await nativeMeteorWallet.signMessage({
          message: "hello!",
          accountId: nativeMeteorWallet.getAccountId(),
          nonce: createSimpleNonce(),
          recipient: GUESTBOOK_CONTRACT_ID,
        });

        console.log("Meteor Native SDK signMessage response", response);

        if (response.success) {
          return response.payload;
        } else {
          throw new Error(`Couldn't sign message owner: ${response.message}`);
        }
      } else {
        return await mutate_signMessageWalletSelector.mutateAsync();
      }
    },
  });

  const mutate_addMessage = useMutation({
    mutationKey: ["add_message", useMeteorSdkDirectly, testState],
    mutationFn: async () => {
      return await mutate_addMessageWalletSelector.mutateAsync();
    },
  });

  const signIn = () => {
    if (useMeteorSdkDirectly) {
      nativeMeteorWallet
        .requestSignIn({
          type: EMeteorWalletSignInType.ALL_METHODS,
          contract_id: GUESTBOOK_CONTRACT_ID,
        })
        .then((r) => {
          if (r.success) {
            setSignedInAccountId(r.payload.accountId);
          } else {
            setSignedInAccountId(undefined);
          }
        });
    } else {
      signInWalletSelector();
    }
  };

  const signOut = async () => {
    if (useMeteorSdkDirectly) {
      nativeMeteorWallet.signOut().then(() => {
        setSignedInAccountId(undefined);
      });
    } else {
      await signOutWalletSelector();
    }
  };

  return (
    <main className="flex items-center justify-center pt-16 pb-4">
      <div className="flex-1 flex flex-col items-center gap-16 min-h-0">
        <div className="w-full space-y-6 px-4">
          <nav className="rounded-3xl border border-gray-200 p-6 dark:border-gray-700 space-y-4 flex flex-col items-start">
            <div className={"flex items-center gap-2"}>
              <label htmlFor={"useMeteorSdkDirectly"} className={"text-sm"}>
                Use Meteor Native SDK Directly
              </label>
              <input
                id={"useMeteorSdkDirectly"}
                name="useMeteorSdkDirectly"
                type="checkbox"
                checked={useMeteorSdkDirectly}
                onChange={(e) => {
                  setUseNativeSdkDirectly(e.target.checked);
                }}
              />
            </div>
            <ul>
              {signedAccountId == null ? (
                <button
                  className={
                    "w-full rounded-3xl bg-blue-600 text-white py-2 px-4 hover:bg-blue-700 transition-colors"
                  }
                  onClick={() => {
                    signIn();
                  }}
                >
                  Sign In
                </button>
              ) : (
                <button
                  className={
                    "w-full rounded-3xl bg-red-600 text-white py-2 px-4 hover:bg-red-700 transition-colors"
                  }
                  onClick={signOut}
                >
                  Sign Out
                </button>
              )}
            </ul>
          </nav>
          {signedAccountId != null && (
            <div className="rounded-3xl border border-gray-200 p-6 dark:border-gray-700 space-y-4">
              <h2 className="text-xl font-semibold">Signed-in Account ID</h2>
              <p className="text-gray-700 dark:text-gray-300">{signedAccountId}</p>
            </div>
          )}
          <div className="rounded-3xl border border-gray-200 p-6 dark:border-gray-700 space-y-4">
            <button
              disabled={mutate_signMessage.isPending}
              onClick={async () => {
                await mutate_signMessage.mutateAsync();
              }}
              className={"rounded-3xl bg-blue-600 text-white py-2 px-4"}
            >
              {mutate_addMessage.isPending ? "Requesting..." : "Sign Test Message"}
            </button>
          </div>
          <div className="rounded-3xl border border-gray-200 p-6 dark:border-gray-700 space-y-4">
            <h2 className="text-xl font-semibold">Add Message</h2>
            <div className="flex flex-col gap-2 items-start">
              <input
                type="text"
                placeholder="Message"
                className="rounded-3xl border border-gray-200 p-2 dark:border-gray-700"
                value={testState.message}
                onChange={(e) => {
                  updateTestState((draft) => {
                    draft.message = e.target.value;
                  });
                }}
              />
              <div className={"flex items-center gap-2"}>
                <label htmlFor={"withDonation"} className={"text-sm"}>
                  Donation
                </label>
                <input
                  id={"withDonation"}
                  name="withDonation"
                  type="checkbox"
                  checked={testState.withDonation}
                  onChange={(e) => {
                    updateTestState((draft) => {
                      draft.withDonation = e.target.checked;
                    });
                  }}
                />
              </div>
              <input
                type="text"
                placeholder="Donation"
                className="rounded-3xl border border-gray-200 p-2 dark:border-gray-700"
                value={testState.donation}
                onChange={(e) => {
                  updateTestState((draft) => {
                    draft.donation = e.target.value;
                  });
                }}
              />
              <div className={"flex items-center gap-2"}>
                <label htmlFor={"multiple"} className={"text-sm"}>
                  Multiple
                </label>
                <input
                  id={"multiple"}
                  name="multiple"
                  type="checkbox"
                  checked={testState.multiple}
                  onChange={(e) => {
                    updateTestState((draft) => {
                      draft.multiple = e.target.checked;
                    });
                  }}
                />
              </div>
              <button
                disabled={mutate_addMessage.isPending}
                onClick={async () => {
                  await mutate_addMessage.mutateAsync();
                  updateTestState((draft) => {
                    draft.message = "";
                  });
                  await query_messages.refetch({
                    cancelRefetch: true,
                  });
                }}
                className={"rounded-3xl bg-blue-600 text-white py-2 px-4"}
              >
                {mutate_addMessage.isPending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
          {query_messages.isPending && <p>Loading messages...</p>}
          {query_messages.isError && <p>Error loading messages: {query_messages.error.message}</p>}
          {query_messages.isSuccess && (
            <div className="rounded-3xl border border-gray-200 p-6 dark:border-gray-700 space-y-4">
              <h2 className="text-xl font-semibold">Messages</h2>
              <ul>
                {query_messages.data.map((message, index) => (
                  <li
                    key={`${JSON.stringify(message)}-${index}`}
                    className="text-gray-700 dark:text-gray-300 mt-2 width-full border-b border-gray-200 pb-2 dark:border-gray-700 flex flex-col"
                  >
                    <span>{message.text}</span>
                    <span className={"text-xs"}>{message.sender}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
