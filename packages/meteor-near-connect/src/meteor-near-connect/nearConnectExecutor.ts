import {
  type NearWalletBase,
  type SignAndSendTransactionParams,
  type SignAndSendTransactionsParams,
  type SignMessageParams,
} from "@hot-labs/near-connect";
import type { Network } from "@hot-labs/near-connect/build/types";
import type {
  IMeteorComInjectedObject,
  IMeteorComInjectedObjectV2,
  IMeteorConnectAccount,
  IMeteorConnectAccountIdentifier,
  TMCActionRegistry,
  TMeteorComListener,
} from "@meteorwallet/sdk";
import {
  convertSelectorActionToNearAction,
  ExecutableAction,
  MeteorConnect,
  MeteorLogger,
} from "@meteorwallet/sdk";
import type { SignedMessage as NearSignedMessage } from "@near-js/signers";
import type { FinalExecutionOutcome } from "@near-js/types";
import { base64 } from "@scure/base";
import type { TSimpleNearDelegateAction } from "../../../meteor-sdk-v1/src/MeteorConnect/action/mc_action.near";
import type {
  NaerConnectAccountWithSignedMessage,
  NearConnectAccount,
  NearConnectNetwork,
  NearConnectSignedMessage,
} from "./near-connect.types";
import { head } from "./view";

const logoImage = new Image();
logoImage.src = "https://meteorwallet.app/loader.gif";

const meteorConnect = new MeteorConnect();

if (process.env.NODE_ENV === "development") {
  console.warn("Enabling debug logging for MeteorConnect");
  meteorConnect.setLoggingLevel("debug");
}

async function createMeteorCom(): Promise<IMeteorComInjectedObject> {
  const features = await window.selector.external("meteorCom", "features", []);

  return {
    addMessageDataListener: (listener: TMeteorComListener<any>) => {
      window.selector.external("meteorCom", "addMessageDataListener", listener);
    },
    directAction: async (data) => {
      return await window.selector.external("meteorCom", "directAction", data);
    },
    features,
    sendMessageData: async (data) => {
      return await window.selector.external("meteorCom", "sendMessageData", data);
    },
  };
}

async function createMeteorComV2(): Promise<IMeteorComInjectedObjectV2> {
  const version = await window.selector.external("meteorComV2", "version");

  return {
    version,
    sendMessageDataAndRespond: async (data: any) => {
      return await window.selector.external("meteorComV2", "sendMessageDataAndRespond", data);
    },
  };
}

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

  try {
    window.meteorCom = await createMeteorCom();
    window.meteorComV2 = await createMeteorComV2();
  } catch (e) {
    console.log(
      `Couldn't find extension, or error was thrown on attempt to create connection to extension [err: ${e.message}]`,
    );
  }

  return meteorConnect;
}

function meteorConnectToNearConnectAccount(metAccount: IMeteorConnectAccount): NearConnectAccount {
  return {
    accountId: metAccount.identifier.accountId,
    publicKey: metAccount.publicKeys[0]?.publicKey,
  };
}

function meteorConnectSignedMessageToNearConnectSignedMessage(
  metSignedMessage: NearSignedMessage,
): NearConnectSignedMessage {
  return {
    accountId: metSignedMessage.accountId,
    publicKey: metSignedMessage.publicKey.toString(),
    signature: base64.encode(metSignedMessage.signature),
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

const logger = MeteorLogger.createLogger("NearConnect:MeteorWallet");

async function promptActionForResponse<R extends ExecutableAction<any>>(
  action: R,
): Promise<TMCActionRegistry[R["id"]]["output"]> {
  const root = document.createElement("div");
  root.style.height = "100%";
  document.body.appendChild(root);
  document.head.innerHTML = head;

  logger.log(`Prompting action [${action.id}] for execution`);
  window.selector.ui.showIframe();

  return await action.promptForExecution({
    strategy: {
      strategy: "target_element",
      element: root,
    },
  });
}

class NearWallet implements Omit<NearWalletBase, "manifest"> {
  // private logger = MeteorLogger.createLogger("NearConnect:MeteorWallet");

  getAccounts = async (data?: {
    network?: NearConnectNetwork;
  }): Promise<Array<NearConnectAccount>> => {
    const accounts = await (await getMeteorConnect()).getAllAccounts({
      blockchain: "near",
      network: data?.network ?? window.selector.network,
    });

    logger.log("Found accounts", accounts);

    return accounts.map(meteorConnectToNearConnectAccount);
  };

  signIn = async (data?: {
    network?: NearConnectNetwork;
    contractId?: string;
    methodNames?: Array<string>;
  }): Promise<Array<NearConnectAccount>> => {
    logger.log(`Signing in to NEAR on network ${data?.network ?? window.selector.network}`);

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
                methods: data.methodNames ?? [],
              }
            : undefined,
      },
    });

    const response = await promptActionForResponse(action);

    const account = meteorConnectToNearConnectAccount(response);

    await setMeteorData({
      account,
      identifier: response.identifier,
    });

    return [account];
  };

  signInAndSignMessage = async (data?: {
    network?: NearConnectNetwork;
    contractId?: string;
    methodNames?: Array<string>;
    messageParams: SignMessageParams;
  }): Promise<Array<NaerConnectAccountWithSignedMessage>> => {
    logger.log(`Signing in to NEAR on network ${data?.network ?? window.selector.network}`);

    const met = await getMeteorConnect();
    const action = await met.createAction({
      id: "near::sign_in_and_sign_message",
      input: {
        target: {
          blockchain: "near",
          network: data?.network ?? window.selector.network,
        },
        contract:
          data?.contractId != null
            ? {
                id: data.contractId,
                methods: data.methodNames ?? [],
              }
            : undefined,
        messageParams: data.messageParams,
      },
    });

    const response = await promptActionForResponse(action);

    const account = meteorConnectToNearConnectAccount(response);

    await setMeteorData({
      account,
      identifier: response.identifier,
    });

    return [
      {
        ...account,
        signedMessage: meteorConnectSignedMessageToNearConnectSignedMessage(response.signedMessage),
      },
    ];
  };

  // comment asd

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
      await promptActionForResponse(action);
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

      const response = await promptActionForResponse(action);

      logger.log(`Sign message executed for account ${response.accountId}`, response);

      return meteorConnectSignedMessageToNearConnectSignedMessage(response);
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
              actions: payload.actions.map(convertSelectorActionToNearAction),
              receiverId: payload.receiverId,
            },
          ],
        },
      });

      const response = await promptActionForResponse(action);

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
              actions: transaction.actions.map(convertSelectorActionToNearAction),
              receiverId: transaction.receiverId,
            };
          }),
        },
      });

      return await promptActionForResponse(action);
    }
  };

  signDelegateActions = async (payload: {
    network?: Network;
    signerId?: string;
    delegateActions: TSimpleNearDelegateAction[];
  }) => {
    const meteorData = await getMeteorData();

    if (meteorData != null) {
      const met = await getMeteorConnect();
      const action = await met.createAction({
        id: "near::sign_delegate_actions",
        input: {
          target: meteorData.identifier,
          delegateActions: payload.delegateActions,
        },
      });

      const response = await promptActionForResponse(action);

      return {
        signedDelegateActions: response.signedDelegatesWithHashes,
      };
    }
  };
}

window.selector.ready(new NearWallet());
