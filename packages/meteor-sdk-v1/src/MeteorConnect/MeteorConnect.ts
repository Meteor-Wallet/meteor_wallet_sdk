import type { PartialBy } from "../ported_common/utils/special_typescript_types.ts";
import { CEnvironmentStorageAdapter } from "../ported_common/utils/storage/EnvironmentStorageAdapter.ts";
import {
  createTypedStorageHelper,
  type ITypedStorageHelper,
} from "../ported_common/utils/storage/TypedStorageHelper.ts";
import type {
  IMeteorConnect_Initialize_Input,
  IMeteorConnectAccount,
  IMeteorConnectAccountIdentifier,
  IMeteorConnectNetworkTarget,
  IMeteorConnectTypedStorage,
  TNetworkTargetKey,
} from "./MeteorConnect.types.ts";
import { initProp } from "./utils/initProp.ts";
import { isEqual } from "./utils/isEqual.ts";

export class MeteorConnect {
  // private _isInitialized: boolean = false;
  private _localStorageAdapter = initProp<CEnvironmentStorageAdapter>();
  private _typedStorageHelper = initProp<ITypedStorageHelper<IMeteorConnectTypedStorage>>();

  async initialize({ storage }: IMeteorConnect_Initialize_Input) {
    const storageAdapter = new CEnvironmentStorageAdapter(storage);

    this._localStorageAdapter.set(storageAdapter);
    this._typedStorageHelper.set(
      createTypedStorageHelper({ storageAdapter, keyPrefix: "met_data_" }),
    );
    // this._isInitialized = true;
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
          account.identifier.accountType === networkTarget.accountType &&
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
      accountType: accountIdentifier.accountType,
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
        const networkKey: TNetworkTargetKey = `${accountIdentifier.accountType}::${accountIdentifier.network}`;

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
}
