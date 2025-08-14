import { useWalletSelector } from "@near-wallet-selector/react-hook";

export function MeteorSdkTest() {
  const {
    signedAccountId,
    signOut,
    signIn,
    viewFunction,
    callFunction,
    signAndSendTransactions,
    createSignedTransaction,
    wallet,
    signMessage,
    walletSelector,
  } = useWalletSelector();

  return (
    <main className="flex items-center justify-center pt-16 pb-4">
      <div className="flex-1 flex flex-col items-center gap-16 min-h-0">
        <div className="max-w-[300px] w-full space-y-6 px-4">
          <nav className="rounded-3xl border border-gray-200 p-6 dark:border-gray-700 space-y-4">
            <ul>
              {signedAccountId == null ? (
                <button
                  className={
                    "w-full rounded-3xl bg-blue-600 text-white py-2 px-4 hover:bg-blue-700 transition-colors"
                  }
                  onClick={signIn}
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
        </div>
      </div>
    </main>
  );
}
