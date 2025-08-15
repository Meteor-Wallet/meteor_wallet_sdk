import {
  type SetupParams,
  useWalletSelector,
  WalletSelectorProvider,
} from "@near-wallet-selector/react-hook";
import { setupMeteorWallet } from "~/meteor-wallet/setup/setupMeteorWallet";
import "@near-wallet-selector/modal-ui/styles.css";
import { QueryClient, QueryClientProvider, useMutation, useQuery } from "@tanstack/react-query";
import { useImmer } from "use-immer";
import { addMessage, CONTRACT_ID, getMessages } from "~/meteor-sdk-test/guestbook";

const walletSelectorConfig: SetupParams = {
  network: "testnet",
  debug: true,
  modules: [setupMeteorWallet()],
  createAccessKeyFor: {
    contractId: CONTRACT_ID,
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

  const query_messages = useQuery({
    queryKey: ["get_messages"],
    queryFn: async () => {
      return getMessages(walletSelector);
    },
  });

  const [messageToSend, updateMessage] = useImmer({
    message: "",
    donation: "0.001",
    withDonation: false,
    multiple: false,
  });

  const mutate_addMessage = useMutation({
    mutationKey: [messageToSend],
    mutationFn: async () => {
      return addMessage(walletSelector, {
        ...messageToSend,
        donation: messageToSend.withDonation ? messageToSend.donation : "0",
      });
    },
  });

  const { signedAccountId, signOut, signIn } = walletSelector;

  return (
    <main className="flex items-center justify-center pt-16 pb-4">
      <div className="flex-1 flex flex-col items-center gap-16 min-h-0">
        <div className="w-full space-y-6 px-4">
          <nav className="rounded-3xl border border-gray-200 p-6 dark:border-gray-700 space-y-4 flex">
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
            <h2 className="text-xl font-semibold">Add Message</h2>
            <div className="flex flex-col gap-2 items-start">
              <input
                type="text"
                placeholder="Message"
                className="rounded-3xl border border-gray-200 p-2 dark:border-gray-700"
                value={messageToSend.message}
                onChange={(e) => {
                  updateMessage((draft) => {
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
                  checked={messageToSend.withDonation}
                  onChange={(e) => {
                    updateMessage((draft) => {
                      draft.withDonation = e.target.checked;
                    });
                  }}
                />
              </div>
              <input
                type="text"
                placeholder="Donation"
                className="rounded-3xl border border-gray-200 p-2 dark:border-gray-700"
                value={messageToSend.donation}
                onChange={(e) => {
                  updateMessage((draft) => {
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
                  checked={messageToSend.multiple}
                  onChange={(e) => {
                    updateMessage((draft) => {
                      draft.multiple = e.target.checked;
                    });
                  }}
                />
              </div>
              <button
                disabled={mutate_addMessage.isPending}
                onClick={async () => {
                  await mutate_addMessage.mutateAsync();
                  updateMessage((draft) => {
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
