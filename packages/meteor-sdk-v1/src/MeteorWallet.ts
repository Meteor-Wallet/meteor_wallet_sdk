import { Account } from "@near-js/accounts";
import { KeyPair, PublicKey } from "@near-js/crypto";
import { KeyStore } from "@near-js/keystores";
import { BrowserLocalStorageKeyStore } from "@near-js/keystores-browser";
import { JsonRpcProvider } from "@near-js/providers";
import { KeyPairSigner } from "@near-js/signers";
import { createTransaction } from "@near-js/transactions";
import { type AccessKeyInfoView } from "@near-js/types";
import type {
  Action,
  FinalExecutionOutcome,
  Optional,
  Transaction,
} from "@near-wallet-selector/core";
import { type ConnectConfig, utils } from "near-api-js";
import { isV1ExtensionAvailable } from "./MeteorConnect/utils/isV1ExtensionAvailable.ts";
import { EExternalActionType } from "./ported_common/dapp/dapp.enums.ts";
import {
  type IDappAction_Logout_Data,
  type IMeteorActionResponse_Output,
  type IODappAction_PostMessage_SignIn_Output,
  type IODappAction_PostMessage_SignTransactions_Input,
  type IODappAction_PostMessage_SignTransactions_Output,
  type IODappAction_SignMessage_Input,
  type IODappAction_SignMessage_Output,
  type IODappAction_VerifyOwner_Input,
  type IODappAction_VerifyOwner_Output,
  type IOMeteorWalletSdk_RequestSignIn_Inputs,
  type IOMeteorWalletSdk_SignIn_Output,
  type IOMeteorWalletSdkAccount_SignAndSendTransaction_Input,
  type IORequestSignTransactions_Inputs,
  type IOWalletExternalLinkedContract,
  MeteorActionError,
} from "./ported_common/dapp/dapp.types.ts";
import { ENearNetwork } from "./ported_common/near/near_basic_types.ts";
import { NEAR_BASE_CONFIG_FOR_NETWORK } from "./ported_common/near/near_static_data.ts";
import { notNullEmpty } from "./ported_common/utils/nullEmptyString.ts";
import { CEnvironmentStorageAdapter_Sync } from "./ported_common/utils/storage/EnvironmentStorageAdapter_Sync.ts";
import { getMeteorPostMessenger } from "./postMessage/MeteorPostMessenger";
import { createAction } from "./utils/create-action";
import { resolveWalletUrl } from "./utils/MeteorSdkUtils.ts";

const LOGIN_WALLET_URL_SUFFIX = "/login/";
const SIGN_WALLET_URL_SUFFIX = "/sign/";
const MULTISIG_HAS_METHOD = "add_request_and_confirm";
const LOCAL_STORAGE_KEY_SUFFIX = "_meteor_wallet_auth_key";
const PENDING_ACCESS_KEY_PREFIX = "pending_key"; // browser storage key for a pending access key (i.e. key has been generated but we are not sure it was added yet)

const localStorageAdapter = new CEnvironmentStorageAdapter_Sync({
  getString: (key: string) => window.localStorage.getItem(key),
  setString: (key: string, value: string) => window.localStorage.setItem(key, value),
  clear: (key: string) => window.localStorage.removeItem(key),
});

const sessionAdapter = new CEnvironmentStorageAdapter_Sync({
  getString: (key: string) => window.sessionStorage.getItem(key),
  setString: (key: string, value: string) => window.sessionStorage.setItem(key, value),
  clear: (key: string) => window.sessionStorage.removeItem(key),
});

interface IMeteorAuthData {
  allKeys: string[];
  accountId?: string;
  signedInContract?: IOWalletExternalLinkedContract;
}

export interface IMeteorWallet_Init_Inputs extends Partial<ConnectConfig> {
  networkId: string;
  appKeyPrefix?: string;
}

export interface IMeteorWallet_Constructor extends IMeteorWallet_Init_Inputs {
  forceTargetPlatform?: "v1_web" | "v1_ext";
  keyStore: KeyStore;
}

declare global {
  interface Window {
    meteorWallet: any;
  }
}

/**
 * This class is used in conjunction with `near-api-js` and `BrowserLocalStorageKeyStore`.
 * It directs users to the Meteor Extension or (if not available) a popup of the Meteor Wallet website for key management.
 *
 * @example
 * ```js
 * import { MeteorWallet } from "@meteorwallet/sdk";
 *
 * // create new MeteorWallet instance (passing in your initialized Near connection)
 * const meteorWallet = new MeteorWallet({ near: connectedNear, appKeyPrefix: 'my-app' });
 *
 * // -- or -- (for a quick and default Near connection config)
 * const meteorWallet = MeteorWallet.init({ networkId: "testnet" });
 *
 * // If not signed in, start the sign-in flow with Meteor Wallet.
 * // Keys will be stored in the BrowserLocalStorageKeyStore
 * if(!meteorWallet.isSignedIn()) {
 *   const { accountId } = await meteorWallet.requestSignIn();
 * }
 * ```
 */
export class MeteorWallet {
  /** @hidden */
  _walletBaseUrl: string;

  /** @hidden */
  _authDataKey: string;

  /** @hidden */
  _keyStore: KeyStore;

  /** @hidden */
  _authData: IMeteorAuthData;

  /** @hidden */
  _networkId: string;

  /** @hidden */
  _provider: JsonRpcProvider;
  // _near: Near;

  /** @hidden */
  _connectedAccount: ConnectedMeteorWalletAccount | undefined;

  _forceTargetPlatform?: "v1_web" | "v1_ext";

  /** @hidden */
  _initializationPromises: Promise<any>[] = [];

  /**
   * The easiest way to set up the SDK. Returns an instance of MeteorWallet, automatically connected to the Near API.
   *
   * If you need more control over the Near Network configuration- rather use {@link MeteorWallet:constructor}
   *
   * @example
   * ```js
   * const wallet = await MeteorWallet.init({ networkId: "testnet" });
   * ```
   */
  static async init(config: IMeteorWallet_Init_Inputs): Promise<MeteorWallet> {
    const keyStore = new BrowserLocalStorageKeyStore(window.localStorage, "_meteor_wallet");
    const wallet = new MeteorWallet({ appKeyPrefix: "near_app", keyStore, ...config });

    // Cleanup up any pending keys (cancelled logins).
    if (!wallet.isSignedIn()) {
      await keyStore.clear();
    }

    return wallet;
  }

  /**
   * Construct MeteorWallet. If you'd a quick and default way, you can also use {@link MeteorWallet.init}
   *
   * @example
   * ```js
   * // create new MeteorWallet instance (passing in your initialized Near connection)
   * const meteorWallet = new MeteorWallet({ near: connectedNear, appKeyPrefix: 'my-app' });
   *
   * if(!meteorWallet.isSignedIn()) {
   *   const { accountId } = await meteorWallet.requestSignIn();
   * }
   * ```
   */
  constructor({
    appKeyPrefix = "default",
    keyStore,
    networkId,
    walletUrl,
    nodeUrl,
    forceTargetPlatform,
  }: IMeteorWallet_Constructor) {
    this._forceTargetPlatform = forceTargetPlatform;

    const authDataKey = appKeyPrefix + LOCAL_STORAGE_KEY_SUFFIX;
    this._authDataKey = authDataKey;
    this._authData = localStorageAdapter.getJson<IMeteorAuthData>(authDataKey) ?? { allKeys: [] };

    this._walletBaseUrl = resolveWalletUrl(networkId, walletUrl);
    this._networkId = networkId;
    this._keyStore = keyStore;
    this._provider = new JsonRpcProvider({
      url: nodeUrl ?? NEAR_BASE_CONFIG_FOR_NETWORK[networkId].nodeUrl,
    });
  }

  isExtensionInstalled(): boolean {
    return isV1ExtensionAvailable();
  }

  /**
   * Returns true, if this app is authorized with an account in the wallet.
   * @example
   * ```js
   * const wallet = new MeteorWallet({ near: connectedNear, appKeyPrefix: 'my-app' });
   * wallet.isSignedIn();
   * ```
   */
  isSignedIn() {
    return !!this._authData.accountId;
  }

  /**
   * Returns authorized Account ID.
   * @example
   * ```js
   * const wallet = new MeteorWallet(near, 'my-app');
   * const accountId = wallet.getAccountId();
   * ```
   */
  getAccountId(): string | undefined {
    return this._authData.accountId;
  }

  /**
   * Verifies that the user is the owner of a specific Near account, available in the wallet.
   * Removes the need to do blockchain operations for simple Dapp actions.
   * Signs a payload with the wallet's private key. Will return a promise with a payload like so:
   *
   * ```ts
   * interface VerifiedOwner {
   *   accountId: string;
   *   message: string;                 // The same passed message, unencrypted
   *   blockId: string;
   *   publicKey: string;               // The public key which should be verified as belonging to this account
   *   signature: string;               // The signed payload (this exact same object JSON stringified, excluding this "signature" property)
   *   keyType: utils.key_pair.KeyType; // Type from inside the near-api-js package
   * }
   * ```
   *
   * or throw a {@link MeteorActionError} error if the verification failed for whatever reason.
   * */
  async verifyOwner(
    options: IODappAction_VerifyOwner_Input,
  ): Promise<IMeteorActionResponse_Output<IODappAction_VerifyOwner_Output>> {
    const accountId = options.accountId ?? this.getAccountId();
    const response =
      await getMeteorPostMessenger().connectAndWaitForResponse<IODappAction_VerifyOwner_Output>({
        actionType: EExternalActionType.verify_owner,
        inputs: {
          accountId,
          message: options.message,
        } as IODappAction_VerifyOwner_Input,
        network: this._networkId as ENearNetwork,
        forceExecutionTarget: this._forceTargetPlatform,
      });

    if (response.success) {
      return response;
    }

    throw new MeteorActionError({
      endTags: response.endTags,
      message: response.message,
    });
  }

  /**
   * Requests a sign-in using Meteor Wallet. Will return a promise with the `accountId` of the
   * signed-in account, or throw a {@link MeteorActionError} error if the sign-in failed for whatever reason.
   * */
  async requestSignIn(
    options: IOMeteorWalletSdk_RequestSignIn_Inputs,
  ): Promise<IMeteorActionResponse_Output<IOMeteorWalletSdk_SignIn_Output>> {
    const { keyPair, ...restOptions } = options;

    const accessKey: KeyPair = keyPair ?? KeyPair.fromRandom("ed25519");

    console.log(accessKey);

    const usingPublicKey = accessKey.getPublicKey().toString();

    const response =
      await getMeteorPostMessenger().connectAndWaitForResponse<IODappAction_PostMessage_SignIn_Output>(
        {
          actionType: EExternalActionType.login,
          inputs: { public_key: usingPublicKey, ...restOptions },
          network: this._networkId as ENearNetwork,
          forceExecutionTarget: this._forceTargetPlatform,
        },
      );

    if (response.success) {
      const { allKeys, accountId } = response.payload;
      this._authData = {
        accountId,
        allKeys,
        signedInContract: {
          contract_id: restOptions.contract_id,
          public_key: usingPublicKey,
        },
      };
      localStorageAdapter.setJson(this._authDataKey, this._authData);
      await this._keyStore.setKey(this._networkId, accountId, accessKey);
      return {
        success: true,
        endTags: [],
        payload: {
          accessKey,
          accountId,
        },
      };
    }

    throw new MeteorActionError({
      endTags: response.endTags,
      message: response.message,
    });
  }

  /**
   * Sign out from the current account
   */
  async signOut() {
    const accountId = this.getAccountId();

    if (this._authData.signedInContract != null && accountId != null) {
      const inputs: IDappAction_Logout_Data = {
        accountId,
        contractInfo: this._authData.signedInContract,
      };

      const response = await getMeteorPostMessenger().connectAndWaitForResponse({
        actionType: EExternalActionType.logout,
        inputs,
        network: this._networkId as ENearNetwork,
        forceExecutionTarget: this._forceTargetPlatform,
      });
    }

    this._authData = { allKeys: [] };
    localStorageAdapter.clear(this._authDataKey);
  }

  /**
   * Allows users to sign a message for a specific recipient using their NEAR account, based on the [NEP413](https://github.com/near/NEPs/pull/413).
   *
   * Will return a promise with a payload like so:
   *
   * ```ts
   * interface signMessage {
   *   accountId: string;               // The account name to which the publicKey corresponds as plain text
   *   publicKey: string;               // The public counterpart of the key used to sign
   *   signature: string;               // The base64 representation of the signature
   *   state?: string;                  // The same state passed in.
   * }
   * ```
   *
   * or throw a {@link MeteorActionError} error if the signing failed for whatever reason.
   * */
  async signMessage({
    message,
    nonce,
    recipient,
    callbackUrl,
    state,
    accountId,
  }: IODappAction_SignMessage_Input): Promise<
    IMeteorActionResponse_Output<IODappAction_SignMessage_Output>
  > {
    const response =
      await getMeteorPostMessenger().connectAndWaitForResponse<IODappAction_SignMessage_Output>({
        actionType: EExternalActionType.sign_message,
        inputs: {
          message,
          nonce,
          recipient,
          callbackUrl,
          state,
          accountId,
        },
        network: this._networkId as ENearNetwork,
        forceExecutionTarget: this._forceTargetPlatform,
      });
    if (response.success) {
      response.payload.state = state;
      return response;
    }

    throw new MeteorActionError({
      endTags: response.endTags,
      message: response.message,
    });
  }

  /*async requestSignTransactionsNearNative(inputs: IORequestSignTransactionsNearNative_Inputs): Promise<FinalExecutionOutcome[]> {
    console.log("Transformed transactions", transformedTransactions);

    const response =
      await getMeteorPostMessenger().connectAndWaitForResponse<IODappAction_PostMessage_SignTransactions_Output>(
        {
          actionType: EExternalActionType.sign,
          inputs: {
            transactions: transformedTransactions
              .map((transaction) => transaction.encode())
              .map((serialized) => Buffer.from(serialized).toString("base64"))
              .join(","),
          } as IODappAction_PostMessage_SignTransactions_Input,
          // inputs: { public_key: usingPublicKey, ...options },
          network: this._networkId as ENearNetwork,
        },
      );

    // console.log("Finished sign-in request", response);

    if (response.success) {
      return response.payload.executionOutcomes;
    }

    throw new MeteorActionError({
      endTags: response.endTags,
      message: response.message,
    });
  }*/

  /**
   * Sign transactions using Meteor Wallet. Will return a promise with an array of `FinalExecutionOutcome`
   * of the given transactions.
   * */
  async requestSignTransactions(
    inputs: IORequestSignTransactions_Inputs,
  ): Promise<FinalExecutionOutcome[]> {
    const { transactions } = inputs;

    const transformedTransactions = await this.transformTransactions(transactions);

    console.log("Transformed transactions", transformedTransactions);

    const response =
      await getMeteorPostMessenger().connectAndWaitForResponse<IODappAction_PostMessage_SignTransactions_Output>(
        {
          actionType: EExternalActionType.sign,
          inputs: {
            transactions: transformedTransactions
              .map((transaction) => transaction.encode())
              .map((serialized) => Buffer.from(serialized).toString("base64"))
              .join(","),
          } as IODappAction_PostMessage_SignTransactions_Input,
          // inputs: { public_key: usingPublicKey, ...options },
          network: this._networkId as ENearNetwork,
          forceExecutionTarget: this._forceTargetPlatform,
        },
      );

    // console.log("Finished sign-in request", response);

    if (response.success) {
      return response.payload.executionOutcomes;
    }

    throw new MeteorActionError({
      endTags: response.endTags,
      message: response.message,
    });
  }

  /**
   * Returns the current connected wallet account
   */
  async account(): Promise<ConnectedMeteorWalletAccount> {
    const currentAccountId = this.getAccountId();

    if (notNullEmpty(currentAccountId) && this._connectedAccount?.accountId !== currentAccountId) {
      const keyPair = await this._keyStore.getKey(this._networkId, currentAccountId);
      const keyPairSigner = KeyPairSigner.fromSecretKey(keyPair.toString());

      this._connectedAccount = new ConnectedMeteorWalletAccount(
        this,
        currentAccountId,
        keyPairSigner,
      );
    }

    if (this._connectedAccount == null) {
      throw new MeteorActionError({
        endTags: [],
        message: "No current account connected to Meteor Wallet",
      });
    }

    return this._connectedAccount;
  }

  async transformTransactions(transactions: Array<Optional<Transaction, "signerId">>) {
    const account = await this.account();
    // const { networkId, signer, provider } = account.getConnection();
    const signer = account.getSigner()!;
    const provider = account.provider;

    const localKey = await signer.getPublicKey();

    return Promise.all(
      transactions.map(async (transaction, index) => {
        const accessKey = await account.accessKeyForTransaction(localKey);

        if (!accessKey) {
          throw new Error(
            `Failed to find matching key for transaction sent to ${transaction.receiverId}`,
          );
        }

        const transformedActions = transaction.actions.map((action) => createAction(action));

        const block = await provider.viewBlock({ finality: "final" });

        return createTransaction(
          account.accountId,
          PublicKey.from(accessKey.public_key),
          transaction.receiverId,
          BigInt(accessKey.access_key.nonce) + BigInt(index) + BigInt(1),
          // new BN(accessKey.access_key.nonce).add(new BN(index)).add(new BN(1)),
          transformedActions,
          utils.serialize.base_decode(block.header.hash),
        );
        /*return {
          receiverId: transaction.receiverId,
          signerId: account.accountId,
          actions: transformedActions,
        };*/
      }),
    );
  }
}

interface IOTryAndSendTransaction_Output {
  sent: boolean;
  executionOutcome?: FinalExecutionOutcome;
  transaction?: Transaction;
}

/**
 * Near Account implementation which makes use of {@link MeteorWallet} when no local key is available.
 *
 * Generally won't be created directly- can be obtained by using {@link MeteorWallet.account}
 *
 * @example
 * ```js
 * const account = meteorWallet.account();
 *
 * // uses Meteor Wallet to sign the transaction using this account
 * const response = await account.requestSignTransaction({
 *   actions: transactionActions,
 *   receiverId: "my-contract"
 * });
 * ```
 */
export class ConnectedMeteorWalletAccount extends Account {
  /** @hidden */
  meteorWallet: MeteorWallet;
  // publicKey: PublicKey;

  /** @hidden */
  constructor(walletConnection: MeteorWallet, accountId: string, signer: KeyPairSigner) {
    super(accountId, walletConnection._provider, signer);
    this.setSigner(signer);
    this.meteorWallet = walletConnection;
  }

  /**
   * Sign a transaction using Meteor Wallet. Overrides the Near Account API method of the same name, makes use of {@link ConnectedMeteorWalletAccount.signAndSendTransaction_direct}
   */
  async signAndSendTransaction(...args: any[]): Promise<FinalExecutionOutcome> {
    if (typeof args[0] === "string") {
      return this.signAndSendTransaction_direct({
        receiverId: args[0],
        actions: args[1],
      });
    }

    return this.signAndSendTransaction_direct(args[0]);
  }

  /** @hidden */
  private async trySendOrCreateTransaction({
    receiverId,
    actions,
  }: IOMeteorWalletSdkAccount_SignAndSendTransaction_Input): Promise<IOTryAndSendTransaction_Output> {
    const localKey = await this.getSigner()!.getPublicKey();

    const accessKey = await this.accessKeyForTransaction(localKey);

    if (accessKey != null && accessKey.access_key.permission !== "FullAccess") {
      // check that this is a valid access key for the given transaction
      const accessKeyMatchesTransaction = await this.accessKeyMatchesTransaction(
        accessKey,
        receiverId,
        actions,
      );

      if (!accessKeyMatchesTransaction) {
        return {
          sent: false,
          transaction: {
            receiverId,
            signerId: this.accountId,
            actions,
          },
        };
      }
    }

    if (accessKey) {
      if (localKey && localKey.toString() === accessKey.public_key) {
        try {
          return {
            executionOutcome: await super.signAndSendTransaction({
              receiverId,
              actions: actions.map((action) => createAction(action)),
            }),
            sent: true,
          };
        } catch (e: any) {
          if (e.type !== "NotEnoughAllowance") {
            throw e;
            // accessKey = await this.accessKeyForTransaction(receiverId, actions);
          }
        }
      }
    }

    return {
      sent: false,
      transaction: {
        receiverId,
        signerId: this.accountId,
        actions,
      },
    };
  }

  /**
   * Sign a transaction using Meteor Wallet
   * @see {@link MeteorWallet.requestSignTransactions}
   */
  async signAndSendTransaction_direct({
    receiverId,
    actions,
  }: IOMeteorWalletSdkAccount_SignAndSendTransaction_Input): Promise<FinalExecutionOutcome> {
    const { transaction, sent, executionOutcome } = await this.trySendOrCreateTransaction({
      receiverId,
      actions,
    });

    if (sent) {
      return executionOutcome!;
    }

    return (
      await this.meteorWallet.requestSignTransactions({
        transactions: [transaction!],
      })
    )[0];
  }

  /**
   * Check if given access key allows the function call or method attempted in transaction
   * @param accessKey Array of {access_key: AccessKey, public_key: PublicKey} items
   * @param receiverId The NEAR account attempting to have access
   * @param actions The action(s) needed to be checked for access
   */
  async accessKeyMatchesTransaction(
    accessKey: AccessKeyInfoView,
    receiverId: string,
    actions: Action[],
  ): Promise<boolean> {
    const {
      access_key: { permission },
    } = accessKey;
    if (permission === "FullAccess") {
      return true;
    }

    console.log("Comparing access key and actions", {
      accessKey,
      receiverId,
      actions,
    });

    if (permission.FunctionCall) {
      const { receiver_id: allowedReceiverId, method_names: allowedMethods } =
        permission.FunctionCall;
      /********************************
       Accept multisig access keys and let wallets attempt to signAndSendTransaction
       If an access key has itself as receiverId and method permission add_request_and_confirm, then it is being used in a wallet with multisig contract: https://github.com/near/core-contracts/blob/671c05f09abecabe7a7e58efe942550a35fc3292/multisig/src/lib.rs#L149-L153
       ********************************/
      if (allowedReceiverId === receiverId && allowedMethods.includes(MULTISIG_HAS_METHOD)) {
        return true;
      }
      if (allowedReceiverId === receiverId) {
        if (actions.length !== 1) {
          return false;
        }
        const firstAction = actions[0];

        console.log(firstAction);

        if (firstAction.type === "FunctionCall") {
          const functionCallParams = firstAction.params;
          return (
            (!functionCallParams.deposit || functionCallParams.deposit.toString() === "0") && // TODO: Should support charging amount smaller than allowance?
            (allowedMethods.length === 0 || allowedMethods.includes(functionCallParams.methodName))
          );
        }

        // const [{ functionCall }] = actions;
        // return (
        //   functionCall &&
        //   (!functionCall.deposit || functionCall.deposit.toString() === "0") && // TODO: Should support charging amount smaller than allowance?
        //   (allowedMethods.length === 0 ||
        //     allowedMethods.includes(functionCall.methodName))
        // );
        // TODO: Handle cases when allowance doesn't have enough to pay for gas
      }
    }
    // TODO: Support other permissions than FunctionCall

    return false;
  }

  /**
   * Helper function returning the access key (if it exists) to the receiver that grants the designated permission
   * @param localKey A local public key provided to check for access
   * @returns Promise<any>
   */
  async accessKeyForTransaction(localKey?: PublicKey): Promise<AccessKeyInfoView | null> {
    const accessKeys = (await this.getAccessKeyList()).keys;
    console.log("accessKeys", accessKeys);

    if (localKey) {
      const accessKey = accessKeys.find((key) => key.public_key.toString() === localKey.toString());
      if (accessKey) {
        return accessKey;
      }
    }

    const walletKeys = this.meteorWallet._authData.allKeys;
    for (const accessKey of accessKeys) {
      if (walletKeys.indexOf(accessKey.public_key) !== -1) {
        return accessKey;
      }
    }

    for (const accessKey of accessKeys) {
      if (accessKey.access_key.permission === "FullAccess") {
        return accessKey;
      }
    }

    return null;
  }
}
