import { describe, expect, it } from "bun:test";
import { create_bun_test_local_storage } from "../../ported_common/utils/storage/bun_test/create_bun_test_local_storage.ts";
import type {
  IMCActionDef_Near_SignIn,
  IMCActionDef_Near_SignMessage,
} from "../action/mc_action.near.ts";
import { MeteorConnect } from "../MeteorConnect.ts";
import type {
  IMeteorConnectAccount,
  TMeteorConnectAccountNetwork,
} from "../MeteorConnect.types.ts";
import { GUESTBOOK_CONTRACT_ID } from "./MeteorConnect.test.static.ts";
import { test_createSimpleNonce } from "./test_utils/createSimpleNonce.ts";
import { initializeMeteorConnectTest } from "./test_utils/InitializeMeteorConnectTest.ts";

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
        /*const res = await meteorConnect.makeActionRequest({
          id: "near::sign_in",
          input: {
            connection: {
              platformTarget: "test",
            },
            target: {
              network: network,
              blockchain: "near",
            },
          },
        });*/

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

        expect(response.outcome).toBeDefined();
        expect(response.outcome.publicKeys.length).toEqual(1);
        expect(response.outcome.identifier.blockchain).toEqual("near");
        expect(response.outcome.identifier.accountId).toBeString();

        createdAccounts.push(response.outcome);

        const splitId = response.outcome.identifier.accountId.split(".");

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

    it("should be able to sign a NEAR message", async () => {
      const { meteorConnect, addedAccounts } = await initializeMeteorConnectTest({
        addTestnetAccount: true,
      });

      const [account] = addedAccounts;

      const response = await meteorConnect.actionRequest<IMCActionDef_Near_SignMessage>({
        actionId: "near::sign_message",
        messageParams: {
          message: "hello",
          nonce: test_createSimpleNonce(),
          recipient: GUESTBOOK_CONTRACT_ID,
        },
        target: account.identifier,
      });

      expect(response.outcome).toBeDefined();
      expect(response.outcome.accountId).toEqual(account.identifier.accountId);
    });
  });
});
