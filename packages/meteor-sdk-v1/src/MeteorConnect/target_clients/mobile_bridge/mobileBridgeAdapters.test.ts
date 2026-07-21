import { describe, expect, it } from "bun:test";
import { act_impl_near, EMeteorAppId } from "@meteorwallet/connect-shared";
import { KeyPair } from "@near-js/crypto";
import { actionCreators } from "@near-js/transactions";
import type { IMeteorConnection_V2_BridgeMobile } from "../../MeteorConnect.types";
import { mobileBridgeResultToSdk } from "./mobileBridgeResultToSdk";
import { nearActionToConnectorAction, nearActionToMobileBridge } from "./nearActionToMobileBridge";

const account = {
  identifier: {
    blockchain: "near" as const,
    network: "testnet" as const,
    accountId: "alice.testnet",
  },
  publicKeys: [],
  connection: { executionTarget: "v1_web" as const },
};

const mobileConnection: IMeteorConnection_V2_BridgeMobile = {
  executionTarget: "v2_bridge_mobile" as const,
  schemaVersion: 1 as const,
  bridgeEnvironmentId: "test-environment",
  meteorAppId: EMeteorAppId.meteor_wallet_mobile_dev,
  partnerClientId: "partner-1",
  walletVerifyPublicKey: "ed25519::raw_base64::d2FsbGV0",
};

describe("Meteor mobile bridge NEAR adapters", () => {
  it("converts every established NEAR transaction action to JSON-safe connector values", () => {
    const publicKey = KeyPair.fromRandom("ed25519").getPublicKey();
    const actions = [
      actionCreators.createAccount(),
      actionCreators.deployContract(new Uint8Array([1, 2, 3])),
      actionCreators.functionCall("set", new Uint8Array([0xff, 0x00]), 30n, 4n),
      actionCreators.transfer(5n),
      actionCreators.stake(6n, publicKey),
      actionCreators.addKey(publicKey, actionCreators.fullAccessKey()),
      actionCreators.addKey(
        publicKey,
        actionCreators.functionCallAccessKey("contract.testnet", ["set"], 7n),
      ),
      actionCreators.deleteKey(publicKey),
      actionCreators.deleteAccount("beneficiary.testnet"),
    ];

    const converted = actions.map(nearActionToConnectorAction);
    expect(converted.map((action) => action.type)).toEqual([
      "CreateAccount",
      "DeployContract",
      "FunctionCall",
      "Transfer",
      "Stake",
      "AddKey",
      "AddKey",
      "DeleteKey",
      "DeleteAccount",
    ]);
    expect(JSON.parse(JSON.stringify(converted))).toEqual(converted);
    expect(converted[1]?.params.codeEncoding).toBe("base64");
    expect(converted[2]?.params.argsEncoding).toBe("base64");
  });

  it("rejects an empty transaction batch before bridge creation", async () => {
    await expect(
      nearActionToMobileBridge({
        id: "near::sign_transactions",
        expandedInput: { account, target: account.identifier, transactions: [] },
      }),
    ).rejects.toThrow("mobile_bridge_empty_transactions");
  });

  it("generates a function-call key locally without placing private material in the request", async () => {
    const prepared = await nearActionToMobileBridge({
      id: "near::sign_in",
      expandedInput: {
        target: { blockchain: "near", network: "testnet" },
        addFunctionCallKey: {
          contractId: "guestbook.testnet",
          allowMethods: { anyMethod: false, methodNames: ["addMessage"] },
        },
      },
    });
    expect(prepared.pendingFunctionCallKey).toBeDefined();
    const serializedRequest = JSON.stringify(prepared.actionRequest);
    expect(serializedRequest).toContain(prepared.pendingFunctionCallKey!.getPublicKey().toString());
    expect(serializedRequest).not.toContain(prepared.pendingFunctionCallKey!.toString());
  });

  it("uses singular and plural shared transaction actions by cardinality", async () => {
    const transaction = { receiverId: "receiver.testnet", actions: [actionCreators.transfer(1n)] };
    const singular = await nearActionToMobileBridge({
      id: "near::sign_transactions",
      expandedInput: { account, target: account.identifier, transactions: [transaction] },
    });
    const plural = await nearActionToMobileBridge({
      id: "near::sign_transactions",
      expandedInput: {
        account,
        target: account.identifier,
        transactions: [transaction, transaction],
      },
    });
    expect(singular.sharedActionId).toBe("sign_and_send_transaction");
    expect(plural.sharedActionId).toBe("sign_and_send_transactions");
  });

  it("hydrates a signed sign-in result and accepts an account with no public key", async () => {
    const prepared = await nearActionToMobileBridge({
      id: "near::sign_in",
      expandedInput: { target: { blockchain: "near", network: "testnet" } },
    });
    const result = act_impl_near.action.sign_in
      .request({ network: "testnet" })
      .successResult([{ accountId: "alice.testnet" }])
      .toJsonObject();
    const converted = await mobileBridgeResultToSdk(
      prepared,
      { result, signatureVerified: true, timestamp: Date.now() },
      { connection: mobileConnection },
    );
    expect(converted.identifier.accountId).toBe("alice.testnet");
    expect(converted.publicKeys).toEqual([]);
    expect(converted.connection).toEqual(mobileConnection);
  });

  it("rejects a tampered signed output hash", async () => {
    const prepared = await nearActionToMobileBridge({
      id: "near::sign_in",
      expandedInput: { target: { blockchain: "near", network: "testnet" } },
    });
    const result = act_impl_near.action.sign_in
      .request({ network: "testnet" })
      .successResult([{ accountId: "alice.testnet" }])
      .toJsonObject();
    await expect(
      mobileBridgeResultToSdk(
        prepared,
        {
          result: { ...result, outputHash: "tampered" },
          signatureVerified: true,
          timestamp: Date.now(),
        },
        { connection: mobileConnection },
      ),
    ).rejects.toThrow("mobile_bridge_output_hash_mismatch");
  });

  it("rejects a validly signed result produced by the wrong NEAR account", async () => {
    const prepared = await nearActionToMobileBridge({
      id: "near::sign_message",
      expandedInput: {
        account,
        target: account.identifier,
        messageParams: {
          message: "hello",
          recipient: "example.testnet",
          nonce: new Uint8Array(32),
        },
      },
    });
    const result = act_impl_near.action.sign_message
      .request({
        signerId: "alice.testnet",
        network: "testnet",
        message: "hello",
        recipient: "example.testnet",
        nonceBase64: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
      })
      .successResult({
        accountId: "mallory.testnet",
        publicKey: KeyPair.fromRandom("ed25519").getPublicKey().toString(),
        signature: "c2lnbmF0dXJl",
      })
      .toJsonObject();
    await expect(
      mobileBridgeResultToSdk(
        prepared,
        { result, signatureVerified: true, timestamp: Date.now() },
        { connection: mobileConnection },
      ),
    ).rejects.toThrow("mobile_bridge_result_account_mismatch");
  });

  it("rejects inconsistent sign-in account and signed-message pairs", async () => {
    const prepared = await nearActionToMobileBridge({
      id: "near::sign_in_and_sign_message",
      expandedInput: {
        target: { blockchain: "near", network: "testnet" },
        messageParams: {
          message: "hello",
          recipient: "example.testnet",
          nonce: new Uint8Array(32),
        },
      },
    });
    const result = act_impl_near.action.sign_in_and_sign_message
      .request({
        network: "testnet",
        messageParams: {
          message: "hello",
          recipient: "example.testnet",
          nonceBase64: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        },
      })
      .successResult([
        {
          accountId: "alice.testnet",
          signedMessage: {
            accountId: "mallory.testnet",
            publicKey: KeyPair.fromRandom("ed25519").getPublicKey().toString(),
            signature: "c2lnbmF0dXJl",
          },
        },
      ])
      .toJsonObject();
    await expect(
      mobileBridgeResultToSdk(
        prepared,
        { result, signatureVerified: true, timestamp: Date.now() },
        { connection: mobileConnection },
      ),
    ).rejects.toThrow("mobile_bridge_result_account_mismatch");
  });
});
