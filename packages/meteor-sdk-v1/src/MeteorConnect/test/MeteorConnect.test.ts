import { describe, expect, it } from "bun:test";
import {
  create_bun_test_local_storage,
  create_bun_test_local_storage_with_adapter,
} from "../../ported_common/utils/storage/bun_test/create_bun_test_local_storage.ts";
import type { CEnvironmentStorageAdapter } from "../../ported_common/utils/storage/EnvironmentStorageAdapter.ts";
import type { ILocalStorageInterface } from "../../ported_common/utils/storage/storage.types.ts";
import {
  createTypedStorageHelper,
  type ITypedStorageHelper,
} from "../../ported_common/utils/storage/TypedStorageHelper.ts";
import type { IMCActionDef_Near_SignIn } from "../action/mc_action.near.types.ts";
import { METEOR_CONNECT_STORAGE_KEY_PREFIX } from "../MeteorConnect.static.ts";
import { MeteorConnect } from "../MeteorConnect.ts";
import type {
  IMeteorConnectAccount,
  IMeteorConnectNetworkTarget,
  IMeteorConnectTypedStorage,
  TMeteorConnectAccountNetwork,
} from "../MeteorConnect.types.ts";
import { GUESTBOOK_CONTRACT_ID } from "./MeteorConnect.test.static.ts";
import { test_createSimpleNonce } from "./test_utils/createSimpleNonce.ts";

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

async function initializeMeteorConnectTest({
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

      addedAccounts.push(response.response);
    }
  }

  return {
    meteorConnect,
    typedStorage,
    addedAccounts,
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

      const createdAccounts: IMeteorConnectAccount[] = [];

      for (const network of networks) {
        const response = await meteorConnect.actionRequest<IMCActionDef_Near_SignIn>({
          actionId: "near::sign_in",
          connection: {
            platformTarget: "test",
          },
          target: {
            network: network,
            blockchain: "near",
          },
        });

        expect(response.request.actionId).toEqual("near::sign_in");

        expect(response.response).toBeDefined();
        expect(response.response.publicKeys.length).toEqual(1);
        expect(response.response.identifier.blockchain).toEqual("near");
        expect(response.response.identifier.accountId).toBeString();

        createdAccounts.push(response.response);

        const splitId = response.response.identifier.accountId.split(".");

        expect(splitId.length).toEqual(2);
        expect(splitId[1]).toEqual(network === "mainnet" ? "near" : "testnet");
      }

      const accountsFromSdk = await meteorConnect.getAllAccounts();

      expect(accountsFromSdk.length).toEqual(2);

      for (const [index, account] of accountsFromSdk.entries()) {
        expect(createdAccounts[index]).toEqual(account);
      }

      const accountsFromStorage = (await typedStorage.getJson("accounts"))!;

      expect(accountsFromStorage).toBeDefined();
      expect(accountsFromStorage.length).toEqual(2);

      expect(createdAccounts.length).toEqual(2);

      const testnetAccount = (await meteorConnect.getAccount({
        blockchain: "near",
        network: "testnet",
      }))!;

      expect(testnetAccount).toBeDefined();
      expect(testnetAccount).toEqual(createdAccounts[0]);

      const mainnetAccount = (await meteorConnect.getAccount({
        blockchain: "near",
        network: "mainnet",
      }))!;

      expect(mainnetAccount).toBeDefined();
      expect(mainnetAccount).toEqual(createdAccounts[1]);
    });

    it("should be able to sign out", async () => {
      const { typedStorage, meteorConnect } = await initializeMeteorConnectTest({
        addNetworkAccounts: [
          {
            network: "testnet",
            blockchain: "near",
          },
        ],
      });

      let accountsFromStorage = (await typedStorage.getJson("accounts"))!;

      expect(accountsFromStorage).toBeDefined();
      expect(accountsFromStorage.length).toEqual(1);

      await meteorConnect.actionRequest({
        actionId: "near::sign_out",
        target: accountsFromStorage[0].identifier,
      });

      const accounts = await meteorConnect.getAllAccounts();

      expect(accounts.length).toEqual(0);

      accountsFromStorage = (await typedStorage.getJson("accounts"))!;

      expect(accountsFromStorage).toBeDefined();
      expect(accountsFromStorage.length).toEqual(0);
    });

    it("should be able to create Near actions", async () => {
      const { meteorConnect, addedAccounts } = await initializeMeteorConnectTest({
        addTestnetAccount: true,
      });

      const [account] = addedAccounts;

      meteorConnect.actionRequest({
        actionId: "near::sign_message",
        messageParams: {
          message: "hello",
          nonce: test_createSimpleNonce(),
          recipient: GUESTBOOK_CONTRACT_ID,
        },
        target: account.identifier,
      });
    });
  });
});
