import { afterEach, describe, expect, it } from "bun:test";
import { KeyPair } from "@near-js/crypto";
import { InMemoryKeyStore } from "@near-js/keystores";
import { actionCreators } from "@near-js/transactions";
import { baseEncode } from "@near-js/utils";
import { ActionUi } from "../action_ui/ActionUi";
import { FunctionCallKeyExecutionError } from "../function_call_key/nearFunctionCallKey";
import { ExecutableAction } from "./ExecutableAction";

const CONTRACT = "guest-book.testnet";
const ACCOUNT_ID = "alice.testnet";
const functionCallKey = KeyPair.fromRandom("ed25519");

const ACCOUNT = {
  identifier: { blockchain: "near", network: "testnet", accountId: ACCOUNT_ID },
  connection: { executionTarget: "v2_bridge_mobile" },
  publicKeys: [
    {
      type: "ed25519",
      publicKey: functionCallKey.getPublicKey().toString(),
      meta: {
        addFunctionCallKey: {
          contractId: CONTRACT,
          publicKey: functionCallKey.getPublicKey().toString(),
          allowMethods: { anyMethod: false, methodNames: ["addMessage"] },
        },
      },
    },
  ],
};

const addMessage = (deposit = 0n) => ({
  receiverId: CONTRACT,
  actions: [
    actionCreators.functionCall("addMessage", { text: "hi" }, 30_000_000_000_000n, deposit),
  ],
});

const originalFetch = globalThis.fetch;
const originalPrompt = ActionUi.shared.prompt;
afterEach(() => {
  globalThis.fetch = originalFetch;
  ActionUi.shared.prompt = originalPrompt;
});

/** RPC double: the on-chain key view, then `send` for every broadcast. */
function stubRpc(send: () => unknown) {
  const calls: string[] = [];
  globalThis.fetch = (async (_url: string, init: { body: string }) => {
    const { method } = JSON.parse(init.body);
    calls.push(method);
    if (method === "query") {
      return {
        json: async () => ({
          result: {
            nonce: 1,
            block_hash: baseEncode(new Uint8Array(32)),
            permission: { FunctionCall: { receiver_id: CONTRACT, method_names: ["addMessage"] } },
          },
        }),
      };
    }
    return { json: async () => send() };
  }) as unknown as typeof fetch;
  return calls;
}

/** Stands in for the wallet popup, recording whether it was ever asked. */
function stubWallet() {
  const prompts: unknown[] = [];
  ActionUi.shared.prompt = (async (input: unknown) => {
    prompts.push(input);
    return "wallet-result";
  }) as unknown as typeof ActionUi.shared.prompt;
  return prompts;
}

async function createAction(transactions: unknown[], extra: Record<string, unknown> = {}) {
  const keyStore = new InMemoryKeyStore();
  await keyStore.setKey("testnet", ACCOUNT_ID, functionCallKey);
  const input = { target: ACCOUNT.identifier, transactions, ...extra };
  return new ExecutableAction(
    { id: "near::sign_transactions", input } as any,
    { ...input, account: ACCOUNT },
    { nearKeyStoreProvider: { getKeyStore: () => keyStore } } as any,
    {
      allExecutionTargets: [{ executionTarget: "v2_bridge_mobile" } as any],
      contextualExecutionTarget: "v2_bridge_mobile",
    },
  );
}

describe("ExecutableAction with a function-call key", () => {
  it("signs a covered guestbook message with the key and never opens the wallet", async () => {
    const outcome = { status: { SuccessValue: "" }, transaction_outcome: { id: "local" } };
    const rpc = stubRpc(() => ({ result: outcome }));
    const prompts = stubWallet();
    const action = await createAction([addMessage()]);

    expect(await action.promptForExecution()).toEqual([outcome] as never);
    expect(await action.waitForExecutionOutput()).toEqual([outcome] as never);
    expect(action.getExecutionMethod()).toBe("function_call_key");
    expect(prompts).toHaveLength(0);
    expect(rpc).toEqual(["query", "send_tx"]);
  });

  it("opens the wallet for a message with a donation, without touching the RPC", async () => {
    const rpc = stubRpc(() => ({ result: {} }));
    const prompts = stubWallet();
    const action = await createAction([addMessage(1n)]);

    expect(await action.promptForExecution()).toBe("wallet-result" as never);
    expect(prompts).toHaveLength(1);
    expect(rpc).toEqual([]);
  });

  it("opens the wallet when the request opts out of the function-call key", async () => {
    const rpc = stubRpc(() => ({ result: {} }));
    const prompts = stubWallet();
    const action = await createAction([addMessage()], { useFunctionCallKey: false });

    expect(await action.promptForExecution()).toBe("wallet-result" as never);
    expect(prompts).toHaveLength(1);
    expect(rpc).toEqual([]);
  });

  it("falls back to the wallet when the chain refused the transaction before executing it", async () => {
    stubRpc(() => ({ error: { name: "HANDLER_ERROR", cause: { name: "INVALID_TRANSACTION" } } }));
    const prompts = stubWallet();
    const action = await createAction([addMessage()]);

    expect(await action.promptForExecution()).toBe("wallet-result" as never);
    expect(prompts).toHaveLength(1);
  });

  it("settles with the error — never the wallet — when a sent transaction's outcome is unknown", async () => {
    stubRpc(() => ({ error: { name: "HANDLER_ERROR", cause: { name: "TIMEOUT_ERROR" } } }));
    const prompts = stubWallet();
    const action = await createAction([addMessage()]);

    const failure = await action.promptForExecution().catch((error) => error);
    expect(failure).toBeInstanceOf(FunctionCallKeyExecutionError);
    expect(prompts).toHaveLength(0);
    expect(await action.waitForExecutionOutput().catch((error) => error)).toBe(failure);
  });
});
