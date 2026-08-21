import {
  validateNewKeyTransferStartOutputForInput,
  validateNewKeyTransferVerifyActiveOutputForInput,
  vNewKeyTransferStartInputV1,
} from "@meteorwallet/connect-shared";
import { vNewKeyTransferVerifyActiveInputV1 } from "@meteorwallet/connect-shared/internal";
import { KeyType, PublicKey } from "@near-js/crypto";
import { DelegateAction, SCHEMA, Signature, SignedDelegate } from "@near-js/transactions";
import { sha256 } from "@noble/hashes/sha2.js";
import { base64 } from "@scure/base";
import { deserialize, serialize } from "borsh";
import * as v from "valibot";
import type { IMeteorConnectAccount, TMeteorConnectPublicKey } from "../../MeteorConnect.types";
import type {
  IMobileBridgePreparedAction,
  IMobileBridgeResultContext,
} from "./MeteorConnectMobileBridgeClient.types";

/**
 * The SDK-shaped mapping of an ALREADY-VERIFIED wallet output.
 *
 * Everything the 0.9 receive boundary used to do by hand — wallet signature verification, action
 * domain/id matching, result-envelope identity against the signed turn, and the output-hash
 * recompute — now happens inside `PartnerSessionClient.waitForValidatedResult()` before a result
 * is ever exposed. What remains here has no SDK equivalent: the business-level output-vs-input
 * binding for the new-key transfer ids, and the NEAR account-identity checks + hydration into the
 * SDK's own account/signature shapes.
 */

function requireTargetAccount(prepared: IMobileBridgePreparedAction): string {
  const accountId = (prepared.sdkRequest.expandedInput as any).account?.identifier?.accountId;
  if (typeof accountId !== "string") throw new Error("mobile_bridge_missing_target_account");
  return accountId;
}

function requireMatchingAccount(actual: unknown, expected: string): void {
  if (typeof actual !== "string" || actual !== expected) {
    throw new Error("mobile_bridge_result_account_mismatch");
  }
}

function signatureFromWire(
  publicKey: string,
  signature: string,
  accountId: string,
  state?: string,
) {
  return {
    accountId,
    publicKey: PublicKey.fromString(publicKey),
    signature: base64.decode(signature),
    state,
  };
}

function decodeSignedDelegate(encoded: string): SignedDelegate {
  const decoded: any = deserialize(SCHEMA.SignedDelegate, base64.decode(encoded));
  let signature: Signature;
  if (decoded.signature.ed25519Signature != null) {
    signature = new Signature({
      keyType: KeyType.ED25519,
      data: decoded.signature.ed25519Signature.data,
    });
  } else if (decoded.signature.secp256k1Signature != null) {
    signature = new Signature({
      keyType: KeyType.SECP256K1,
      data: decoded.signature.secp256k1Signature.data,
    });
  } else {
    throw new Error("mobile_bridge_invalid_delegate_signature");
  }
  return new SignedDelegate({
    delegateAction: new DelegateAction({ ...decoded.delegateAction }),
    signature,
  });
}

/**
 * meteor_wallet_core outputs. `transfer_accounts` stays wire-shaped `{ success: boolean }` —
 * outcome mapping lives in the transfer wrapper so adapter/registry semantics stay uniform. The
 * two new-key ids are bound back to their request's account set, which the session client does
 * not (and cannot) do.
 */
export function meteorWalletCoreOutputToSdk(
  prepared: IMobileBridgePreparedAction,
  output: unknown,
): unknown {
  if (prepared.kind.domain !== "meteor_wallet_core") {
    throw new Error("mobile_bridge_unsupported_action_result");
  }
  switch (prepared.kind.sharedActionId) {
    case "transfer_accounts":
      return output;
    case "new_key_account_transfer_start":
      return validateNewKeyTransferStartOutputForInput({
        request: v.parse(vNewKeyTransferStartInputV1, prepared.sdkRequest.expandedInput),
        output,
      });
    case "new_key_account_transfer_verify_active":
      return validateNewKeyTransferVerifyActiveOutputForInput({
        request: v.parse(vNewKeyTransferVerifyActiveInputV1, prepared.sdkRequest.expandedInput),
        output,
      });
    default:
      throw new Error("mobile_bridge_unsupported_action_result");
  }
}

/**
 * NEAR outputs. Unreachable in production while `experimentalNearOverSession` is off (the bridge
 * refuses `act_impl_near` sessions with `action_ineligible`) — kept intact and tested so the path
 * is ready the day `session_policies.ts::hasImplementedRecoverySeams` admits NEAR.
 */
export async function nearOutputToSdk(
  prepared: IMobileBridgePreparedAction,
  rawOutput: unknown,
  context: IMobileBridgeResultContext,
): Promise<any> {
  const kind = prepared.kind;
  if (kind.domain !== "near") throw new Error("mobile_bridge_unsupported_action_result");
  const output: any = rawOutput;
  const input: any = prepared.sdkRequest.expandedInput;

  if (kind.sharedActionId === "sign_in" || kind.sharedActionId === "sign_in_and_sign_message") {
    if (!Array.isArray(output) || output.length === 0) {
      throw new Error("mobile_bridge_sign_in_returned_no_accounts");
    }
    if (kind.sharedActionId === "sign_in_and_sign_message") {
      for (const item of output)
        requireMatchingAccount(item.signedMessage?.accountId, item.accountId);
    }
    const selected = output[0];
    const publicKeys: TMeteorConnectPublicKey[] = [];
    const functionCallKey = normalizeFunctionCallKeyForMeta(input) as
      | Record<string, unknown>
      | undefined;
    if (kind.pendingFunctionCallKey != null) {
      if (context.persistFunctionCallKey == null) {
        throw new Error("local_key_persistence_failed");
      }
      try {
        await context.persistFunctionCallKey(
          input.target.network,
          selected.accountId,
          kind.pendingFunctionCallKey,
        );
      } catch {
        throw new Error("local_key_persistence_failed");
      }
      publicKeys.push({
        type: "ed25519",
        publicKey: kind.pendingFunctionCallKey.getPublicKey().toString(),
        meta: {
          addFunctionCallKey: {
            ...functionCallKey,
            publicKey: kind.pendingFunctionCallKey.getPublicKey().toString(),
          },
        },
      });
    } else if (typeof functionCallKey?.publicKey === "string") {
      // Only keys explicitly added for this dApp belong in the connected-account key list. The
      // wallet may also return its primary signing key, but sign-out must never try to remove it.
      publicKeys.push({
        type: "ed25519",
        publicKey: functionCallKey.publicKey,
        meta: { addFunctionCallKey: functionCallKey },
      });
    }
    const account: IMeteorConnectAccount = {
      connection: context.getConnection(),
      identifier: {
        blockchain: "near",
        network: input.target.network,
        accountId: selected.accountId,
      },
      publicKeys,
    };
    if (kind.sharedActionId === "sign_in_and_sign_message") {
      return {
        ...account,
        signedMessage: signatureFromWire(
          selected.signedMessage.publicKey,
          selected.signedMessage.signature,
          selected.signedMessage.accountId,
          kind.retainedMessageState,
        ),
      };
    }
    return account;
  }

  const expectedAccount = requireTargetAccount(prepared);
  switch (kind.sharedActionId) {
    case "sign_out":
      requireMatchingAccount(output.accountId, expectedAccount);
      return input.account.identifier;
    case "sign_message":
      requireMatchingAccount(output.accountId, expectedAccount);
      return signatureFromWire(
        output.publicKey,
        output.signature,
        output.accountId,
        kind.retainedMessageState,
      );
    case "sign_and_send_transaction":
      requireMatchingAccount(output?.transaction?.signer_id, expectedAccount);
      return [output];
    case "sign_and_send_transactions":
      if (!Array.isArray(output)) throw new Error("mobile_bridge_invalid_transaction_results");
      output.forEach((item) =>
        requireMatchingAccount(item?.transaction?.signer_id, expectedAccount),
      );
      return output;
    case "sign_delegate_actions": {
      const values = output.signedDelegateActions;
      if (!Array.isArray(values)) throw new Error("mobile_bridge_invalid_delegate_results");
      return {
        signedDelegatesWithHashes: values.map((value: string) => {
          const signedDelegate = decodeSignedDelegate(value);
          requireMatchingAccount(signedDelegate.delegateAction.senderId, expectedAccount);
          return {
            signedDelegate,
            delegateHash: sha256(serialize(SCHEMA.DelegateAction, signedDelegate.delegateAction)),
          };
        }),
      };
    }
    case "verify_owner":
      requireMatchingAccount(output.accountId, expectedAccount);
      return {
        ...output,
        keyType: output.publicKey.startsWith("secp256k1:") ? KeyType.SECP256K1 : KeyType.ED25519,
      };
    default:
      // Never silently resolve undefined for an id this mapper doesn't know.
      throw new Error("mobile_bridge_unsupported_action_result");
  }
}

function normalizeFunctionCallKeyForMeta(input: any): unknown {
  if (input.addFunctionCallKey != null) return input.addFunctionCallKey;
  if (input.contract == null) return undefined;
  return {
    contractId: input.contract.id,
    allowMethods: {
      anyMethod: input.contract.methods == null,
      ...(input.contract.methods == null ? {} : { methodNames: input.contract.methods }),
    },
  };
}
