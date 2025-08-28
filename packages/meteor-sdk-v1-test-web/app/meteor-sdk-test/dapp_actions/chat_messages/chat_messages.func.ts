import { Action, actionCreators, createTransaction, type Transaction } from "@near-js/transactions";
import { baseDecode, parseNearAmount } from "@near-js/utils";
import type { Action as WsAction, Transaction as WsTransaction } from "@near-wallet-selector/core";
import type { WalletSelectorProviderValue } from "@near-wallet-selector/react-hook/src/lib/WalletSelectorProvider";

export const CONTRACT_ID = "guest-book.testnet";
const BOATLOAD_OF_GAS = "30000000000000";
const BIGINT_BOATLOAD_OF_GAS = BigInt("30000000000000");

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

export interface IAddMessage {
  message: string;
  donation?: string;
  multiple: boolean;
  blankTransaction: boolean;
  signOnly: boolean;
}

export async function addMessage(
  walletSelectorValue: WalletSelectorProviderValue,
  { message, donation, multiple, signOnly, blankTransaction }: IAddMessage,
) {
  const wsTransactions: Array<WsTransaction> = [];
  const wsActions: WsAction[] = [];

  const transactions: Transaction[] = [];
  const actions: Action[] = [];

  for (let i = 0; i < (multiple ? 2 : 1); i += 1) {
    const wsAction: WsAction = {
      type: "FunctionCall",
      params: {
        methodName: "addMessage",
        args: {
          text: multiple ? `${message} (${i + 1}/2)` : message,
        },
        gas: BOATLOAD_OF_GAS,
        deposit: parseNearAmount(donation)!,
      },
    };

    wsActions.push(wsAction);

    const action: Action = actionCreators.functionCall(
      "addMessage",
      {
        text: multiple ? `${message} (${i + 1}/2)` : message,
      },
      BIGINT_BOATLOAD_OF_GAS,
      BigInt(parseNearAmount(donation)!),
    );

    actions.push(action);

    wsTransactions.push({
      signerId: walletSelectorValue.signedAccountId!,
      receiverId: CONTRACT_ID,
      actions: [wsAction],
    });

    transactions.push(
      createTransaction(
        walletSelectorValue.signedAccountId!,
        await walletSelectorValue.getPublicKey(),
        CONTRACT_ID,
        BigInt(100),
        [action],
        baseDecode("FYYAj2KrFrePke7p2sFmejX73GZwzqxJjRtKHh87Gv9w"),
      ),
    );
  }

  if (blankTransaction) {
    const resp = await walletSelectorValue.createSignedTransaction(CONTRACT_ID, wsActions);
    console.log("createSignedTransaction", resp);
    alert("Successfully signed transaction. Result is:\n" + resp);
    return resp;
  }

  if (signOnly) {
    const resp = await walletSelectorValue.signTransaction(transactions[0]);
    console.log("sign transaction only (no publish)", resp);
    alert("Successfully signed transaction. Result is:\n" + resp);
    return resp;
  }

  if (!multiple) {
    const resp = await walletSelectorValue
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

    console.log("sign and publish single transaction", resp);
    alert("Successfully called function. Result is:\n" + resp);
    return resp;
  }

  const resp = await walletSelectorValue
    .signAndSendTransactions({ transactions: wsTransactions })
    .catch((err) => {
      alert("Failed to add messages exception " + err);
      console.log("Failed to add messages");

      throw err;
    });

  console.log("sign and publish multiple transactions", resp);
  alert("Successfully called multiple functions. Result is:\n" + resp);
  return resp;
}
