import {
  type NearWalletBase,
  type SignAndSendTransactionParams,
  type SignAndSendTransactionsParams,
  type SignMessageParams,
} from "@hot-labs/near-connect";
import type {
  AddFunctionCallKeyParams,
  Network,
  SignDelegateActionsResponse,
  SignInAndSignMessageParams,
  SignInParams,
} from "@hot-labs/near-connect/build/types";
import type {
  IMeteorComInjectedObject,
  IMeteorComInjectedObjectV2,
  IMeteorConnect_Initialize_Input,
  IMeteorConnectAccount,
  IMeteorConnectAccountIdentifier,
  TMCActionRegistry,
  TMeteorComListener,
} from "@meteorwallet/sdk";
import {
  convertOldFunctionCallKeyDefToNew,
  convertSelectorActionToNearAction,
  EMeteorAppId,
  ExecutableAction,
  MeteorConnect,
  MeteorLogger,
  StorageBakeryBridgeLeaseProvider,
} from "@meteorwallet/sdk";
import type { SignedMessage as NearSignedMessage } from "@near-js/signers";
import { SCHEMA } from "@near-js/transactions";
import type { FinalExecutionOutcome } from "@near-js/types";
import { base64 } from "@scure/base";
import { serialize } from "borsh";
import type { TSimpleNearDelegateAction } from "../../../meteor-sdk-v1/src/MeteorConnect/action/mc_action.near";
import type { PartialBy } from "../../../meteor-sdk-v1/src/ported_common/utils/special_typescript_types";
import { SelectorStorageKeyStore } from "../utils/keystore";
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
const selectorKeyStore = new SelectorStorageKeyStore();
const SELECTOR_STORAGE_PREFIX = "meteor-wallet:";
const IS_DEVELOPMENT_BUILD = process.env.NODE_ENV === "development";

const getSelectorStorage = () => {
  const storage = window.selector?.storage;
  if (storage == null) throw new Error("near_connect_selector_storage_unavailable");
  return storage;
};

type TSelectorStorage = IMeteorConnect_Initialize_Input["storage"] &
  Required<Pick<IMeteorConnect_Initialize_Input["storage"], "getKeys">>;

const selectorStorage: TSelectorStorage = {
  getItem: async (key) => (await getSelectorStorage().get(key)) ?? null,
  setItem: async (key, value) => getSelectorStorage().set(key, value),
  removeItem: async (key) => getSelectorStorage().remove(key),
  getKeys: async (prefix?: string) => {
    const keys = (await getSelectorStorage().keys()).map((key) =>
      key.startsWith(SELECTOR_STORAGE_PREFIX) ? key.slice(SELECTOR_STORAGE_PREFIX.length) : key,
    );
    return prefix == null ? keys : keys.filter((key) => key.startsWith(prefix));
  },
};
const selectorBridgeLeaseProvider = new StorageBakeryBridgeLeaseProvider(selectorStorage);
const selectorNativeAppOpener = {
  open: (fullLink: string) => {
    if (typeof window.selector.openNativeApp !== "function") {
      throw new Error("mobile_bridge_native_opener_unavailable");
    }
    window.selector.openNativeApp(fullLink);
  },
};
const selectorKeyStoreProvider = { getKeyStore: () => selectorKeyStore };

if (IS_DEVELOPMENT_BUILD) {
  console.warn("Enabling debug logging for MeteorConnect");
  meteorConnect.setLoggingLevel("debug");
}

const nearConnectVersion: string | undefined = window.selector.nearConnectVersion;

console.log(`Near Connect Version: ${nearConnectVersion}`);

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
  const featureFlags = await window.selector.external("meteorComV2", "featureFlags");

  return {
    version,
    featureFlags,
    sendMessageDataAndRespond: async (data: any) => {
      return await window.selector.external("meteorComV2", "sendMessageDataAndRespond", data);
    },
  };
}

async function getMeteorConnect(): Promise<MeteorConnect> {
  await meteorConnect.initialize({
    storage: selectorStorage,
    nearKeyStoreProvider: selectorKeyStoreProvider,
    mobileBridge: {
      // Production remains gated off until the compatible backend/mobile 0.3 rollout is recorded.
      enabled: IS_DEVELOPMENT_BUILD,
      meteorAppId: IS_DEVELOPMENT_BUILD
        ? EMeteorAppId.meteor_wallet_mobile_dev
        : EMeteorAppId.meteor_wallet_mobile,
      partnerMetadata: { originUrl: window.selector.location },
      leaseProvider: selectorBridgeLeaseProvider,
      nativeAppOpener: selectorNativeAppOpener,
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
  await selectorStorage.setItem("meteor-account-data", JSON.stringify(data));
}

async function getMeteorData(): Promise<IMeteorStoredData | undefined> {
  const str = await selectorStorage.getItem("meteor-account-data");
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

  signIn = async (
    data?: SignInParams & {
      contractId?: string;
      methodNames?: Array<string>;
    },
  ): Promise<Array<NearConnectAccount>> => {
    logger.log(`Signing in to NEAR on network ${data?.network ?? window.selector.network}`, data);

    const addFunctionCallKeyParams: PartialBy<AddFunctionCallKeyParams, "publicKey"> | undefined =
      data.addFunctionCallKey ??
      (data.contractId != null
        ? convertOldFunctionCallKeyDefToNew({
            contractId: data.contractId,
            methodNames: data.methodNames,
          })
        : undefined);

    const met = await getMeteorConnect();
    const action = await met.createAction({
      id: "near::sign_in",
      input: {
        target: {
          blockchain: "near",
          network: data?.network ?? window.selector.network,
        },
        addFunctionCallKey: addFunctionCallKeyParams,
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

  signInAndSignMessage = async (
    data?: SignInAndSignMessageParams & {
      contractId?: string;
      methodNames?: Array<string>;
    },
  ): Promise<Array<NaerConnectAccountWithSignedMessage>> => {
    logger.log(`Signing in to NEAR on network ${data?.network ?? window.selector.network}`);

    const addFunctionCallKeyParams: PartialBy<AddFunctionCallKeyParams, "publicKey"> | undefined =
      data.addFunctionCallKey ??
      (data.contractId != null
        ? convertOldFunctionCallKeyDefToNew({
            contractId: data.contractId,
            methodNames: data.methodNames,
          })
        : undefined);

    const met = await getMeteorConnect();
    const action = await met.createAction({
      id: "near::sign_in_and_sign_message",
      input: {
        target: {
          blockchain: "near",
          network: data?.network ?? window.selector.network,
        },
        messageParams: data.messageParams,
        addFunctionCallKey: addFunctionCallKeyParams,
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
  }): Promise<SignDelegateActionsResponse> => {
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

      console.log("NEAR Connect version", nearConnectVersion);

      if (nearConnectVersion == null) {
        return {
          signedDelegateActions: response.signedDelegatesWithHashes,
        } as any;
      }

      const signedDelegateActions: string[] = response.signedDelegatesWithHashes.map(
        ({ signedDelegate }): string => {
          return base64.encode(serialize(SCHEMA.SignedDelegate, signedDelegate));
          /* return {
            delegateAction: signedDelegate.delegateAction,
            signature: {
              dataBase64: base64.encode(new Uint8Array(signedDelegate.signature.data)),
              keyType: signedDelegate.signature.ed25519Signature != null ? "ed25519" : "secp256k1",
            },
          }; */
        },
      );

      return {
        signedDelegateActions,
      } as any;
    }
  };
}

window.selector.ready(new NearWallet());
