import { Account } from "@near-js/accounts";
import { KeyPair, KeyType, PublicKey } from "@near-js/crypto";
import { KeyStore } from "@near-js/keystores";
import { JsonRpcProvider } from "@near-js/providers";
// import { KeyPairSigner } from "@near-js/signers";
import {
  buildDelegateAction,
  createTransaction,
  DelegateAction,
  SCHEMA,
  Signature,
  SignedDelegate,
} from "@near-js/transactions";
import { type AccessKeyInfoView } from "@near-js/types";
import type {
  Action,
  FinalExecutionOutcome,
  Optional,
  Transaction,
} from "@near-wallet-selector/core";
import { deserialize, serialize } from "borsh";
import { type ConnectConfig, utils } from "near-api-js";
import type {
  AddFunctionCallKeyParams,
  TSimpleNearDelegateAction,
} from "./MeteorConnect/action/mc_action.near";
import { MeteorLogger } from "./MeteorConnect/logging/MeteorLogger";
import type { MeteorConnect } from "./MeteorConnect/MeteorConnect";
import { METEOR_V1_SDK_KEY_PREFIX } from "./MeteorConnect/MeteorConnect.static";
import type { IMeteorConnectAccount } from "./MeteorConnect/MeteorConnect.types";
import type { TMeteorConnectV1ExecutionTargetConfig } from "./MeteorConnect/target_clients/v1_client/MeteorConnectV1Client.types";
import { initProp } from "./MeteorConnect/utils/initProp";
import { isV1ExtensionAvailable } from "./MeteorConnect/utils/isV1ExtensionAvailable";
import { convertSelectorActionToNearAction } from "./near_utils/convertSelectorActionToNearAction";
import { EExternalActionType } from "./ported_common/dapp/dapp.enums";
import {
  type IDappAction_Logout_Data,
  type IMeteorActionResponse_Output,
  type IODappAction_PostMessage_SignDelegateActions_Input,
  type IODappAction_PostMessage_SignDelegateActions_Output,
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
  type IORequestSignDelegateActions_Input,
  type IORequestSignDelegateActions_Output,
  type IORequestSignTransactions_Inputs,
  type ISignDelegateActionReturn,
  type IWithAccountIdentifier,
  type IWithMeteorWalletAccount,
  MeteorActionError,
} from "./ported_common/dapp/dapp.types";
import { ENearNetwork } from "./ported_common/near/near_basic_types";
import { NEAR_BASE_CONFIG_FOR_NETWORK } from "./ported_common/near/near_static_data";
import { CEnvironmentStorageAdapter } from "./ported_common/utils/storage/EnvironmentStorageAdapter";
import {
  createTypedStorageHelper,
  type ITypedStorageHelper,
} from "./ported_common/utils/storage/TypedStorageHelper";
import { getMeteorPostMessenger } from "./postMessage/MeteorPostMessenger";
import { resolveWalletUrl } from "./utils/MeteorSdkUtils";

const MULTISIG_HAS_METHOD = "add_request_and_confirm";

interface IMeteorV1TypedStorage {
  // empty for now
}

export interface IMeteorWallet_Init_Inputs extends Partial<ConnectConfig> {
  networkId: string;
  appKeyPrefix?: string;
}

export interface IMeteorWallet_Constructor extends IMeteorWallet_Init_Inputs {
  forceTargetPlatformConfig?: TMeteorConnectV1ExecutionTargetConfig;
  keyStore: KeyStore;
  meteorConnect?: MeteorConnect;
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
  _keyStore: KeyStore;

  /** @hidden */
  _networkId: string;

  /** @hidden */
  _provider: JsonRpcProvider;
  // _near: Near;

  /** @hidden */
  _connectedAccount: ConnectedMeteorWalletAccount | undefined;

  _forceTargetPlatformConfig?: TMeteorConnectV1ExecutionTargetConfig;

  /** @hidden */
  _initializationPromises: Promise<any>[] = [];

  _meteorConnect?: MeteorConnect;

  _localStorageAdapter = new CEnvironmentStorageAdapter({
    getItem: async (key: string) => window.localStorage.getItem(key),
    setItem: async (key: string, value: string) => window.localStorage.setItem(key, value),
    removeItem: async (key: string) => window.localStorage.removeItem(key),
  });

  _typedStorageHelper = initProp<ITypedStorageHelper<IMeteorV1TypedStorage>>();

  private logger = MeteorLogger.createLogger("MeteorWallet SDK v1");

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
  // static async init(config: IMeteorWallet_Init_Inputs): Promise<MeteorWallet> {
  //   const keyStore = new BrowserLocalStorageKeyStore(window.localStorage, "_meteor_wallet");
  //   const wallet = new MeteorWallet({ appKeyPrefix: "near_app", keyStore, ...config });

  //   // Cleanup up any pending keys (cancelled logins).
  //   if (!wallet.isSignedIn()) {
  //     await keyStore.clear();
  //   }

  //   return wallet;
  // }

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
    keyStore,
    networkId,
    walletUrl,
    nodeUrl,
    meteorConnect,
    forceTargetPlatformConfig,
  }: IMeteorWallet_Constructor) {
    this._forceTargetPlatformConfig = forceTargetPlatformConfig;
    this._meteorConnect = meteorConnect;

    if (this._meteorConnect != null) {
      this._localStorageAdapter = this._meteorConnect.localStorageAdapter;
    }

    this._typedStorageHelper.set(
      createTypedStorageHelper<IMeteorV1TypedStorage>({
        storageAdapter: this._localStorageAdapter,
        keyPrefix: METEOR_V1_SDK_KEY_PREFIX,
      }),
    );

    this._walletBaseUrl = resolveWalletUrl(networkId, walletUrl);
    this._networkId = networkId;
    this._keyStore = keyStore;
    this._provider = new JsonRpcProvider({
      url: nodeUrl ?? NEAR_BASE_CONFIG_FOR_NETWORK[networkId].nodeUrl,
    });

    this.logger.log(
      `Initialized MeteorWallet V1 Client for network [${networkId}] targeting platform [${this._forceTargetPlatformConfig != null ? this._forceTargetPlatformConfig.executionTarget : this._walletBaseUrl}]`,
    );
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
  // isSignedIn() {
  //   return this.getAccountId() != null;
  // }

  get storage() {
    return this._typedStorageHelper.get();
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
    options: Omit<IODappAction_VerifyOwner_Input, "accountId"> & IWithAccountIdentifier,
  ): Promise<IMeteorActionResponse_Output<IODappAction_VerifyOwner_Output>> {
    const response =
      await getMeteorPostMessenger().connectAndWaitForResponse<IODappAction_VerifyOwner_Output>({
        actionType: EExternalActionType.verify_owner,
        inputs: {
          accountId: options.accountIdentifier.accountId,
          message: options.message,
        } as IODappAction_VerifyOwner_Input,
        network: this._networkId as ENearNetwork,
        forceExecutionTargetConfig: this._forceTargetPlatformConfig,
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
    const { addFunctionCallKey: _addFunctionCallKey, ...restOptions } = options;

    const addFunctionCallKey =
      _addFunctionCallKey != null
        ? {
            ..._addFunctionCallKey,
          }
        : undefined;

    let keyPairToAdd: KeyPair | undefined;

    if (addFunctionCallKey != null && addFunctionCallKey.publicKey == null) {
      // TODO generate key pair and store it for later use in function call transactions
      keyPairToAdd = KeyPair.fromRandom("ed25519");
      addFunctionCallKey.publicKey = keyPairToAdd.getPublicKey().toString();
    }

    const finalFunctionCallKey: AddFunctionCallKeyParams | undefined =
      addFunctionCallKey != null ? (addFunctionCallKey as AddFunctionCallKeyParams) : undefined;

    // console.log(accessKey);
    this.logger.log(
      `Requesting sign-in for account with access key [${finalFunctionCallKey?.publicKey ?? "<no public key provided>"}] and options:`,
    );

    const response =
      await getMeteorPostMessenger().connectAndWaitForResponse<IODappAction_PostMessage_SignIn_Output>(
        {
          actionType: EExternalActionType.login,
          inputs: {
            public_key: finalFunctionCallKey?.publicKey,
            methods:
              finalFunctionCallKey?.allowMethods.anyMethod === false
                ? finalFunctionCallKey?.allowMethods.methodNames
                : [],
            contract_id: finalFunctionCallKey?.contractId,
            ...restOptions,
          },
          network: this._networkId as ENearNetwork,
          forceExecutionTargetConfig: this._forceTargetPlatformConfig,
        },
      );

    if (response.success) {
      const { allKeys, accountId } = response.payload;

      if (keyPairToAdd != null) {
        await this._keyStore.setKey(this._networkId, accountId, keyPairToAdd);
      }

      return {
        success: true,
        endTags: [],
        payload: {
          accessKey: keyPairToAdd,
          accountId,
          signedMessage: response.payload.signedMessage,
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
  async signOut({
    accountIdentifier,
    functionCallKey,
  }: IWithAccountIdentifier & { functionCallKey?: AddFunctionCallKeyParams }) {
    if (functionCallKey != null) {
      const inputs: IDappAction_Logout_Data = {
        accountId: accountIdentifier.accountId,
        contractInfo: {
          contract_id: functionCallKey.contractId,
          public_key: functionCallKey.publicKey,
        },
      };

      this.logger.log(
        `Signing out account [${accountIdentifier.accountId ?? "<unknown>"}]`,
        inputs,
      );

      const response = await getMeteorPostMessenger().connectAndWaitForResponse({
        actionType: EExternalActionType.logout,
        inputs,
        network: this._networkId as ENearNetwork,
        forceExecutionTargetConfig: this._forceTargetPlatformConfig,
      });
    }

    this.logger.log(`Signed out account [${accountIdentifier.accountId ?? "<unknown>"}]`);
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
    accountIdentifier,
  }: Omit<IODappAction_SignMessage_Input, "accountId"> & IWithAccountIdentifier): Promise<
    IMeteorActionResponse_Output<IODappAction_SignMessage_Output>
  > {
    const _accountId = accountIdentifier.accountId;

    this.logger.log(
      `Requesting sign message for account [${_accountId ?? "<unknown>"}] with message [${message}]`,
    );

    const response =
      await getMeteorPostMessenger().connectAndWaitForResponse<IODappAction_SignMessage_Output>({
        actionType: EExternalActionType.sign_message,
        inputs: {
          message,
          nonce,
          recipient,
          callbackUrl,
          state,
          accountId: _accountId,
        },
        network: this._networkId as ENearNetwork,
        forceExecutionTargetConfig: this._forceTargetPlatformConfig,
      });
    if (response.success) {
      response.payload.state = state;
      this.logger.log(
        `Successfully signed message for account [${_accountId ?? "<unknown>"}] with message [${message}]`,
      );
      return response;
    }

    throw new MeteorActionError({
      endTags: response.endTags,
      message: response.message,
    });
  }

  /**
   * Sign transactions using Meteor Wallet. Will return a promise with an array of `FinalExecutionOutcome`
   * of the given transactions.
   * */
  async requestSignTransactions(
    inputs: IORequestSignTransactions_Inputs & IWithMeteorWalletAccount,
  ): Promise<FinalExecutionOutcome[]> {
    const { transactions, account: meteorConnectAccount } = inputs;

    const transformedTransactions = await this.transformTransactions({
      transactions,
      meteorConnectAccount,
    });

    this.logger.log(
      `Requesting sign transactions for account [${meteorConnectAccount.identifier.accountId ?? "<unknown>"}] with ${transactions.length} transactions`,
    );

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
          forceExecutionTargetConfig: this._forceTargetPlatformConfig,
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

  async requestSignDelegateActions({
    delegateActions,
    account,
  }: IORequestSignDelegateActions_Input &
    IWithMeteorWalletAccount): Promise<IORequestSignDelegateActions_Output> {
    this.logger.log(
      `Requesting sign delegate action for account [${account.identifier.accountId ?? "<unknown>"}]`,
    );

    const transformedDelegateActions = await this.transformDelegateActions({
      delegateActions,
      meteorConnectAccount: account,
    });

    const response =
      await getMeteorPostMessenger().connectAndWaitForResponse<IODappAction_PostMessage_SignDelegateActions_Output>(
        {
          actionType: EExternalActionType.sign_delegate_actions,
          inputs: {
            delegateActions: transformedDelegateActions
              .map((delegateAction) => serialize(SCHEMA.DelegateAction, delegateAction))
              .map((serialized) => Buffer.from(serialized).toString("base64"))
              .join(","),
          } as IODappAction_PostMessage_SignDelegateActions_Input,
          network: this._networkId as ENearNetwork,
          forceExecutionTargetConfig: this._forceTargetPlatformConfig,
        },
      );

    if (response.success) {
      const deserializedSignedDelegates = response.payload.signedDelegatesWithHashes.map(
        (serializedSignedDelegate) => {
          const signedDelegateData = deserialize(
            SCHEMA.SignedDelegate,
            Buffer.from(serializedSignedDelegate.signedDelegateAction, "base64"),
          ) as SignedDelegate;

          let signatureData:
            | {
                data: Uint8Array;
                keyType: KeyType;
              }
            | undefined;

          if (signedDelegateData.signature.ed25519Signature != null) {
            signatureData = {
              data: signedDelegateData.signature.ed25519Signature.data,
              keyType: KeyType.ED25519,
            };
          }

          if (signedDelegateData.signature.secp256k1Signature != null) {
            signatureData = {
              data: signedDelegateData.signature.secp256k1Signature.data,
              keyType: KeyType.SECP256K1,
            };
          }

          if (signatureData == null) {
            console.error("Received signature data in unexpected format", signedDelegateData);
            throw new Error("Couldn't extract signature data received from Meteor Wallet");
          }

          const signature = new Signature(signatureData);

          const delegateAction = new DelegateAction({ ...signedDelegateData.delegateAction });
          const signedDelegate = new SignedDelegate({
            delegateAction,
            signature,
          });

          return {
            delegateHash: Buffer.from(serializedSignedDelegate.delegateHash, "base64"),
            signedDelegate,
          } satisfies ISignDelegateActionReturn;
        },
      );

      return {
        signedDelegatesWithHashes: deserializedSignedDelegates,
      };
    }

    throw new MeteorActionError({
      endTags: response.endTags,
      message: response.message,
    });
  }

  /**
   * Returns the current connected wallet account
   */
  async getConnectedAccount(
    meteorConnectAccount: IMeteorConnectAccount,
  ): Promise<ConnectedMeteorWalletAccount> {
    // const currentAccountId = this.getAccountId();
    const currentAccountId = meteorConnectAccount.identifier.accountId;

    if (this._connectedAccount?.accountId !== currentAccountId) {
      // const keyPair = await this._keyStore.getKey(this._networkId, currentAccountId);

      // const keyPairSigner =
      //   keyPair != null ? KeyPairSigner.fromSecretKey(keyPair.toString()) : undefined;

      this._connectedAccount = new ConnectedMeteorWalletAccount(this, meteorConnectAccount);
    }

    if (this._connectedAccount == null) {
      throw new MeteorActionError({
        endTags: [],
        message: "No current account connected to Meteor Wallet",
      });
    }

    return this._connectedAccount;
  }

  async transformDelegateActions({
    delegateActions,
    blockHeightTtl = 200,
    meteorConnectAccount,
  }: {
    delegateActions: TSimpleNearDelegateAction[];
    blockHeightTtl?: number;
    meteorConnectAccount: IMeteorConnectAccount;
  }): Promise<DelegateAction[]> {
    const account = await this.getConnectedAccount(meteorConnectAccount);
    const signer = account.getSigner();
    const provider = account.provider;

    const localKey = await signer?.getPublicKey();

    const accessKey = await account.accessKeyForTransaction(localKey);

    if (!accessKey) {
      throw new Error(`Failed to find matching key for delegate actions`);
    }

    const block = await provider.viewBlock({ finality: "optimistic" });

    return delegateActions.map((delegateAction, idx) => {
      return buildDelegateAction({
        actions: delegateAction.actions,
        receiverId: delegateAction.receiverId,
        senderId: account.accountId,
        publicKey: PublicKey.from(accessKey.public_key),
        nonce: BigInt(accessKey.access_key.nonce) + BigInt(idx + 1),
        maxBlockHeight: BigInt(block.header.height) + BigInt(blockHeightTtl),
      });
    });
  }

  async transformTransactions({
    transactions,
    meteorConnectAccount,
  }: {
    transactions: Array<Optional<Transaction, "signerId">>;
    meteorConnectAccount: IMeteorConnectAccount;
  }) {
    const account = await this.getConnectedAccount(meteorConnectAccount);
    const signer = account.getSigner();
    const provider = account.provider;

    const localKey = await signer?.getPublicKey();

    return Promise.all(
      transactions.map(async (transaction, index) => {
        const accessKey = await account.accessKeyForTransaction(localKey);

        if (!accessKey) {
          throw new Error(
            `Failed to find matching key for transaction sent to ${transaction.receiverId}`,
          );
        }

        const transformedActions = transaction.actions.map((action) =>
          convertSelectorActionToNearAction(action),
        );

        const block = await provider.viewBlock({ finality: "optimistic" });

        return createTransaction(
          account.accountId,
          PublicKey.from(accessKey.public_key),
          transaction.receiverId,
          BigInt(accessKey.access_key.nonce) + BigInt(index) + BigInt(1),
          // new BN(accessKey.access_key.nonce).add(new BN(index)).add(new BN(1)),
          transformedActions,
          utils.serialize.base_decode(block.header.hash),
        );
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
  meteorConnectAccount: IMeteorConnectAccount;

  /** @hidden */
  constructor(
    walletConnection: MeteorWallet,
    meteorConnectAccount: IMeteorConnectAccount,
    // signer?: KeyPairSigner,
  ) {
    super(meteorConnectAccount.identifier.accountId, walletConnection._provider);

    // if (signer != null) {
    //   this.setSigner(signer);
    // }

    this.meteorWallet = walletConnection;
    this.meteorConnectAccount = meteorConnectAccount;
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
    const localKey = await this.getSigner()?.getPublicKey();

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
              actions: actions.map((action) => convertSelectorActionToNearAction(action)),
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
        account: this.meteorConnectAccount,
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

    // const accountData = this.meteorWallet.getAccountInfo();
    // if (accountData == null) {
    //   return null;
    // }

    const walletKeys = this.meteorConnectAccount.publicKeys.map((key) => key.publicKey);

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
