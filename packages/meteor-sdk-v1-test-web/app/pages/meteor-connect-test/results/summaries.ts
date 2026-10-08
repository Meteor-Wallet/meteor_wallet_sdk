import type {
  IMeteorConnectAccount,
  IMeteorConnectAccountIdentifier,
  IODappAction_VerifyOwner_Output,
  IORequestSignDelegateActions_Output,
  TMeteorConnectionExecutionTarget,
} from "@meteorwallet/sdk";
import { serializeMessageNep413 } from "@meteorwallet/sdk";
import { PublicKey } from "@near-js/crypto";
import type { SignedMessage } from "@near-js/signers";
import type { FinalExecutionOutcome } from "@near-js/types";
import { base58, base64 } from "@scure/base";
import {
  explorerAccountUrl,
  explorerTxUrl,
  type IActionResultField,
  type IActionResultSummary,
  type TNearNetwork,
  toDisplayJson,
} from "./resultsModel";

/** The NEP-413 params a sign-message request was made with (not exported by the SDK). */
export interface INearSignMessageParams {
  message: string;
  recipient: string;
  nonce: Uint8Array;
  callbackUrl?: string;
}

/**
 * Output → one-line verdict plus the handful of fields a tester actually checks. Wherever the
 * output can be checked locally (signatures, on-chain status) it is — "the wallet answered" is not
 * the same as "it worked".
 */

const EXECUTION_TARGET_LABELS: Record<TMeteorConnectionExecutionTarget, string> = {
  v1_web: "Meteor Web (popup)",
  v1_web_localhost: "Meteor Web (localhost)",
  v1_ext: "Meteor Extension",
  v2_bridge_mobile: "Meteor Mobile (bridge)",
  v2_rid_mobile_deep_link: "Meteor Mobile (deep link)",
  v2_rid_qr_code: "Meteor Mobile (QR)",
  test: "Test client",
  test_rid_deep_link: "Test client (deep link)",
  test_rid_qr_code: "Test client (QR)",
};

export const describeExecutionTarget = (target: TMeteorConnectionExecutionTarget): string =>
  EXECUTION_TARGET_LABELS[target] ?? target;

const plural = (count: number, noun: string): string => `${count} ${noun}${count === 1 ? "" : "s"}`;

const toBytes = (value: unknown): Uint8Array | undefined => {
  if (value instanceof Uint8Array) return value;
  if (Array.isArray(value)) return Uint8Array.from(value);
  if (typeof value === "string") {
    try {
      return base64.decode(value);
    } catch {
      return undefined;
    }
  }
  return undefined;
};

/**
 * Keys arrive in more than one shape: a `PublicKey`, an `ed25519:` string, or a borsh-decoded
 * `{ ed25519Key: { data } }` enum (signed delegates off the mobile bridge).
 */
export const formatPublicKeyLike = (value: any): string => {
  if (value == null) return "unknown";
  if (typeof value === "string") return value;
  const asString = typeof value.toString === "function" ? String(value) : "";
  if (asString.startsWith("ed25519:") || asString.startsWith("secp256k1:")) return asString;
  const ed25519 = toBytes(value.ed25519Key?.data);
  if (ed25519 != null) return `ed25519:${base58.encode(ed25519)}`;
  const secp256k1 = toBytes(value.secp256k1Key?.data);
  if (secp256k1 != null) return `secp256k1:${base58.encode(secp256k1)}`;
  return toDisplayJson(value);
};

const accountFields = (account: IMeteorConnectAccount): IActionResultField[] => {
  const { accountId, network } = account.identifier;
  const fields: IActionResultField[] = [
    { label: "Account", value: accountId, href: explorerAccountUrl(network, accountId) },
    { label: "Network", value: network, copyable: false },
    {
      label: "Connected via",
      value: describeExecutionTarget(account.connection.executionTarget),
      copyable: false,
    },
  ];
  for (const key of account.publicKeys) {
    const functionCallKey = key.meta?.addFunctionCallKey;
    fields.push({
      label: functionCallKey?.contractId
        ? `Function-call key (${functionCallKey.contractId})`
        : "Public key",
      value: key.publicKey,
    });
  }
  return fields;
};

export const summarizeSignIn = (account: IMeteorConnectAccount): IActionResultSummary => ({
  headline: `Signed in as ${account.identifier.accountId}`,
  fields: accountFields(account),
});

export const summarizeSignOut = (
  identifier: IMeteorConnectAccountIdentifier,
): IActionResultSummary => ({
  headline: `Signed out ${identifier.accountId}`,
  fields: [{ label: "Account", value: identifier.accountId }],
});

//
// SIGNED MESSAGES (NEP-413)
//

type TSignatureCheck =
  | { verdict: "valid"; callbackUrl?: string }
  | { verdict: "invalid" }
  | { verdict: "unchecked"; reason: string };

/**
 * Re-derives the NEP-413 payload hash from the params WE sent and checks the wallet's signature
 * against the key it reported. When no `callbackUrl` was sent, a wallet may still have signed with
 * the page URL (NEP-413 allows browser wallets to default it), so those are tried too before
 * calling a signature bad.
 */
const checkNep413Signature = (
  signed: SignedMessage,
  params: INearSignMessageParams,
): TSignatureCheck => {
  let publicKey: PublicKey;
  let signature: Uint8Array | undefined;
  try {
    publicKey = PublicKey.fromString(formatPublicKeyLike(signed.publicKey));
    signature = toBytes(signed.signature);
  } catch (error) {
    return { verdict: "unchecked", reason: `unreadable key (${String(error)})` };
  }
  if (signature == null) return { verdict: "unchecked", reason: "unreadable signature" };

  const candidates: Array<string | undefined> =
    params.callbackUrl != null
      ? [params.callbackUrl]
      : [undefined, window.location.href, window.location.origin];

  for (const callbackUrl of candidates) {
    try {
      const hash = serializeMessageNep413({
        message: params.message,
        recipient: params.recipient,
        nonce: params.nonce,
        callbackUrl,
      });
      if (publicKey.verify(hash, signature)) return { verdict: "valid", callbackUrl };
    } catch {
      // Try the next candidate.
    }
  }
  return { verdict: "invalid" };
};

export const summarizeSignedMessage = (
  signed: SignedMessage,
  params: INearSignMessageParams,
  expectedAccountId?: string,
): IActionResultSummary => {
  const check = checkNep413Signature(signed, params);
  const accountMatches = expectedAccountId == null || signed.accountId === expectedAccountId;
  const signatureBytes = toBytes(signed.signature);

  const fields: IActionResultField[] = [
    {
      label: "Signed by",
      value: signed.accountId,
      tone: accountMatches ? undefined : "bad",
    },
    {
      label: "Signature check",
      value:
        check.verdict === "valid"
          ? `Valid NEP-413 signature${check.callbackUrl != null ? ` (callbackUrl: ${check.callbackUrl})` : ""}`
          : check.verdict === "invalid"
            ? "Does NOT verify against the message that was sent"
            : `Not checked — ${check.reason}`,
      tone: check.verdict === "valid" ? "good" : check.verdict === "invalid" ? "bad" : "warn",
      copyable: false,
    },
    { label: "Message", value: params.message },
    { label: "Recipient", value: params.recipient, copyable: false },
    { label: "Public key", value: formatPublicKeyLike(signed.publicKey) },
    {
      label: "Signature (base64)",
      value: signatureBytes != null ? base64.encode(signatureBytes) : String(signed.signature),
    },
  ];
  if (signed.state != null) fields.push({ label: "State", value: signed.state });

  if (!accountMatches) {
    return {
      status: "failed",
      headline: `Signed by ${signed.accountId}, expected ${expectedAccountId}`,
      fields,
    };
  }
  if (check.verdict === "invalid") {
    return {
      status: "failed",
      headline: "The wallet returned a signature that does not verify",
      fields,
    };
  }
  return {
    status: check.verdict === "valid" ? "success" : "warning",
    headline:
      check.verdict === "valid"
        ? `Message signed by ${signed.accountId} — signature verified`
        : `Message signed by ${signed.accountId} — signature not checked`,
    fields,
  };
};

export const summarizeSignInAndSignMessage = (
  output: IMeteorConnectAccount & { signedMessage: SignedMessage },
  params: INearSignMessageParams,
): IActionResultSummary => {
  const message = summarizeSignedMessage(output.signedMessage, params, output.identifier.accountId);
  return {
    status: message.status,
    headline: `Signed in as ${output.identifier.accountId} · ${
      message.status === "success"
        ? "message verified"
        : message.status === "failed"
          ? "message signature failed"
          : "message not checked"
    }`,
    fields: [...accountFields(output), ...(message.fields ?? [])],
  };
};

//
// VERIFY OWNER
//

export const summarizeVerifyOwner = (
  output: IODappAction_VerifyOwner_Output,
  expectedAccountId: string,
): IActionResultSummary => {
  const accountMatches = output.accountId === expectedAccountId;
  return {
    status: accountMatches ? "success" : "failed",
    headline: accountMatches
      ? `Ownership proof signed by ${output.accountId}`
      : `Proof is for ${output.accountId}, expected ${expectedAccountId}`,
    fields: [
      { label: "Account", value: output.accountId, tone: accountMatches ? undefined : "bad" },
      { label: "Message", value: output.message },
      { label: "Block", value: output.blockId },
      { label: "Public key", value: formatPublicKeyLike(output.publicKey) },
      { label: "Signature", value: output.signature },
    ],
  };
};

//
// TRANSACTIONS
//

/** `status` is `{ SuccessValue }`, `{ Failure }`, or (for a non-final outcome) a bare string. */
const transactionFailure = (outcome: FinalExecutionOutcome): unknown | undefined => {
  const status: any = outcome.status;
  if (status == null) return "no status";
  if (typeof status === "string") return status === "Failure" ? "Failure" : undefined;
  return status.Failure ?? undefined;
};

/**
 * NEAR failures nest one key per level — `{ ActionError: { index, kind: { FunctionCallError: {
 * ExecutionError: "Smart contract panicked: …" } } } }` — so follow the single path down to the
 * message and name it by its last two keys. Anything shaped otherwise falls back to JSON (the raw
 * response always has the full object).
 */
const describeFailure = (failure: unknown): string => {
  if (typeof failure === "string") return failure;
  const path: string[] = [];
  let node: unknown = failure;
  while (node != null && typeof node === "object" && !Array.isArray(node)) {
    const entries = Object.entries(node).filter(([key]) => key !== "index");
    const [only] = entries;
    if (only == null || entries.length !== 1) break;
    const [key, value] = only;
    if (key !== "kind") path.push(key);
    node = value;
  }
  if ((typeof node === "string" || typeof node === "number") && path.length > 0) {
    return `${path.slice(-2).join(" › ")}: ${node}`;
  }
  const text = JSON.stringify(failure);
  return text.length > 240 ? `${text.slice(0, 240)}…` : text;
};

export const summarizeTransactions = (
  outcomes: FinalExecutionOutcome[] | undefined,
  network: TNearNetwork,
): IActionResultSummary => {
  if (!Array.isArray(outcomes) || outcomes.length === 0) {
    return { status: "warning", headline: "The wallet returned no transaction outcomes" };
  }

  const fields: IActionResultField[] = [];
  let failedCount = 0;
  let receiptFailureCount = 0;

  outcomes.forEach((outcome, index) => {
    const hash = outcome.transaction_outcome?.id ?? outcome.transaction?.hash ?? "unknown";
    const receiver = outcome.transaction?.receiver_id;
    const failure = transactionFailure(outcome);
    const failedReceipts = (outcome.receipts_outcome ?? []).filter(
      (receipt: any) => receipt?.outcome?.status?.Failure != null,
    );
    if (failure != null) failedCount++;
    else if (failedReceipts.length > 0) receiptFailureCount++;

    const prefix = outcomes.length > 1 ? `Tx ${index + 1}` : "Transaction";
    fields.push({
      label: receiver != null ? `${prefix} → ${receiver}` : prefix,
      value: hash,
      href: hash !== "unknown" ? explorerTxUrl(network, hash) : undefined,
      tone: failure != null ? "bad" : failedReceipts.length > 0 ? "warn" : "good",
    });
    if (failure != null) {
      fields.push({
        label: `${prefix} error`,
        value: describeFailure(failure),
        tone: "bad",
      });
    } else if (failedReceipts.length > 0) {
      fields.push({
        label: `${prefix} receipts`,
        value: `${plural(failedReceipts.length, "receipt")} failed: ${describeFailure(
          (failedReceipts[0] as any).outcome.status.Failure,
        )}`,
        tone: "warn",
      });
    }
  });

  const total = plural(outcomes.length, "transaction");
  if (failedCount > 0) {
    return {
      status: "failed",
      headline:
        outcomes.length === 1
          ? "Transaction failed on-chain"
          : `${failedCount} of ${total} failed on-chain`,
      fields,
    };
  }
  if (receiptFailureCount > 0) {
    return {
      status: "warning",
      headline: `${total} landed, but some receipts failed`,
      fields,
    };
  }
  return {
    headline: outcomes.length === 1 ? "Transaction succeeded on-chain" : `${total} succeeded`,
    fields,
  };
};

//
// DELEGATE ACTIONS
//

export const summarizeSignedDelegates = (
  output: IORequestSignDelegateActions_Output,
  expectedCount: number,
): IActionResultSummary => {
  const signed = output.signedDelegatesWithHashes ?? [];
  const fields: IActionResultField[] = [];

  signed.forEach(({ signedDelegate, delegateHash }, index) => {
    const delegate = signedDelegate.delegateAction;
    const prefix = signed.length > 1 ? `Delegate ${index + 1}` : "Delegate";
    fields.push({
      label: prefix,
      value: `${delegate.senderId} → ${delegate.receiverId} · ${plural(delegate.actions.length, "action")}`,
      copyable: false,
    });
    const hashBytes = toBytes(delegateHash);
    if (hashBytes != null)
      fields.push({ label: `${prefix} hash`, value: base58.encode(hashBytes) });
    fields.push({
      label: `${prefix} nonce / max block`,
      value: `${delegate.nonce.toString()} / ${delegate.maxBlockHeight.toString()}`,
      copyable: false,
    });
    fields.push({ label: `${prefix} key`, value: formatPublicKeyLike(delegate.publicKey) });
  });

  if (signed.length !== expectedCount) {
    return {
      status: "warning",
      headline: `Asked for ${expectedCount}, received ${plural(signed.length, "signed delegate")}`,
      fields,
    };
  }
  return {
    headline: `${plural(signed.length, "delegate action")} signed — ready to relay`,
    fields,
  };
};
