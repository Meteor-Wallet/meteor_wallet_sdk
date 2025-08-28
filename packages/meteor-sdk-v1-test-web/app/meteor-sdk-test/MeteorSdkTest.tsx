import {
  type SetupParams,
  useWalletSelector,
  WalletSelectorProvider,
} from "@near-wallet-selector/react-hook";
import { setupMeteorWallet } from "~/meteor-wallet/setup/setupMeteorWallet";
import "@near-wallet-selector/modal-ui/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChatMessages } from "~/meteor-sdk-test/dapp_actions/chat_messages/ChatMessages";
import { CONTRACT_ID } from "~/meteor-sdk-test/dapp_actions/chat_messages/chat_messages.func";

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
        <App />
      </WalletSelectorProvider>
    </QueryClientProvider>
  );
}

function App() {
  const walletSelector = useWalletSelector();

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
          {signedAccountId != null && (
            <>
              <ChatMessages />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
