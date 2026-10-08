import type { KeyPair } from "@near-js/crypto";
import type { KeyStore } from "@near-js/keystores";
import { KeyPairSigner } from "@near-js/signers";
import {
  actionCreators,
  createTransaction,
  encodeTransaction,
  type SignedTransaction,
} from "@near-js/transactions";
import type { FinalExecutionOutcome } from "@near-js/types";
import { baseDecode, baseEncode } from "@near-js/utils";
import { base64 } from "@scure/base";
import type { TNearNativeAction } from "../../near_utils/meteor_actions.types";
import type { IMeteorConnectAccount } from "../MeteorConnect.types";

/**
 * Signing with the function-call access key added at sign-in (`near::sign_in` with
 * `addFunctionCallKey`), so a call that key is allowed to make never needs the wallet. That is
 * the point of the key: the user granted the dApp those calls up front.
 *
 * A function-call key cannot attach a deposit, call another contract, or call a method outside its
 * list — the chain enforces that — so anything else, or any doubt before a transaction is
 * broadcast, goes to the wallet exactly as before. Once a transaction may have been broadcast the
 * wallet is never asked to sign it again: an unknown outcome is reported, not retried.
 */

export interface IFunctionCallKeyTransaction {
  receiverId: string;
  actions: TNearNativeAction[];
}

export type TFunctionCallKeyCoverage =
  | { covered: true; publicKey: string; contractId: string }
  | {
      covered: false;
      reason:
        | "no_transactions"
        | "no_function_call_key"
        | "wrong_receiver"
        | "not_a_function_call"
        | "deposit_attached"
        | "method_not_allowed";
    };

interface IStoredFunctionCallKey {
  publicKey: string;
  contractId: string;
  methodNames?: string[];
}

/** The function-call key recorded on the account at sign-in, if there is one. */
function storedFunctionCallKey(account: IMeteorConnectAccount): IStoredFunctionCallKey | undefined {
  for (const key of account.publicKeys) {
    const meta = key.meta?.addFunctionCallKey;
    if (meta == null || typeof meta.contractId !== "string") continue;
    return {
      publicKey: key.publicKey,
      contractId: meta.contractId,
      methodNames:
        meta.allowMethods?.anyMethod === false ? meta.allowMethods.methodNames : undefined,
    };
  }
  return undefined;
}

/** A plain `FunctionCall` action (near-js `Action` enum shape), or undefined for anything else. */
function functionCallOf(
  action: TNearNativeAction,
): { methodName: string; args: Uint8Array; gas: bigint; deposit: bigint } | undefined {
  const candidate = action as { enum?: string; functionCall?: any };
  if (candidate.functionCall == null) return undefined;
  if (candidate.enum != null && candidate.enum !== "functionCall") return undefined;
  return candidate.functionCall;
}

/**
 * Whether the account's function-call key can sign EVERY transaction of a request, judged from what
 * was recorded at sign-in. Local and synchronous, so a request it does not cover (a donation, say)
 * reaches the wallet without any delay. The chain's own view of the key is checked again before
 * signing.
 */
export function functionCallKeyCoverage(
  account: IMeteorConnectAccount,
  transactions: readonly IFunctionCallKeyTransaction[],
): TFunctionCallKeyCoverage {
  if (transactions.length === 0) return { covered: false, reason: "no_transactions" };
  const key = storedFunctionCallKey(account);
  if (key == null) return { covered: false, reason: "no_function_call_key" };
  for (const transaction of transactions) {
    if (transaction.receiverId !== key.contractId)
      return { covered: false, reason: "wrong_receiver" };
    if (transaction.actions.length === 0) return { covered: false, reason: "not_a_function_call" };
    for (const action of transaction.actions) {
      const call = functionCallOf(action);
      if (call == null) return { covered: false, reason: "not_a_function_call" };
      if (BigInt(call.deposit ?? 0) !== 0n) return { covered: false, reason: "deposit_attached" };
      if (key.methodNames != null && !key.methodNames.includes(call.methodName)) {
        return { covered: false, reason: "method_not_allowed" };
      }
    }
  }
  return { covered: true, publicKey: key.publicKey, contractId: key.contractId };
}

//
// Minimal NEAR JSON-RPC: the raw error is what tells "rejected before execution" apart from
// "outcome unknown", and that distinction is the whole safety argument here.
//

type TRpcReply = {
  result?: any;
  error?: { name?: string; cause?: { name?: string }; message?: string; data?: unknown };
};

const VIEW_TIMEOUT_MS = 10_000;
/** Above the RPC's own ~10s `send_tx` timeout, so its typed TIMEOUT_ERROR arrives first. */
const SEND_TIMEOUT_MS = 30_000;

async function nearRpc(
  fetchImpl: typeof fetch,
  url: string,
  method: string,
  params: unknown,
  timeoutMs: number,
): Promise<TRpcReply> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: "meteor-fck", method, params }),
      signal: controller.signal,
    });
    return (await response.json()) as TRpcReply;
  } finally {
    clearTimeout(timer);
  }
}

const describeRpcError = (error: NonNullable<TRpcReply["error"]>): string =>
  [
    error.cause?.name ?? error.name,
    error.message,
    error.data == null ? undefined : JSON.stringify(error.data),
  ]
    .filter(Boolean)
    .join(" — ");

/** Thrown only once a transaction may already be on-chain: the caller must NOT re-sign it. */
export class FunctionCallKeyExecutionError extends Error {
  constructor(
    message: string,
    /** Outcomes of the transactions that did execute before this one. */
    readonly executedOutcomes: FinalExecutionOutcome[],
    /** Hash of the transaction whose outcome is unknown or that failed mid-batch. */
    readonly transactionHash: string,
  ) {
    super(message);
    this.name = "FunctionCallKeyExecutionError";
  }
}

async function signLocally(
  keyPair: KeyPair,
  accountId: string,
  transactions: readonly IFunctionCallKeyTransaction[],
  accessKey: { block_hash: string; nonce: number | string },
): Promise<Array<{ hash: string; signedTransaction: SignedTransaction }>> {
  const signer = new KeyPairSigner(keyPair);
  const publicKey = keyPair.getPublicKey();
  const blockHash = baseDecode(accessKey.block_hash);
  const nonce = BigInt(accessKey.nonce);
  return Promise.all(
    transactions.map(async (transaction, index) => {
      // Rebuilt with this SDK's own action creators, so the borsh schema always matches.
      const actions = transaction.actions.map((action) => {
        const call = functionCallOf(action);
        if (call == null) throw new Error("function_call_key_not_a_function_call");
        return actionCreators.functionCall(call.methodName, call.args, BigInt(call.gas), 0n);
      });
      const unsigned = createTransaction(
        accountId,
        publicKey,
        transaction.receiverId,
        nonce + BigInt(index + 1),
        actions,
        blockHash,
      );
      const [hash, signedTransaction] = await signer.signTransaction(unsigned);
      return { hash: baseEncode(hash), signedTransaction };
    }),
  );
}

export type TFunctionCallKeyExecution =
  | { kind: "executed"; outcomes: FinalExecutionOutcome[] }
  /** Nothing was broadcast — the wallet should handle the request, as it did before. */
  | { kind: "use_wallet"; reason: string };

export async function executeWithFunctionCallKey(input: {
  account: IMeteorConnectAccount;
  transactions: readonly IFunctionCallKeyTransaction[];
  keyStore: KeyStore;
  rpcUrl: string;
  fetchImpl?: typeof fetch;
}): Promise<TFunctionCallKeyExecution> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const { accountId, network } = input.account.identifier;
  const coverage = functionCallKeyCoverage(input.account, input.transactions);
  if (!coverage.covered) return { kind: "use_wallet", reason: coverage.reason };

  let keyPair: KeyPair | null;
  try {
    keyPair = await input.keyStore.getKey(network, accountId);
  } catch {
    return { kind: "use_wallet", reason: "key_unavailable" };
  }
  // The keystore holds one key per account; it must be THE key the account was signed in with.
  if (keyPair == null || keyPair.getPublicKey().toString() !== coverage.publicKey) {
    return { kind: "use_wallet", reason: "key_not_stored" };
  }

  // The chain's view of the key, not the record: it may have been deleted in the wallet since.
  let accessKey: TRpcReply;
  try {
    accessKey = await nearRpc(
      fetchImpl,
      input.rpcUrl,
      "query",
      {
        request_type: "view_access_key",
        finality: "final",
        account_id: accountId,
        public_key: coverage.publicKey,
      },
      VIEW_TIMEOUT_MS,
    );
  } catch {
    return { kind: "use_wallet", reason: "rpc_unavailable" };
  }
  if (accessKey.error != null || accessKey.result == null) {
    return {
      kind: "use_wallet",
      reason:
        accessKey.error?.cause?.name === "UNKNOWN_ACCESS_KEY"
          ? "key_not_on_chain"
          : "rpc_unavailable",
    };
  }
  const permission = accessKey.result.permission?.FunctionCall;
  const onChainMethods: string[] = permission?.method_names ?? [];
  const permitted =
    permission != null &&
    input.transactions.every(
      (transaction) =>
        transaction.receiverId === permission.receiver_id &&
        transaction.actions.every((action) => {
          const methodName = functionCallOf(action)?.methodName;
          return (
            methodName != null &&
            (onChainMethods.length === 0 || onChainMethods.includes(methodName))
          );
        }),
    );
  if (!permitted) return { kind: "use_wallet", reason: "key_permission_mismatch" };

  // Signing is still local: any failure up to here means nothing was broadcast.
  let signed: Array<{ hash: string; signedTransaction: SignedTransaction }>;
  try {
    signed = await signLocally(keyPair, accountId, input.transactions, accessKey.result);
  } catch {
    return { kind: "use_wallet", reason: "signing_failed" };
  }

  const outcomes: FinalExecutionOutcome[] = [];
  for (const [index, { hash, signedTransaction }] of signed.entries()) {
    let reply: TRpcReply;
    try {
      reply = await nearRpc(
        fetchImpl,
        input.rpcUrl,
        "send_tx",
        {
          signed_tx_base64: base64.encode(encodeTransaction(signedTransaction)),
          wait_until: "EXECUTED_OPTIMISTIC",
        },
        SEND_TIMEOUT_MS,
      );
    } catch (error) {
      throw new FunctionCallKeyExecutionError(
        `function_call_key_outcome_unknown: transaction ${hash} was sent but its outcome could not be read (${String(error)})`,
        outcomes,
        hash,
      );
    }
    if (reply.error == null && reply.result != null) {
      outcomes.push(reply.result as FinalExecutionOutcome);
      continue;
    }
    // INVALID_TRANSACTION is the chain refusing it outright (exhausted allowance, stale nonce, a
    // deleted key): nothing executed. Before the first transaction nothing at all has happened,
    // so the wallet takes the request.
    const rejected = reply.error?.cause?.name === "INVALID_TRANSACTION";
    const detail = reply.error == null ? "empty response" : describeRpcError(reply.error);
    if (rejected && index === 0) {
      return { kind: "use_wallet", reason: `rejected_before_execution: ${detail}` };
    }
    throw new FunctionCallKeyExecutionError(
      rejected
        ? `function_call_key_partial: ${index} of ${signed.length} transactions executed; transaction ${hash} was rejected (${detail})`
        : `function_call_key_outcome_unknown: transaction ${hash} was sent but its outcome is unknown (${detail})`,
      outcomes,
      hash,
    );
  }
  return { kind: "executed", outcomes };
}
