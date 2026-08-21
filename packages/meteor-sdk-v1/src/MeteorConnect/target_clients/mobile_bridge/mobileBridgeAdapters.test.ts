import { describe, expect, it } from "bun:test";
import { act_impl_near, EMeteorAppId } from "@meteorwallet/connect-shared";
import { KeyPair } from "@near-js/crypto";
import { actionCreators } from "@near-js/transactions";
import type { IMeteorConnection_V2_BridgeMobile } from "../../MeteorConnect.types";
import type {
  IMobileBridgePreparedAction,
  TMobileNearActionId,
} from "./MeteorConnectMobileBridgeClient.types";
import { nearOutputToSdk } from "./mobileBridgeOutputToSdk";
import { nearActionToConnectorAction, sdkActionToMobileBridge } from "./sdkActionToMobileBridge";

/**
 * What `PartnerSessionClient.waitForValidatedResult` hands the SDK: the wallet's signed result
 * after the client has already verified the signature, matched the action domain/id, bound the
 * result envelope to the signed turn, and run the action's own output schema. Reproducing that
 * last step here keeps these adapter tests on the same value the runtime sees — the checks above
 * it are the client's and are no longer this layer's to make.
 */
function nearActionId(prepared: IMobileBridgePreparedAction): TMobileNearActionId {
  if (prepared.kind.domain !== "near") throw new Error("expected a NEAR prepared action");
  return prepared.kind.sharedActionId;
}

function validatedOutput(
  prepared: IMobileBridgePreparedAction,
  wireResult: { result: { ok: boolean; output?: unknown } },
): unknown {
  if (!wireResult.result.ok) throw new Error("expected a successful signed result");
  return act_impl_near.actionForId(nearActionId(prepared)).validateOutput(wireResult.result.output);
}

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
      sdkActionToMobileBridge({
        id: "near::sign_transactions",
        expandedInput: { account, target: account.identifier, transactions: [] },
      }),
    ).rejects.toThrow("mobile_bridge_empty_transactions");
  });

  it("generates a function-call key locally without placing private material in the request", async () => {
    const prepared = await sdkActionToMobileBridge({
      id: "near::sign_in",
      expandedInput: {
        target: { blockchain: "near", network: "testnet" },
        addFunctionCallKey: {
          contractId: "guestbook.testnet",
          allowMethods: { anyMethod: false, methodNames: ["addMessage"] },
        },
      },
    });
    expect((prepared.kind as any).pendingFunctionCallKey).toBeDefined();
    const serializedRequest = JSON.stringify(prepared.actionRequest);
    expect(serializedRequest).toContain(
      ((prepared.kind as any).pendingFunctionCallKey as KeyPair).getPublicKey().toString(),
    );
    expect(serializedRequest).not.toContain(
      ((prepared.kind as any).pendingFunctionCallKey as KeyPair).toString(),
    );
  });

  it("uses singular and plural shared transaction actions by cardinality", async () => {
    const transaction = { receiverId: "receiver.testnet", actions: [actionCreators.transfer(1n)] };
    const singular = await sdkActionToMobileBridge({
      id: "near::sign_transactions",
      expandedInput: { account, target: account.identifier, transactions: [transaction] },
    });
    const plural = await sdkActionToMobileBridge({
      id: "near::sign_transactions",
      expandedInput: {
        account,
        target: account.identifier,
        transactions: [transaction, transaction],
      },
    });
    expect(singular.kind.sharedActionId).toBe("sign_and_send_transaction");
    expect(plural.kind.sharedActionId).toBe("sign_and_send_transactions");
  });

  it("hydrates a signed sign-in result and accepts an account with no public key", async () => {
    const prepared = await sdkActionToMobileBridge({
      id: "near::sign_in",
      expandedInput: { target: { blockchain: "near", network: "testnet" } },
    });
    const result = act_impl_near.action.sign_in
      .request({ network: "testnet" })
      .successResult([
        {
          accountId: "alice.testnet",
          publicKey: KeyPair.fromRandom("ed25519").getPublicKey().toString(),
        },
      ])
      .toJsonObject();
    const converted = await nearOutputToSdk(prepared, validatedOutput(prepared, result), {
      getConnection: () => mobileConnection,
    });
    expect(converted.identifier.accountId).toBe("alice.testnet");
    expect(converted.publicKeys).toEqual([]);
    expect(converted.connection).toEqual(mobileConnection);
  });

  it("records only the function-call key added for the dApp", async () => {
    const addedPublicKey = KeyPair.fromRandom("ed25519").getPublicKey().toString();
    const walletPrimaryKey = KeyPair.fromRandom("ed25519").getPublicKey().toString();
    const addFunctionCallKey = {
      contractId: "guestbook.testnet",
      publicKey: addedPublicKey,
      allowMethods: { anyMethod: false as const, methodNames: ["addMessage"] },
    };
    const prepared = await sdkActionToMobileBridge({
      id: "near::sign_in",
      expandedInput: {
        target: { blockchain: "near", network: "testnet" },
        addFunctionCallKey,
      },
    });
    const result = act_impl_near.action.sign_in
      .request({ network: "testnet", addFunctionCallKey })
      .successResult([{ accountId: "alice.testnet", publicKey: walletPrimaryKey }])
      .toJsonObject();

    const converted = await nearOutputToSdk(prepared, validatedOutput(prepared, result), {
      getConnection: () => mobileConnection,
    });

    expect(converted.publicKeys).toEqual([
      {
        type: "ed25519",
        publicKey: addedPublicKey,
        meta: { addFunctionCallKey },
      },
    ]);
  });

  it("refuses an output that fails the action's own schema before any hydration runs", async () => {
    // Signature, turn binding, and the output-hash recompute are the session client's job now
    // (`waitForValidatedResult` returns a `mismatch` arm for each). What still fails closed at
    // this boundary is the action's own output schema — the same check the client runs, asserted
    // here on the exact value the adapter would otherwise be handed.
    const prepared = await sdkActionToMobileBridge({
      id: "near::sign_in",
      expandedInput: { target: { blockchain: "near", network: "testnet" } },
    });
    expect(() =>
      act_impl_near.actionForId(nearActionId(prepared)).validateOutput([{ notAnAccount: 1 }]),
    ).toThrow();
  });

  it("rejects a sign-in result that carries no accounts at all", async () => {
    const prepared = await sdkActionToMobileBridge({
      id: "near::sign_in",
      expandedInput: { target: { blockchain: "near", network: "testnet" } },
    });
    await expect(
      nearOutputToSdk(prepared, [], { getConnection: () => mobileConnection }),
    ).rejects.toThrow("mobile_bridge_sign_in_returned_no_accounts");
  });

  it("rejects a validly signed result produced by the wrong NEAR account", async () => {
    const prepared = await sdkActionToMobileBridge({
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
      nearOutputToSdk(prepared, validatedOutput(prepared, result), {
        getConnection: () => mobileConnection,
      }),
    ).rejects.toThrow("mobile_bridge_result_account_mismatch");
  });

  it("rejects inconsistent sign-in account and signed-message pairs", async () => {
    const prepared = await sdkActionToMobileBridge({
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
      nearOutputToSdk(prepared, validatedOutput(prepared, result), {
        getConnection: () => mobileConnection,
      }),
    ).rejects.toThrow("mobile_bridge_result_account_mismatch");
  });
});
