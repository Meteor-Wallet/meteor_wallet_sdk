import { describe, expect, it } from "bun:test";
import { create_bun_test_local_storage } from "../../ported_common/utils/storage/bun_test/create_bun_test_local_storage";
import { MeteorConnect } from "../MeteorConnect";
import type {
  IMeteorConnectAccount,
  TMeteorConnectAccountNetwork,
} from "../MeteorConnect.types.ts";
import { GUESTBOOK_CONTRACT_ID } from "./MeteorConnect.test.static";
import { test_createSimpleNonce } from "./test_utils/createSimpleNonce";
// import type {
//   IMeteorConnectAccount,
//   TMeteorConnectAccountNetwork,
// } from "../MeteorConnect.types.ts";
// import { GUESTBOOK_CONTRACT_ID } from "./MeteorConnect.test.static";
// import { test_createSimpleNonce } from "./test_utils/createSimpleNonce";
import { initializeMeteorConnectTest } from "./test_utils/InitializeMeteorConnectTest";

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
    it("Should by able to use the new action system correctly", async () => {
      const { meteorConnect } = await initializeMeteorConnectTest();

      const signInAction = await meteorConnect.createAction({
        id: "near::sign_in",
        input: {
          target: {
            network: "testnet",
            blockchain: "near",
          },
        },
      });

      expect(signInAction.id).toEqual("near::sign_in");

      const targets = signInAction.getAllExecutionTargetConfigs();

      expect(targets.length).toBeGreaterThan(0);

      const waitForOutput = signInAction.waitForExecutionOutput();

      const response = await signInAction.execute("test");

      expect(response).toBeDefined();
      expect(response.publicKeys.length).toEqual(1);
      expect(response.identifier.blockchain).toEqual("near");
      expect(response.identifier.accountId).toBeString();

      const waitedResponse = await waitForOutput;

      expect(waitedResponse).toEqual(response);

      const responseTwo = await signInAction.execute("test");

      expect(response).toEqual(responseTwo);

      const waitedResponseTwo = await signInAction.waitForExecutionOutput();

      expect(waitedResponseTwo).toEqual(response);

      const signOutAction = await meteorConnect.createAction({
        id: "near::sign_out",
        input: {
          target: response.identifier,
        },
      });

      const signOutWaitPromise = signOutAction.waitForExecutionOutput();

      const signOutResponse = await signOutAction.execute();

      const signOutWaitResponse = await signOutWaitPromise;

      expect(signOutResponse).toBeDefined();
      expect(signOutResponse).toEqual(signOutWaitResponse);
    });

    it("should be able to sign in", async () => {
      const { typedStorage, meteorConnect } = await initializeMeteorConnectTest();

      const networks: TMeteorConnectAccountNetwork[] = ["testnet", "mainnet"];

      const createdAccounts: IMeteorConnectAccount[] = [];

      for (const network of networks) {
        const action = await meteorConnect.createAction({
          id: "near::sign_in",
          input: {
            target: {
              network: network,
              blockchain: "near",
            },
          },
        });

        const response = await action.execute("test");

        expect(response).toBeDefined();
        expect(response.publicKeys.length).toEqual(1);
        expect(response.identifier.blockchain).toEqual("near");
        expect(response.identifier.accountId).toBeString();

        createdAccounts.push(response);

        const splitId = response.identifier.accountId.split(".");

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

      const action = await meteorConnect.createAction({
        id: "near::sign_out",
        input: {
          target: accountsFromStorage[0].identifier,
        },
      });

      await action.execute();

      const accounts = await meteorConnect.getAllAccounts();

      expect(accounts.length).toEqual(0);

      accountsFromStorage = (await typedStorage.getJson("accounts"))!;

      expect(accountsFromStorage).toBeDefined();
      expect(accountsFromStorage.length).toEqual(0);
    });

    it("should be able to sign a NEAR message", async () => {
      const { meteorConnect, addedAccounts } = await initializeMeteorConnectTest({
        addTestnetAccount: true,
      });

      const [account] = addedAccounts;

      const action = await meteorConnect.createAction({
        id: "near::sign_message",
        input: {
          messageParams: {
            message: "hello",
            nonce: test_createSimpleNonce(),
            recipient: GUESTBOOK_CONTRACT_ID,
          },
          target: account.identifier,
        },
      });

      const response = await action.execute();

      expect(response).toBeDefined();
      expect(response.accountId).toEqual(account.identifier.accountId);
    });
  });
});
