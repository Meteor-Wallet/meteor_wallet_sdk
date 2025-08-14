import { parseNearAmount } from "@near-js/utils";
import type { Transaction } from "@near-wallet-selector/core";
import type { WalletSelectorProviderValue } from "@near-wallet-selector/react-hook/src/lib/WalletSelectorProvider";

export const CONTRACT_ID = "guest-book.testnet";
const BOATLOAD_OF_GAS = "30000000000000";

export interface Message {
  premium: boolean;
  sender: string;
  text: string;
}

export async function getMessages(
  walletSelectorValue: WalletSelectorProviderValue,
): Promise<Message[]> {
  const response = (await walletSelectorValue.viewFunction({
    contractId: CONTRACT_ID,
    method: "getMessages",
  })) as Message[];

  console.log("getMessages", response);

  return response.reverse();
}

export async function addMessage(
  walletSelectorValue: WalletSelectorProviderValue,
  {
    message,
    donation,
    multiple,
  }: {
    message: string;
    donation: string;
    multiple: boolean;
  },
) {
  if (!multiple) {
    return walletSelectorValue
      .callFunction({
        contractId: CONTRACT_ID,
        method: "addMessage",
        args: { text: message },
        deposit: parseNearAmount(donation)!,
      })
      .catch((err) => {
        alert("Failed to add message " + err);
        console.log("Failed to add message");

        throw err;
      });
  }

  const transactions: Array<Transaction> = [];

  for (let i = 0; i < 2; i += 1) {
    transactions.push({
      signerId: walletSelectorValue.signedAccountId!,
      receiverId: CONTRACT_ID,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: "addMessage",
            args: {
              text: `${message} (${i + 1}/2)`,
            },
            gas: BOATLOAD_OF_GAS,
            deposit: parseNearAmount(donation)!,
          },
        },
      ],
    });
  }

  return walletSelectorValue.signAndSendTransactions({ transactions }).catch((err) => {
    alert("Failed to add messages exception " + err);
    console.log("Failed to add messages");

    throw err;
  });
}
