import {
  type NearWalletBase,
  type SignAndSendTransactionParams,
  type SignAndSendTransactionsParams,
  type SignMessageParams,
} from "@hot-labs/near-connect";
import { MeteorConnect } from "@meteorwallet/sdk";
import type {
  IMeteorConnectAccount,
  IMeteorConnectAccountIdentifier,
} from "@meteorwallet/sdk/MeteorConnect/MeteorConnect.types.ts";
import { createAction } from "@meteorwallet/sdk/utils/create-action.ts";
import type { FinalExecutionOutcome } from "@near-js/types";
import { isMobile } from "../utils/isMobile.ts";
import type {
  NearConnectAccount,
  NearConnectNetwork,
  NearConnectSignedMessage,
} from "./near-connect.types.ts";
import { bodyDesktop, bodyMobile, head } from "./view";

const logoImage = new Image();
logoImage.src = "https://meteorwallet.app/loader.gif";

const renderUI = () => {
  const root = document.createElement("div");
  root.style.height = "100%";
  document.body.appendChild(root);
  document.head.innerHTML = head;

  if (isMobile()) root.innerHTML = bodyMobile;
  else root.innerHTML = bodyDesktop;
};

const meteorConnect = new MeteorConnect();

async function getMeteorConnect(): Promise<MeteorConnect> {
  await meteorConnect.initialize({
    storage: {
      getItem: async (key: string) => {
        return await window.selector.storage.get(key);
      },
      setItem: async (key: string, value: string) => {
        return await window.selector.storage.set(key, value);
      },
      removeItem: async (key: string) => {
        return await window.selector.storage.remove(key);
      },
    },
  });

  return meteorConnect;
}

function meteorConnectToNearConnectAccount(metAccount: IMeteorConnectAccount): NearConnectAccount {
  return {
    accountId: metAccount.identifier.accountId,
    publicKey: metAccount.publicKeys[0]?.publicKey,
  };
}

interface IMeteorStoredData {
  account: NearConnectAccount;
  identifier: IMeteorConnectAccountIdentifier;
}

async function setMeteorData(data: IMeteorStoredData): Promise<void> {
  await window.selector.storage.set("meteor-account-data", JSON.stringify(data));
}

async function getMeteorData(): Promise<IMeteorStoredData | undefined> {
  const str = await window.selector.storage.get("meteor-account-data");
  if (str != null) {
    return JSON.parse(str);
  }
}

class NearWallet implements Omit<NearWalletBase, "manifest"> {
  getAccounts = async (data?: {
    network?: NearConnectNetwork;
  }): Promise<Array<NearConnectAccount>> => {
    const accounts = await (await getMeteorConnect()).getAllAccounts({
      blockchain: "near",
      network: data?.network ?? window.selector.network,
    });

    console.log("Found accounts", accounts);

    return accounts.map(meteorConnectToNearConnectAccount);
  };

  signIn = async (data?: {
    network?: NearConnectNetwork;
    contractId?: string;
    methodNames?: Array<string>;
  }): Promise<Array<NearConnectAccount>> => {
    const met = await getMeteorConnect();
    const action = await met.createAction({
      id: "near::sign_in",
      input: {
        target: {
          blockchain: "near",
          network: data?.network ?? window.selector.network,
        },
        contract:
          data?.contractId != null
            ? {
                id: data.contractId,
                methodNames: data.methodNames ?? [],
              }
            : undefined,
      },
    });

    const response = await action.execute("v1_web");

    const account = meteorConnectToNearConnectAccount(response);

    await setMeteorData({
      account,
      identifier: response.identifier,
    });

    return [account];
  };

  signOut = async (data?: { network?: NearConnectNetwork }): Promise<void> => {
    const meteorData = await getMeteorData();

    if (meteorData != null) {
      const met = await getMeteorConnect();
      const action = await met.createAction({
        id: "near::sign_out",
        input: {
          target: meteorData.identifier,
        },
      });
      await action.execute();
    }
  };

  signMessage = async (payload: SignMessageParams): Promise<NearConnectSignedMessage> => {
    const meteorData = await getMeteorData();

    if (meteorData != null) {
      const met = await getMeteorConnect();
      const action = await met.createAction({
        id: "near::sign_message",
        input: {
          target: meteorData.identifier,
          messageParams: payload,
        },
      });

      const response = await action.execute();

      return {
        accountId: response.accountId,
        publicKey: response.publicKey.toString(),
        signature: response.signature.toString(),
      };
    }
  };

  signAndSendTransaction = async (
    payload: SignAndSendTransactionParams,
  ): Promise<FinalExecutionOutcome> => {
    const meteorData = await getMeteorData();

    if (meteorData != null) {
      const met = await getMeteorConnect();
      const action = await met.createAction({
        id: "near::sign_transactions",
        input: {
          target: meteorData.identifier,
          transactions: [
            {
              actions: payload.actions.map(createAction),
              receiverId: payload.receiverId,
            },
          ],
        },
      });

      const response = action.execute();

      return response[0];
    }
  };

  signAndSendTransactions = async (
    payload: SignAndSendTransactionsParams,
  ): Promise<Array<FinalExecutionOutcome>> => {
    const meteorData = await getMeteorData();

    if (meteorData != null) {
      const met = await getMeteorConnect();
      const action = await met.createAction({
        id: "near::sign_transactions",
        input: {
          target: meteorData.identifier,
          transactions: payload.transactions.map((transaction) => {
            return {
              actions: transaction.actions.map(createAction),
              receiverId: transaction.receiverId,
            };
          }),
        },
      });

      return await action.execute();
    }
  };
}

window.selector.ready(new NearWallet());
