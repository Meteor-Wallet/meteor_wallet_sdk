import "cross-fetch/polyfill";
import "../../../../frontend_controller/web/adapters/hashing.adapter.web.ts";
import "../../../../frontend_controller/web/adapters/bip39.adapter.ts";
import { initializeBlockchains } from "../../initializeBlockchains.ts";
import { Account } from "../../../core/account/Account.ts";
import { NearKeyPairSigner } from "../signers/NearKeyPairSigner.ts";

describe("NearBlockchainTestAccountFeature", () => {
  const [nearBlockchain] = initializeBlockchains();
  let accounts: Account[];
  let testAccount: Account;

  beforeAll(async () => {
    accounts = await nearBlockchain.testAccount().generateTestAccounts(1);
    testAccount = accounts[0];

    console.log(testAccount.basic.id);
    console.log(
      (testAccount.getPrimarySigner() as NearKeyPairSigner).getPrefixedPrivateKeyString(),
    );
  });

  it("Should be able to generate a test account", async () => {
    expect(testAccount.basic.id).toBeDefined();

    const exists = await testAccount.state().checkExistence();

    expect(exists).toBe(true);
  }, 20000);

  it("Should be able to check for amount of native tokens on a generated account", async () => {
    const nativeTokenAmount = await testAccount.tokens().getAvailableNativeTokenAmount();
    expect(nativeTokenAmount.token.isNative).toBe(true);
  }, 20000);
});
