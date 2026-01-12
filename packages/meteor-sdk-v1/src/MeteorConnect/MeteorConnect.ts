import type { PartialBy } from "../ported_common/utils/special_typescript_types.ts";
import { CEnvironmentStorageAdapter } from "../ported_common/utils/storage/EnvironmentStorageAdapter.ts";
import {
  createTypedStorageHelper,
  type ITypedStorageHelper,
} from "../ported_common/utils/storage/TypedStorageHelper.ts";
import {
  EMCActionId,
  type IMCRequest_Account_SignOut,
  type IMCResponse_Account_SignIn,
  type TMCActionResponse,
} from "./MeteorConnect.action.types.ts";
import { METEOR_CONNECT_STORAGE_KEY_PREFIX } from "./MeteorConnect.static.ts";
import type {
  IMeteorConnect_Initialize_Input,
  IMeteorConnectAccount,
  IMeteorConnectAccountIdentifier,
  IMeteorConnectNetworkTarget,
  IMeteorConnectTypedStorage,
  TMCLoggingLevel,
  TNetworkTargetKey,
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

      const selectedNetworkAccounts = await this.storage.getJson("selectedNetworkAccounts");

      if (selectedNetworkAccounts != null) {
        const networkKey: TNetworkTargetKey = `${accountIdentifier.blockchain}::${accountIdentifier.network}`;

        const selectedAccountIdentifier = selectedNetworkAccounts[networkKey];

        account = allNetworkAccounts.find((account) => {
          return isEqual(account.identifier, selectedAccountIdentifier);
        });
      }
    }

    if (account == null && networkAccountFallback) {
      account = allNetworkAccounts[0];
    }

    return account;
  }

  private async addAccount(account: IMeteorConnectAccount): Promise<void> {
    const currentAccounts = await this.storage.getJsonOrDef("accounts", []);
    const newAccounts: IMeteorConnectAccount[] = [...currentAccounts, account];
    await this.storage.setJson("accounts", newAccounts);
  }

  private async makeTargetedRequest<R extends TMCActionResponse = TMCActionResponse>(
    request: R["request"],
  ): Promise<R> {
    if (
      request.connection.platformTarget === "v1_web" ||
      request.connection.platformTarget === "v1_ext"
    ) {
      return new MeteorConnectV1Client().makeRequest(request);
    }

    if (request.connection.platformTarget === "test") {
      return new MeteorConnectTestClient().makeRequest(request);
    }

    throw new Error(
      `MeteorConnect Request: Platform [${request.connection["platformTarget"]}] not implemented`,
    );
  }

  async makeRequest<R extends TMCActionResponse = TMCActionResponse>(
    request: R["request"],
  ): Promise<R> {
    this.log(`Action Request [${request.actionId}]`, request);

    if (request.actionId === EMCActionId.account_sign_in) {
      const response = await this.makeTargetedRequest<IMCResponse_Account_SignIn>(request);
      await this.addAccount(response.responsePayload);
      return response as R;
    }

    if (request.actionId === EMCActionId.account_sign_out) {
      const target =
        request.accountId != null
          ? {
              accountId: request.accountId,
              ...request.networkTarget,
            }
          : request.networkTarget;

      const account = await this.getAccount(target);

      if (account == null) {
        throw new Error(
          this.formatMsg(
            `Sign Out: Account [${accountTargetToText(target)}] does not exist to sign out of`,
          ),
        );
      }

      return this.makeTargetedRequest({
        ...request,
        accountId: account.identifier.accountId,
      } as IMCRequest_Account_SignOut);
    }

    return this.makeTargetedRequest(request);
  }
}
