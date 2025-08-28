import { parseNearAmount } from "@near-js/utils";
import type { Transaction } from "@near-wallet-selector/core";
import type { WalletSelectorProviderValue } from "@near-wallet-selector/react-hook/src/lib/WalletSelectorProvider";

export const CONTRACT_ID = "guest-book.testnet";
const BOATLOAD_OF_GAS = "30000000000000";

export async function createSignedTransaction(walletSelectorValue: WalletSelectorProviderValue) {
  const transactions: Array<Transaction> = [];

  return walletSelectorValue.signAndSendTransactions({ transactions }).catch((err) => {
    alert("Failed to create signed transaction " + err);
    console.log("Failed to create signed transaction");

    throw err;
  });
}
