import type { PartialBy } from "../ported_common/utils/special_typescript_types.ts";
import { CEnvironmentStorageAdapter } from "../ported_common/utils/storage/EnvironmentStorageAdapter.ts";
import {
  createTypedStorageHelper,
  type ITypedStorageHelper,
} from "../ported_common/utils/storage/TypedStorageHelper.ts";
import { ExecutableAction } from "./action/ExecutableAction.ts";
import { MCActionRegistryMap, type TMCActionRegistry } from "./action/mc_action.combined.ts";
import type {
  IMCActionMeta,
  TMCActionRequestUnion,
  TMCActionRequestUnionExpandedInput,
} from "./action/mc_action.types.ts";
import { MeteorLogger } from "./logging/MeteorLogger.ts";
import { METEOR_CONNECT_STORAGE_KEY_PREFIX } from "./MeteorConnect.static.ts";
import type {
  IMeteorConnect_Initialize_Input,
  IMeteorConnectAccount,
  IMeteorConnectAccountIdentifier,
  IMeteorConnectNetworkTarget,
  IMeteorConnectTypedStorage,
  TMCLoggingLevel,
  TMeteorConnectionExecutionTarget,
} from "./MeteorConnect.types.ts";
import type { MeteorConnectClientBase } from "./target_clients/base/MeteorConnectClientBase.ts";
import { MeteorConnectTestClient } from "./target_clients/test_client/MeteorConnectTestClient.ts";
import { MeteorConnectV1Client } from "./target_clients/v1_client/MeteorConnectV1Client.ts";
import { MeteorConnectV2MessengerClient } from "./target_clients/v2_client/MeteorConnectV2MessengerClient.ts";
import { accountTargetToText } from "./utils/accountTargetToText.ts";
import { initProp } from "./utils/initProp.ts";
import { isEqual } from "./utils/isEqual.ts";

export class MeteorConnect {
  private _localStorageAdapter = initProp<CEnvironmentStorageAdapter>();
  private _typedStorageHelper = initProp<ITypedStorageHelper<IMeteorConnectTypedStorage>>();
  private isDev: boolean = false;
  private logger = MeteorLogger.createLogger("MeteorConnect");
  private clients: {
    test: MeteorConnectTestClient;
    v1: MeteorConnectV1Client;
    v2MessengerClient: MeteorConnectV2MessengerClient;
  } = {
    test: new MeteorConnectTestClient(this),
    v1: new MeteorConnectV1Client(this),
    v2MessengerClient: new MeteorConnectV2MessengerClient(this),
  };

  constructor({ isDev = false }: { isDev?: boolean } = {}) {
    this.isDev = isDev;
  }

  setLoggingLevel(level: TMCLoggingLevel): void {
    MeteorLogger.setGlobalLoggingLevel(level);
  }

  getLoggingLevel(): TMCLoggingLevel {
    return MeteorLogger.getGlobalLoggingLevel();
  }

  async initialize({ storage }: IMeteorConnect_Initialize_Input) {
    const storageAdapter = new CEnvironmentStorageAdapter(storage);
    const typedStorageHelper = createTypedStorageHelper<IMeteorConnectTypedStorage>({
      storageAdapter,
      keyPrefix: METEOR_CONNECT_STORAGE_KEY_PREFIX,
    });

    this._localStorageAdapter.set(storageAdapter);
    this._typedStorageHelper.set(typedStorageHelper);

    await typedStorageHelper.setJson("lastInitialized", Date.now());

    this.logger.log("Initialized");
  }

  private get storage() {
    return this._typedStorageHelper.get();
  }

  private getClients(): MeteorConnectClientBase[] {
    let clients: MeteorConnectClientBase[] = [this.clients.v1, this.clients.v2MessengerClient];

    if (this.isDev) {
      clients = [this.clients.test];
    }

    return clients;
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
      targetedAccount = await this.getAccountOrThrow(request.input.target);

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

    if (executionConfigs.length === 0) {
      throw new Error(
        this.logger.formatMsg(`No execution clients found for action [${request.id}]`),
      );
    }

    this.logger.log(
      `Created action [${request.id}] with possible targets: [${executionConfigs
        .map((c) => c.executionTarget)
        .join(", ")}]`,
      `\n
${JSON.stringify({
  targetedAccount,
})}
      
${JSON.stringify({
  selectedExecutionTarget,
})}`,
    );

    return new ExecutableAction(request, expandedRequest.expandedInput, this, {
      allExecutionTargets: executionConfigs,
      contextualExecutionTarget: selectedExecutionTarget,
    });
  }
}
