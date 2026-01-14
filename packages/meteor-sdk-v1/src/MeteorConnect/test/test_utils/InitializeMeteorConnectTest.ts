import type { ILocalStorageInterface } from "../../../ported_common/utils/storage/storage.types.ts";
import type { CEnvironmentStorageAdapter } from "../../../ported_common/utils/storage/EnvironmentStorageAdapter.ts";
import {
  createTypedStorageHelper,
  type ITypedStorageHelper,
} from "../../../ported_common/utils/storage/TypedStorageHelper.ts";
import type {
  IMeteorConnectAccount,
  IMeteorConnectNetworkTarget,
  IMeteorConnectTypedStorage,
} from "../../MeteorConnect.types.ts";
import { MeteorConnect } from "../../MeteorConnect.ts";
import {
  create_bun_test_local_storage_with_adapter,
} from "../../../ported_common/utils/storage/bun_test/create_bun_test_local_storage.ts";
import { METEOR_CONNECT_STORAGE_KEY_PREFIX } from "../../MeteorConnect.static.ts";
import type { IMCActionDef_Near_SignIn } from "../../action/mc_action.near.types.ts";

interface IMeteorConnectTestInitialized {
  storageInterface: ILocalStorageInterface;
  storage: CEnvironmentStorageAdapter;
  typedStorage: ITypedStorageHelper<IMeteorConnectTypedStorage>;
  meteorConnect: MeteorConnect;
  addedAccounts: IMeteorConnectAccount[];
}

interface IInitializeMeteorConnectTest_Input {
  initialLocalStorageData?: Record<string, string | undefined>;
  addNetworkAccounts?: IMeteorConnectNetworkTarget[];
  addTestnetAccount?: boolean;
}

export async function initializeMeteorConnectTest({
  initialLocalStorageData,
  addNetworkAccounts = [],
  addTestnetAccount = false,
}: IInitializeMeteorConnectTest_Input = {}): Promise<IMeteorConnectTestInitialized> {
  const storage = create_bun_test_local_storage_with_adapter(initialLocalStorageData);
  const meteorConnect = new MeteorConnect();

  const typedStorage = createTypedStorageHelper<IMeteorConnectTypedStorage>({
    storageAdapter: storage.storage,
    keyPrefix: METEOR_CONNECT_STORAGE_KEY_PREFIX,
  });

  meteorConnect.setLoggingLevel("none");

  await meteorConnect.initialize({
    storage: storage.storageInterface,
  });

  const addedAccounts: IMeteorConnectAccount[] = [];

  if (addNetworkAccounts.length === 0 && addTestnetAccount) {
    addNetworkAccounts.push({
      network: "testnet",
      blockchain: "near",
    });
  }

  if (addNetworkAccounts.length > 0) {
    for (const networkTarget of addNetworkAccounts) {
      const response = await meteorConnect.actionRequest<IMCActionDef_Near_SignIn>({
        actionId: "near::sign_in",
        connection: {
          platformTarget: "test",
        },
        target: networkTarget,
      });

      addedAccounts.push(response.outcome);
    }
  }

  return {
    meteorConnect,
    typedStorage,
    addedAccounts,
    ...storage,
  };
}