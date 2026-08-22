import { BrowserLocalStorageKeyStore } from "@near-js/keystores-browser";
import { jsonStringifyCompat } from "../ported_common/utils/jsonStringifyCompat";
import type { PartialBy } from "../ported_common/utils/special_typescript_types";
import { CEnvironmentStorageAdapter } from "../ported_common/utils/storage/EnvironmentStorageAdapter";
import {
  createTypedStorageHelper,
  type ITypedStorageHelper,
} from "../ported_common/utils/storage/TypedStorageHelper";
import { ExecutableAction } from "./action/ExecutableAction";
import { MCActionRegistryMap, type TMCActionRegistry } from "./action/mc_action.combined";
import type {
  IMCActionMeta,
  TMCActionRequestUnion,
  TMCActionRequestUnionExpandedInput,
} from "./action/mc_action.types";
import { MeteorLogger } from "./logging/MeteorLogger";
import { METEOR_CONNECT_STORAGE_KEY_PREFIX } from "./MeteorConnect.static";
import type {
  IMeteorConnect_Initialize_Input,
  IMeteorConnectAccount,
  IMeteorConnectAccountIdentifier,
  IMeteorConnectNetworkTarget,
  IMeteorConnectTypedStorage,
  TMCLoggingLevel,
  TMeteorConnectionExecutionTarget,
} from "./MeteorConnect.types.ts";
import type { MeteorConnectClientBase } from "./target_clients/base/MeteorConnectClientBase";
import { MeteorConnectMobileBridgeClient } from "./target_clients/mobile_bridge/MeteorConnectMobileBridgeClient";
import { normalizeBridgeBackendUrl } from "./target_clients/mobile_bridge/mobileBridgeStorage";
import { MeteorConnectTestClient } from "./target_clients/test_client/MeteorConnectTestClient";
import { MeteorConnectV1Client } from "./target_clients/v1_client/MeteorConnectV1Client";
import { MeteorConnectNewKeyTransfer } from "./new_key_transfer/MeteorConnectNewKeyTransfer";
import { MeteorConnectTransferAccounts } from "./transfer_accounts/MeteorConnectTransferAccounts";
import { accountTargetToText } from "./utils/accountTargetToText";
import { initProp } from "./utils/initProp";
import { isEqual } from "./utils/isEqual";

const meteorConnectObjectIds = new WeakMap<object, string>();
function objectFingerprint(value: object | undefined): string | undefined {
  if (value == null) return undefined;
  let id = meteorConnectObjectIds.get(value);
  if (id == null) {
    id = crypto.randomUUID();
    meteorConnectObjectIds.set(value, id);
  }
  return id;
}

export class MeteorConnect {
  private _localStorageAdapter = initProp<CEnvironmentStorageAdapter>();
  private _typedStorageHelper = initProp<ITypedStorageHelper<IMeteorConnectTypedStorage>>();
  private isDev: boolean = false;
  private logger = MeteorLogger.createLogger("MeteorConnect");
  private _storageImplementation = initProp<IMeteorConnect_Initialize_Input["storage"]>();
  private _nearKeyStoreProvider =
    initProp<NonNullable<IMeteorConnect_Initialize_Input["nearKeyStoreProvider"]>>();
  private initializeFingerprint?: string;
  private initializePromise?: Promise<void>;
  private browserKeyStore?: BrowserLocalStorageKeyStore;
  private clients: {
    test: MeteorConnectTestClient;
    v1: MeteorConnectV1Client;
    mobileBridge: MeteorConnectMobileBridgeClient;
  } = {
    test: new MeteorConnectTestClient(this),
    v1: new MeteorConnectV1Client(this),
    mobileBridge: new MeteorConnectMobileBridgeClient(this),
  };
  public supportedPlatforms: TMeteorConnectionExecutionTarget[] = [];
  /** The account-transfer surface (staging + popup flow) — one namespace for the whole feature. */
  public readonly transferAccounts = new MeteorConnectTransferAccounts(this);
  /** Secret-free account transfer that grants a newly generated Meteor signer on-chain. */
  public readonly newKeyTransfer = new MeteorConnectNewKeyTransfer(this);

  constructor({ isDev = false }: { isDev?: boolean } = {}) {
    this.isDev = isDev;
  }

  setLoggingLevel(level: TMCLoggingLevel): void {
    MeteorLogger.setGlobalLoggingLevel(level);
  }

  getLoggingLevel(): TMCLoggingLevel {
    return MeteorLogger.getGlobalLoggingLevel();
  }

  get isDevelopment(): boolean {
    return this.isDev;
  }

  get localStorageImplementation() {
    return this._storageImplementation.get();
  }

  get nearKeyStoreProvider() {
    return this._nearKeyStoreProvider.get();
  }

  get mobileBridgeClient(): MeteorConnectMobileBridgeClient {
    return this.clients.mobileBridge;
  }

  async initialize(input: IMeteorConnect_Initialize_Input) {
    const { storage, mobileBridge, nearKeyStoreProvider } = input;
    const fingerprint = JSON.stringify(
      {
        storage: objectFingerprint(storage),
        enabled: mobileBridge?.enabled ?? false,
        backendUrl: normalizeBridgeBackendUrl(
          mobileBridge?.backendUrl ?? "https://mc.meteorwallet.app",
        ),
        meteorAppId:
          mobileBridge?.meteorAppId ??
          (this.isDevelopment ? "meteor_wallet_mobile_dev" : "meteor_wallet_mobile"),
        partnerMetadata: mobileBridge?.partnerMetadata,
        // Part of the fingerprint on purpose: it decides whether NEAR is offered over the session
        // bridge at all, so two initialize() calls that disagree must be a mismatch, never a
        // silently mixed client.
        experimentalNearOverSession: mobileBridge?.experimentalNearOverSession ?? false,
        leaseProvider: objectFingerprint(mobileBridge?.leaseProvider),
        nativeAppOpener: objectFingerprint(mobileBridge?.nativeAppOpener),
        nearKeyStoreProvider: objectFingerprint(nearKeyStoreProvider),
        transferAccounts:
          mobileBridge?.transferAccounts == null
            ? undefined
            : {
                enabled: mobileBridge.transferAccounts.enabled ?? false,
                meteorAppIds: mobileBridge.transferAccounts.meteorAppIds,
                persistStagedAccounts: mobileBridge.transferAccounts.persistStagedAccounts ?? false,
                clearStagedOnSuccess: mobileBridge.transferAccounts.clearStagedOnSuccess ?? false,
                maxStagedAccounts: mobileBridge.transferAccounts.maxStagedAccounts,
              },
      },
      (_key, value) => (typeof value === "function" ? "[function]" : value),
    );
    if (this.initializeFingerprint != null && this.initializeFingerprint !== fingerprint) {
      throw new Error("mobile_bridge_config_mismatch");
    }
    if (this.initializePromise != null) return this.initializePromise;
    this.initializeFingerprint = fingerprint;
    this.initializePromise = this.initializeInternal(storage, mobileBridge, nearKeyStoreProvider);
    return this.initializePromise;
  }

  private async initializeInternal(
    storage: IMeteorConnect_Initialize_Input["storage"],
    mobileBridge: IMeteorConnect_Initialize_Input["mobileBridge"],
    nearKeyStoreProvider: IMeteorConnect_Initialize_Input["nearKeyStoreProvider"],
  ) {
    const storageAdapter = new CEnvironmentStorageAdapter(storage);
    const typedStorageHelper = createTypedStorageHelper<IMeteorConnectTypedStorage>({
      storageAdapter,
      keyPrefix: METEOR_CONNECT_STORAGE_KEY_PREFIX,
    });

    this._localStorageAdapter.set(storageAdapter);
    this._storageImplementation.set(storage);
    this._nearKeyStoreProvider.set(
      nearKeyStoreProvider ?? {
        getKeyStore: () => {
          if (this.browserKeyStore == null) {
            this.browserKeyStore = new BrowserLocalStorageKeyStore(
              window.localStorage,
              "_meteor_wallet",
            );
          }
          return this.browserKeyStore;
        },
      },
    );
    this._typedStorageHelper.set(typedStorageHelper);
    this.clients.mobileBridge.configure(mobileBridge, storage);
    this.transferAccounts.configure(mobileBridge?.transferAccounts);
    this.newKeyTransfer.configure(mobileBridge?.transferAccounts?.enabled === true);

    await typedStorageHelper.setJson("lastInitialized", Date.now());

    this.supportedPlatforms = await Promise.all(
      this.getClients().map((c) => c.getEnvironmentSupportedPlatforms()),
    ).then((platforms) => platforms.flat());

    this.logger.log("Initialized with supported platforms:", this.supportedPlatforms);
  }

  get storage() {
    return this._typedStorageHelper.get();
  }

  get localStorageAdapter() {
    return this._localStorageAdapter.get();
  }

  private getClients(): MeteorConnectClientBase[] {
    let clients: MeteorConnectClientBase[] = [this.clients.v1, this.clients.mobileBridge];

    if (this.isDev) {
      clients = [this.clients.test];
    }

    return clients;
  }

  async updateSignedInAccountConnection(account: IMeteorConnectAccount): Promise<void> {
    const accounts = await this.storage.getJsonOrDef("accounts", []);
    await this.storage.setJson(
      "accounts",
      accounts.map((existing) =>
        isEqual(existing.identifier, account.identifier)
          ? { ...existing, connection: account.connection }
          : existing,
      ),
    );
  }

  async disposeMobileBridge(): Promise<void> {
    await this.clients.mobileBridge.dispose();
    // Staged plaintext secrets are held in memory by this instance; disposal is the point they
    // stop being reachable. Persisted staging (opt-in) is deliberately left alone — dropping it
    // here would destroy data the host asked to keep.
    this.transferAccounts.dropStagedFromMemory();
    this.initializeFingerprint = undefined;
    this.initializePromise = undefined;
  }

  getClientByExecutionTargetId(id: TMeteorConnectionExecutionTarget): MeteorConnectClientBase {
    const clients = this.getClients();
    const client = clients.find((c) => c.executionTargets.some((t) => t === id));

    if (client == null) {
      throw new Error(
        this.logger.formatMsg(`Couldn't find available client for execution target [${id}]`),
      );
    }

    return client;
  }

  async hasAccounts(networkTarget?: IMeteorConnectNetworkTarget): Promise<boolean> {
    const accounts = await this.getAllAccounts(networkTarget);
    return accounts.length > 0;
  }

  async getAllAccounts(
    networkTarget?: IMeteorConnectNetworkTarget,
  ): Promise<IMeteorConnectAccount[]> {
    let accounts = await this.storage.getJsonOrDef("accounts", []);

    if (accounts.length === 0) {
      return [];
    }

    if (networkTarget != null) {
      accounts = accounts.filter((account) => {
        return (
          account.identifier.blockchain === networkTarget.blockchain &&
          account.identifier.network === networkTarget.network
        );
      });
    }

    return accounts ?? [];
  }

  async getAccount(
    accountIdentifier: PartialBy<IMeteorConnectAccountIdentifier, "accountId">,
    networkAccountFallback: boolean = false,
  ): Promise<IMeteorConnectAccount | undefined> {
    this.logger.log(
      `Getting account at [${accountTargetToText(accountIdentifier)}], networkAccountFallback = [${networkAccountFallback}]`,
    );

    const allNetworkAccounts = await this.getAllAccounts({
      blockchain: accountIdentifier.blockchain,
      network: accountIdentifier.network,
    });

    if (allNetworkAccounts.length === 0) {
      return undefined;
    }

    let account: IMeteorConnectAccount | undefined;

    if (accountIdentifier.accountId != null) {
      account = allNetworkAccounts.find((account) => {
        return isEqual(account.identifier, accountIdentifier as IMeteorConnectAccountIdentifier);
      });
    } else {
      networkAccountFallback = true;
    }

    if (account == null && networkAccountFallback) {
      account = allNetworkAccounts[0];
    }

    return account;
  }

  async addSignedInAccount(account: IMeteorConnectAccount): Promise<void> {
    const currentAccounts = await this.storage.getJsonOrDef("accounts", []);
    const newAccounts: IMeteorConnectAccount[] = [...currentAccounts, account];
    await this.storage.setJson("accounts", newAccounts);
  }

  async removeSignedInAccount(identifier: IMeteorConnectAccountIdentifier): Promise<void> {
    const currentAccounts = await this.storage.getJsonOrDef("accounts", []);
    const newAccounts: IMeteorConnectAccount[] = currentAccounts.filter(
      (a) => !isEqual(a.identifier, identifier),
    );
    await this.storage.setJson("accounts", newAccounts);
  }

  async getAccountOrThrow(
    accountIdentifier: PartialBy<IMeteorConnectAccountIdentifier, "accountId">,
  ): Promise<IMeteorConnectAccount> {
    const account = await this.getAccount(accountIdentifier);

    if (account == null) {
      throw new Error(
        this.logger.formatMsg(
          `Account at [${accountTargetToText(accountIdentifier)}] does not exist`,
        ),
      );
    }

    return account;
  }

  async createAction<R extends TMCActionRequestUnion<TMCActionRegistry>>(
    request: R,
  ): Promise<ExecutableAction<R>> {
    const expandedInput: TMCActionRegistry[R["id"]]["expandedInput"] = {
      ...request.input,
    };

    const meta = MCActionRegistryMap[request.id].meta as IMCActionMeta;

    const executionTargetSource = meta.executionTargetSource ?? "on_execution";

    let selectedExecutionTarget: TMeteorConnectionExecutionTarget | undefined;
    let targetedAccount: IMeteorConnectAccount | undefined;

    const addAccountToInput = meta.inputTransform?.some((i) => i === "targeted_account");

    if (addAccountToInput || executionTargetSource === "targeted_account") {
      // Only account-targeted metas reach here; inputs without `target` (e.g. transfer) never do.
      targetedAccount = await this.getAccountOrThrow((request.input as any).target);

      if (addAccountToInput) {
        expandedInput["account"] = targetedAccount;
      }

      if (executionTargetSource === "targeted_account") {
        selectedExecutionTarget = targetedAccount.connection.executionTarget;
      }
    }

    if (executionTargetSource !== "on_execution" && selectedExecutionTarget == null) {
      throw new Error(
        this.logger.formatMsg(
          `Couldn't determine execution target for action [${request.id}] (executionTargetSource = [${executionTargetSource}])`,
        ),
      );
    }

    const clients = this.getClients();

    const expandedRequest = {
      ...request,
      expandedInput,
    } as TMCActionRequestUnionExpandedInput<TMCActionRegistry>;

    const executionConfigs = (
      await Promise.all(clients.map((c) => c.getExecutionTargetConfigs(expandedRequest)))
    ).flat();

    const targetClientAvailable =
      selectedExecutionTarget == null ||
      executionConfigs.some((config) => config.executionTarget === selectedExecutionTarget);

    // Signing out is, from the dApp's side, removal of local state — so it must never be the one
    // action a stranded account cannot perform. Two escapes, and both are `near::sign_out` only:
    //
    //  - the account never received a dApp key, so there is nothing for the wallet to revoke; and
    //  - the account's execution target is not offered by this configuration at all — e.g. an
    //    account persisted with `v2_bridge_mobile` by an older build, now that NEAR is gated off
    //    the session bridge (`experimentalNearOverSession`). The wallet is unreachable, so
    //    removing the local entry is the only thing sign-out can still mean.
    //
    // Every other action for such an account keeps throwing below: a stranded account must still
    // fail loudly for anything that actually needs the wallet.
    const canSignOutLocally =
      request.id === "near::sign_out" &&
      (targetedAccount?.publicKeys.length === 0 || !targetClientAvailable);

    if (executionConfigs.length === 0 && !canSignOutLocally) {
      throw new Error(
        this.logger.formatMsg(`No execution clients found for action [${request.id}]`),
      );
    }

    if (!targetClientAvailable && !canSignOutLocally) {
      throw new Error(
        this.logger.formatMsg(
          `The account for action [${request.id}] is connected through [${selectedExecutionTarget}], but that platform is not available in this Meteor Connect configuration`,
        ),
      );
    }

    this.logger.log(
      `Created action [${request.id}] with possible targets: [${executionConfigs
        .map((c) => c.executionTarget)
        .join(", ")}]`,
      `\n
Targeted Account:
${jsonStringifyCompat({
  targetedAccount,
})}

Platform Target: ${jsonStringifyCompat({
        selectedExecutionTarget,
      })}

Inputs: ${
        request.id === "meteor_wallet_core::transfer_accounts" ||
        request.id === "meteor_wallet_core::new_key_account_transfer_start" ||
        request.id === "meteor_wallet_core::new_key_account_transfer_verify_active"
          ? `{ accounts: ${(expandedRequest.expandedInput as any).allAccountsBasicInfo?.length ?? 0}, ciphertext: ${(expandedRequest.expandedInput as any).encryptedData?.ciphertext?.length ?? 0} base64 chars }`
          : jsonStringifyCompat(expandedRequest.expandedInput)
      }
`,
    );

    return new ExecutableAction(request, expandedRequest.expandedInput, this, {
      allExecutionTargets: executionConfigs,
      contextualExecutionTarget: selectedExecutionTarget,
    });
  }
}
