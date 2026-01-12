import { describe, expect, it } from "bun:test";
import {
  create_bun_test_local_storage,
  create_bun_test_local_storage_with_adapter,
} from "../ported_common/utils/storage/bun_test/create_bun_test_local_storage.ts";
import type { CEnvironmentStorageAdapter } from "../ported_common/utils/storage/EnvironmentStorageAdapter.ts";
import type { ILocalStorageInterface } from "../ported_common/utils/storage/storage.types.ts";
import {
  createTypedStorageHelper,
  type ITypedStorageHelper,
} from "../ported_common/utils/storage/TypedStorageHelper.ts";
import { EMCActionId, type IMCResponse_Account_SignIn } from "./MeteorConnect.action.types.ts";
import { METEOR_CONNECT_STORAGE_KEY_PREFIX } from "./MeteorConnect.static.ts";
import { MeteorConnect } from "./MeteorConnect.ts";
import type {
  IMeteorConnectTypedStorage,
  TMeteorConnectAccountNetwork,
} from "./MeteorConnect.types.ts";

interface IMeteorConnectTestInitialized {
  storageInterface: ILocalStorageInterface;
  storage: CEnvironmentStorageAdapter;
  typedStorage: ITypedStorageHelper<IMeteorConnectTypedStorage>;
  meteorConnect: MeteorConnect;
}

async function initializeMeteorConnectTest(
  initialLocalStorageData?: Record<string, string | undefined>,
): Promise<IMeteorConnectTestInitialized> {
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

  return {
    meteorConnect,
    typedStorage,
    ...storage,
  };
}

describe("MeteorConnect", () => {
  it("should be able to initialize", async () => {
    const meteorConnect = new MeteorConnect();
    await expect(async () =>
      meteorConnect.initialize({
        storage: create_bun_test_local_storage(),
      }),
    ).not.toThrow();
  });

  it("should have set the lastInitialized value in storage", async () => {
    const { storage } = await initializeMeteorConnectTest();

    const lastInitialized = await storage.getJson("met_data_lastInitialized");

    expect(lastInitialized).toBeDefined();
  });

  describe("Action Requests", () => {
    it("should be able to sign in", async () => {
      const { typedStorage, meteorConnect } = await initializeMeteorConnectTest();

      const networks: TMeteorConnectAccountNetwork[] = ["testnet", "mainnet"];

      for (const network of networks) {
        const response = await meteorConnect.makeRequest<IMCResponse_Account_SignIn>({
          actionId: EMCActionId.account_sign_in,
          connection: {
            platformTarget: "test",
          },
          networkTarget: {
            network: network,
            blockchain: "near",
          },
        });

        expect(response.request.actionId).toEqual(EMCActionId.account_sign_in);

        expect(response.responsePayload).toBeDefined();
        expect(response.responsePayload.publicKeys.length).toEqual(1);
        expect(response.responsePayload.identifier.blockchain).toEqual("near");
        expect(response.responsePayload.identifier.accountId).toBeString();

        const splitId = response.responsePayload.identifier.accountId.split(".");

        expect(splitId.length).toEqual(2);
        expect(splitId[1]).toEqual(network === "mainnet" ? "near" : "testnet");
      }

      const accountsFromStorage = await typedStorage.getJson("accounts");

      expect(accountsFromStorage).toBeDefined();
      expect(accountsFromStorage!.length).toEqual(2);
    });
  });
});
