import type { PartialBy } from "../ported_common/utils/special_typescript_types.ts";
import { CEnvironmentStorageAdapter } from "../ported_common/utils/storage/EnvironmentStorageAdapter.ts";
import {
  createTypedStorageHelper,
  type ITypedStorageHelper,
} from "../ported_common/utils/storage/TypedStorageHelper.ts";
import { MCActionRegistryMap, type TMCActionRegistry } from "./action/mc_action.combined.ts";
import type {
  TMCActionRequestUnion,
  TMCActionRequestUnionExpandedInput,
} from "./action/mc_action.types.ts";
import { METEOR_CONNECT_STORAGE_KEY_PREFIX } from "./MeteorConnect.static.ts";
import type {
  IMeteorConnect_Initialize_Input,
  IMeteorConnectAccount,
  IMeteorConnectAccountIdentifier,
  IMeteorConnectNetworkTarget,
  IMeteorConnectTypedStorage,
  TMCLoggingLevel,
  TMeteorConnectionExecutionTarget,
  TMeteorConnectionTarget,
} from "./MeteorConnect.types.ts";
import { MeteorConnectTestClient } from "./target_clients/test_client/MeteorConnectTestClient.ts";
import { MeteorConnectV1Client } from "./target_clients/v1_client/MeteorConnectV1Client.ts";
import { accountTargetToText } from "./utils/accountTargetToText.ts";
import { initProp } from "./utils/initProp.ts";
import { isEqual } from "./utils/isEqual.ts";

export class MeteorConnect {
  // private _isInitialized: boolean = false;
  private _localStorageAdapter = initProp<CEnvironmentStorageAdapter>();
  private _typedStorageHelper = initProp<ITypedStorageHelper<IMeteorConnectTypedStorage>>();
  private loggingLevel: TMCLoggingLevel = "basic";

  setLoggingLevel(level: TMCLoggingLevel): void {
    this.loggingLevel = level;
  }

  getLoggingLevel(): TMCLoggingLevel {
    return this.loggingLevel;
  }

  private log(actionDescription: string, meta?: any) {
    if (this.loggingLevel === "none") {
      return;
    }

    if (this.loggingLevel === "basic") {
      console.log(this.formatMsg(actionDescription));
    }

    if (this.loggingLevel === "debug") {
      console.log(this.formatMsg(actionDescription), meta);
    }
  }

  private formatMsg(message: string): string {
    return `MeteorConnect: ${message}`;
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

    this.log("Initialized");
  }

  private get storage() {
    return this._typedStorageHelper.get();
  }

  async getAvailablePlatforms(): Promise<TMeteorConnectionExecutionTarget[]> {
    return ["v1_web"];
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

  private async removeSignedInAccount(identifier: IMeteorConnectAccountIdentifier): Promise<void> {
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
        this.formatMsg(`Account at [${accountTargetToText(accountIdentifier)}] does not exist`),
      );
    }

    return account;
  }

  private async makeTargetedActionRequest<
    R extends TMCActionRequestUnionExpandedInput<TMCActionRegistry>,
  >(
    request: R,
    connection: TMeteorConnectionTarget,
  ): Promise<{ output: TMCActionRegistry[R["id"]]["output"] }> {
    this.log(`Requesting action [${request.id}] for connection [${connection.executionTarget}]`);

    if (connection.executionTarget === "v1_web" || connection.executionTarget === "v1_ext") {
      return new MeteorConnectV1Client(this).makeRequest(request, connection);
    }

    if (connection.executionTarget === "test") {
      return new MeteorConnectTestClient(this).makeRequest(request, connection);
    }

    throw new Error(
      `MeteorConnect Request: Platform [${connection["platformTarget"]}] not implemented`,
    );
  }

  async createExecutableAction<R extends TMCActionRequestUnionExpandedInput<TMCActionRegistry>>(
    request: R,
  ) {}

  async actionRequest<R extends TMCActionRequestUnion<TMCActionRegistry>>(
    request: R,
  ): Promise<TMCActionRegistry[R["id"]]["output"]> {
    if (request.id === "near::sign_in") {
      const response = await this.makeTargetedActionRequest(
        {
          id: request.id,
          expandedInput: request.input,
        },
        request.input.connection,
      );

      await this.addSignedInAccount(response.output);

      return response.output;
    }

    const expandedInput: any = {
      ...request.input,
    };

    let connection: any = expandedInput.connection;

    const meta = MCActionRegistryMap[request.id].meta;

    if (meta.inputTransform.some((i) => i === "targeted_account")) {
      const account = await this.getAccountOrThrow(request.input.target);
      expandedInput.account = account;
      connection = account.connection;
    }

    if (connection == null) {
      throw new Error(
        this.formatMsg("Couldn't find a connection configuration to complete the wallet action"),
      );
    }

    const response = await this.makeTargetedActionRequest(
      {
        id: request.id,
        expandedInput: expandedInput,
      },
      connection,
    );

    return response.output;
  }
}
