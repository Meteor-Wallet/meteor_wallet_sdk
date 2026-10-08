import { describe, expect, it } from "bun:test";
import { KeyPair } from "@near-js/crypto";
import { InMemoryKeyStore } from "@near-js/keystores";
import { actionCreators, decodeSignedTransaction, encodeTransaction } from "@near-js/transactions";
import { baseEncode } from "@near-js/utils";
import { sha256 } from "@noble/hashes/sha2.js";
import { base64 } from "@scure/base";
import type { IMeteorConnectAccount } from "../MeteorConnect.types";
import {
  executeWithFunctionCallKey,
  FunctionCallKeyExecutionError,
  functionCallKeyCoverage,
  type IFunctionCallKeyTransaction,
} from "./nearFunctionCallKey";

const CONTRACT = "guest-book.testnet";
const ACCOUNT_ID = "alice.testnet";
const RPC = "https://rpc.example";

const functionCallKey = KeyPair.fromRandom("ed25519");

const accountWith = (allowMethods: unknown): IMeteorConnectAccount =>
  ({
    identifier: { blockchain: "near", network: "testnet", accountId: ACCOUNT_ID },
    connection: { executionTarget: "v1_web" },
    publicKeys: [
      {
        type: "ed25519",
        publicKey: functionCallKey.getPublicKey().toString(),
        meta: {
          addFunctionCallKey: {
            contractId: CONTRACT,
            publicKey: functionCallKey.getPublicKey().toString(),
            allowMethods,
          },
        },
      },
    ],
  }) as IMeteorConnectAccount;

const ACCOUNT = accountWith({ anyMethod: false, methodNames: ["addMessage"] });

const addMessage = (text: string, deposit = 0n): IFunctionCallKeyTransaction => ({
  receiverId: CONTRACT,
  actions: [actionCreators.functionCall("addMessage", { text }, 30_000_000_000_000n, deposit)],
});

const OUTCOME = (hash: string) => ({
  final_execution_status: "EXECUTED_OPTIMISTIC",
  status: { SuccessValue: "" },
  transaction: { hash, receiver_id: CONTRACT },
  transaction_outcome: { id: hash },
  receipts_outcome: [],
});

/**
 * A scripted NEAR JSON-RPC endpoint. `view_access_key` answers with the key's on-chain view;
 * each `send_tx` takes the next scripted reply (or throws, for a transport failure).
 */
function rpcDouble(
  options: {
    accessKey?: Record<string, unknown> | { error: unknown } | "throw";
    sends?: Array<{ result?: unknown; error?: unknown } | "throw">;
  } = {},
) {
  const sent: Uint8Array[] = [];
  const methods: string[] = [];
  const sends = [...(options.sends ?? [])];
  const fetchImpl = (async (_url: string, init: { body: string }) => {
    const request = JSON.parse(init.body);
    methods.push(request.method);
    const reply = (body: unknown) => ({ json: async () => body });
    if (request.method === "query") {
      const accessKey = options.accessKey;
      if (accessKey === "throw") throw new TypeError("Failed to fetch");
      if (accessKey != null && "error" in accessKey) return reply({ error: accessKey.error });
      return reply({
        result: accessKey ?? {
          nonce: 41,
          block_hash: baseEncode(new Uint8Array(32).fill(7)),
          permission: {
            FunctionCall: { receiver_id: CONTRACT, method_names: ["addMessage"], allowance: null },
          },
        },
      });
    }
    sent.push(base64.decode(request.params.signed_tx_base64));
    const next = sends.shift() ?? { result: OUTCOME(`tx-${sent.length}`) };
    if (next === "throw") throw new TypeError("network down");
    return reply(next);
  }) as unknown as typeof fetch;
  return { fetchImpl, sent, methods };
}

const keyStoreWith = async (keyPair: KeyPair | undefined) => {
  const keyStore = new InMemoryKeyStore();
  if (keyPair != null) await keyStore.setKey("testnet", ACCOUNT_ID, keyPair);
  return keyStore;
};

const run = async (
  transactions: IFunctionCallKeyTransaction[],
  rpc: ReturnType<typeof rpcDouble>,
  options: { account?: IMeteorConnectAccount; keyPair?: KeyPair | null } = {},
) =>
  executeWithFunctionCallKey({
    account: options.account ?? ACCOUNT,
    transactions,
    keyStore: await keyStoreWith(
      options.keyPair === null ? undefined : (options.keyPair ?? functionCallKey),
    ),
    rpcUrl: RPC,
    fetchImpl: rpc.fetchImpl,
  });

describe("function-call key coverage", () => {
  it("covers a zero-deposit call to an allowed method of the key's contract", () => {
    expect(functionCallKeyCoverage(ACCOUNT, [addMessage("hi"), addMessage("again")])).toEqual({
      covered: true,
      publicKey: functionCallKey.getPublicKey().toString(),
      contractId: CONTRACT,
    });
  });

  const cases: Array<[string, IFunctionCallKeyTransaction[], string, IMeteorConnectAccount?]> = [
    ["a deposit is attached (the donation)", [addMessage("hi", 1n)], "deposit_attached"],
    [
      "another contract is called",
      [{ ...addMessage("hi"), receiverId: "other.testnet" }],
      "wrong_receiver",
    ],
    [
      "a method outside the key's list is called",
      [{ receiverId: CONTRACT, actions: [actionCreators.functionCall("drain", {}, 1n, 0n)] }],
      "method_not_allowed",
    ],
    [
      "an action is not a function call",
      [{ receiverId: CONTRACT, actions: [actionCreators.transfer(1n)] }],
      "not_a_function_call",
    ],
    ["there is nothing to sign", [], "no_transactions"],
    [
      "the account has no function-call key",
      [addMessage("hi")],
      "no_function_call_key",
      { ...ACCOUNT, publicKeys: [] },
    ],
  ];
  for (const [situation, transactions, reason, account] of cases) {
    it(`does not cover a request where ${situation}`, () => {
      expect(functionCallKeyCoverage(account ?? ACCOUNT, transactions)).toEqual({
        covered: false,
        reason,
      } as never);
    });
  }

  it("covers any method when the key allows any method", () => {
    const anyMethod = accountWith({ anyMethod: true });
    const call = {
      receiverId: CONTRACT,
      actions: [actionCreators.functionCall("other", {}, 1n, 0n)],
    };
    expect(functionCallKeyCoverage(anyMethod, [call]).covered).toBeTrue();
  });
});

describe("executing with the function-call key", () => {
  it("signs with the key, nonces after the on-chain one, and sends every transaction", async () => {
    const rpc = rpcDouble();
    const execution = await run([addMessage("one"), addMessage("two")], rpc);

    expect(execution.kind).toBe("executed");
    expect(execution.kind === "executed" && execution.outcomes.length).toBe(2);
    const decoded = rpc.sent.map((bytes) => decodeSignedTransaction(bytes));
    expect(decoded.map((signed) => signed.transaction.nonce)).toEqual([42n, 43n]);
    for (const signed of decoded) {
      expect(signed.transaction.signerId).toBe(ACCOUNT_ID);
      expect(signed.transaction.receiverId).toBe(CONTRACT);
      // Borsh decodes the key as its `{ ed25519Key: { data } }` enum, not a PublicKey instance.
      const decodedKey = (signed.transaction.publicKey as any).ed25519Key?.data;
      expect(Array.from(decodedKey)).toEqual(Array.from(functionCallKey.getPublicKey().data));
      expect(signed.transaction.actions[0]?.functionCall?.deposit).toBe(0n);
      const digest = sha256(encodeTransaction(signed.transaction));
      const signature = Uint8Array.from((signed.signature as any).ed25519Signature.data);
      expect(functionCallKey.verify(digest, signature)).toBeTrue();
    }
  });

  it("goes to the wallet, without touching the network, for a request the key does not cover", async () => {
    const rpc = rpcDouble();
    expect(await run([addMessage("with donation", 1n)], rpc)).toEqual({
      kind: "use_wallet",
      reason: "deposit_attached",
    });
    expect(rpc.methods).toEqual([]);
  });

  it("goes to the wallet when this browser does not hold the key", async () => {
    const rpc = rpcDouble();
    expect(await run([addMessage("hi")], rpc, { keyPair: null })).toEqual({
      kind: "use_wallet",
      reason: "key_not_stored",
    });
  });

  it("goes to the wallet when the stored key is a different one", async () => {
    const rpc = rpcDouble();
    const other = KeyPair.fromRandom("ed25519");
    expect(await run([addMessage("hi")], rpc, { keyPair: other })).toEqual({
      kind: "use_wallet",
      reason: "key_not_stored",
    });
  });

  it("goes to the wallet when the key was deleted on-chain", async () => {
    const rpc = rpcDouble({
      accessKey: { error: { name: "HANDLER_ERROR", cause: { name: "UNKNOWN_ACCESS_KEY" } } },
    });
    expect(await run([addMessage("hi")], rpc)).toEqual({
      kind: "use_wallet",
      reason: "key_not_on_chain",
    });
    expect(rpc.sent).toEqual([]);
  });

  it("goes to the wallet when the chain's permission no longer covers the call", async () => {
    const rpc = rpcDouble({
      accessKey: {
        nonce: 1,
        block_hash: baseEncode(new Uint8Array(32)),
        permission: { FunctionCall: { receiver_id: CONTRACT, method_names: ["other"] } },
      },
    });
    expect(await run([addMessage("hi")], rpc)).toEqual({
      kind: "use_wallet",
      reason: "key_permission_mismatch",
    });
  });

  it("goes to the wallet when the RPC cannot be reached before anything is sent", async () => {
    const rpc = rpcDouble({ accessKey: "throw" });
    expect(await run([addMessage("hi")], rpc)).toEqual({
      kind: "use_wallet",
      reason: "rpc_unavailable",
    });
  });

  it("goes to the wallet when the chain refuses the first transaction outright", async () => {
    // e.g. the key's gas allowance is spent: INVALID_TRANSACTION means nothing executed.
    const rpc = rpcDouble({
      sends: [{ error: { name: "HANDLER_ERROR", cause: { name: "INVALID_TRANSACTION" } } }],
    });
    const execution = await run([addMessage("hi")], rpc);
    expect(execution.kind).toBe("use_wallet");
    expect(execution.kind === "use_wallet" && execution.reason).toStartWith(
      "rejected_before_execution",
    );
  });

  it("reports a partial batch instead of handing the rest to the wallet", async () => {
    const rpc = rpcDouble({
      sends: [
        { result: OUTCOME("first") },
        { error: { name: "HANDLER_ERROR", cause: { name: "INVALID_TRANSACTION" } } },
      ],
    });
    const failure = await run([addMessage("one"), addMessage("two")], rpc).catch((error) => error);
    expect(failure).toBeInstanceOf(FunctionCallKeyExecutionError);
    expect(failure.message).toStartWith("function_call_key_partial");
    expect(failure.executedOutcomes).toHaveLength(1);
  });

  it("never re-signs in the wallet when a sent transaction's outcome is unknown", async () => {
    for (const send of [
      "throw" as const,
      { error: { name: "HANDLER_ERROR", cause: { name: "TIMEOUT_ERROR" } } },
    ]) {
      const rpc = rpcDouble({ sends: [send] });
      const failure = await run([addMessage("hi")], rpc).catch((error) => error);
      expect(failure).toBeInstanceOf(FunctionCallKeyExecutionError);
      expect(failure.message).toStartWith("function_call_key_outcome_unknown");
      expect(failure.transactionHash.length).toBeGreaterThan(0);
    }
  });

  it("returns a call that failed on-chain as an outcome, exactly like the wallet path", async () => {
    const failed = {
      ...OUTCOME("x"),
      status: { Failure: { ActionError: { index: 0, kind: { FunctionCallError: {} } } } },
    };
    const rpc = rpcDouble({ sends: [{ result: failed }] });
    expect(await run([addMessage("hi")], rpc)).toEqual({
      kind: "executed",
      outcomes: [failed],
    } as never);
  });
});
