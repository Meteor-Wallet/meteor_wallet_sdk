import type { IActionPayload_Request_JsonObject } from "@meteorwallet/connect";
import {
  act_impl_meteor_wallet_core,
  act_impl_near,
  type EWalletProtocolCapability,
  REQUIRED_METEOR_WALLET_CAPABILITIES,
} from "@meteorwallet/connect-shared";
import {
  type EMeteorAppId,
  getServerRequiredWalletCapabilities,
} from "@meteorwallet/connect-shared";
import { KeyPair, type KeyPairString } from "@near-js/crypto";
import { base64 } from "@scure/base";
import { convertOldFunctionCallKeyDefToNew } from "../../../near_utils/convertOldFunctionCallKeyDefToNew";
import type { TNearNativeAction } from "../../../near_utils/meteor_actions.types";
import type { TMCActionRegistry } from "../../action/mc_action.combined";
import type { TMCActionRequestUnionExpandedInput } from "../../action/mc_action.types";
import type { IMeteorConnectRecoveredMessageParams } from "../../MeteorConnect.types";
import type {
  IMobileBridgePendingRequestHandle,
  IMobileBridgePreparedAction,
  IMobileBridgeSensitiveTransferSource,
} from "./MeteorConnectMobileBridgeClient.types";
import type {
  IMobileBridgePendingAction,
  IMobileBridgePendingRequestRecord,
  IMobileBridgePendingRequestStore,
  TRecoverableSdkActionId,
} from "./mobileBridgeStorage";

function decodeJsonOrBase64(bytes: Uint8Array): unknown {
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return base64.encode(bytes);
  }
}

export function nearActionToConnectorAction(action: TNearNativeAction): {
  type: string;
  params: Record<string, unknown>;
} {
  if (action.createAccount != null) return { type: "CreateAccount", params: {} };
  if (action.deployContract != null) {
    return {
      type: "DeployContract",
      params: { code: base64.encode(action.deployContract.code), codeEncoding: "base64" },
    };
  }
  if (action.functionCall != null) {
    const args = decodeJsonOrBase64(action.functionCall.args);
    return {
      type: "FunctionCall",
      params: {
        methodName: action.functionCall.methodName,
        args,
        ...(typeof args === "string" ? { argsEncoding: "base64" } : {}),
        gas: action.functionCall.gas.toString(),
        deposit: action.functionCall.deposit.toString(),
      },
    };
  }
  if (action.transfer != null) {
    return { type: "Transfer", params: { deposit: action.transfer.deposit.toString() } };
  }
  if (action.stake != null) {
    return {
      type: "Stake",
      params: {
        stake: action.stake.stake.toString(),
        publicKey: action.stake.publicKey.toString(),
      },
    };
  }
  if (action.addKey != null) {
    const functionCall = action.addKey.accessKey.permission.functionCall;
    return {
      type: "AddKey",
      params: {
        publicKey: action.addKey.publicKey.toString(),
        accessKey: {
          nonce: action.addKey.accessKey.nonce.toString(),
          permission:
            functionCall == null
              ? "FullAccess"
              : {
                  receiverId: functionCall.receiverId,
                  allowance: functionCall.allowance?.toString(),
                  methodNames: functionCall.methodNames,
                },
        },
      },
    };
  }
  if (action.deleteKey != null) {
    return { type: "DeleteKey", params: { publicKey: action.deleteKey.publicKey.toString() } };
  }
  if (action.deleteAccount != null) {
    return {
      type: "DeleteAccount",
      params: { beneficiaryId: action.deleteAccount.beneficiaryId },
    };
  }
  throw new Error("mobile_bridge_unsupported_near_action");
}

function normalizeFunctionCallKey(input: any): any {
  if (input.addFunctionCallKey != null) return input.addFunctionCallKey;
  if (input.contract == null) return undefined;
  return convertOldFunctionCallKeyDefToNew({
    contractId: input.contract.id,
    methodNames: input.contract.methods,
  });
}

/**
 * Per-action wallet capability set sent to create_bridge/push: the base partner requirements
 * unioned with whatever the server would enforce for this action's domain/id (e.g.
 * transfer_accounts_v1). The server unions its own set anyway — sending the full set keeps
 * wallet-link filtering, failure codes, and idempotency hashes consistent with what it stores.
 */
export function getActionRequiredWalletCapabilities(
  actionRequest: Pick<IActionPayload_Request_JsonObject, "domain" | "id">,
): EWalletProtocolCapability[] {
  return [
    ...new Set([
      ...REQUIRED_METEOR_WALLET_CAPABILITIES,
      ...getServerRequiredWalletCapabilities({
        domain: actionRequest.domain,
        id: actionRequest.id,
      }),
    ]),
  ].sort();
}

export async function sdkActionToMobileBridge(
  sdkRequest: TMCActionRequestUnionExpandedInput<TMCActionRegistry>,
  sensitiveTransferSource?: IMobileBridgeSensitiveTransferSource,
): Promise<IMobileBridgePreparedAction> {
  if (sdkRequest.id === "meteor_wallet_core::transfer_accounts") {
    // The wire payload is regenerated per bridge (fresh key + ciphertext) from the sensitive
    // attachment — sdkRequest.expandedInput holds only the initial build and is never sent.
    if (sensitiveTransferSource == null) {
      throw new Error("mobile_bridge_transfer_attachment_missing");
    }
    const actionInput = await sensitiveTransferSource.buildFreshBridgePayload();
    return {
      sdkRequest,
      kind: { domain: "meteor_wallet_core", sharedActionId: "transfer_accounts" },
      actionInput,
      actionRequest: act_impl_meteor_wallet_core.action.transfer_accounts
        .request(actionInput)
        .toJsonObject(),
    };
  }
  if (sdkRequest.id === "meteor_wallet_core::new_key_account_transfer_start") {
    return {
      sdkRequest,
      kind: { domain: "meteor_wallet_core", sharedActionId: "new_key_account_transfer_start" },
      actionInput: sdkRequest.expandedInput,
      actionRequest: act_impl_meteor_wallet_core.action.new_key_account_transfer_start
        .request(sdkRequest.expandedInput)
        .toJsonObject(),
    };
  }
  if (sdkRequest.id === "meteor_wallet_core::new_key_account_transfer_verify_active") {
    return {
      sdkRequest,
      kind: {
        domain: "meteor_wallet_core",
        sharedActionId: "new_key_account_transfer_verify_active",
      },
      actionInput: sdkRequest.expandedInput,
      actionRequest: act_impl_meteor_wallet_core.action.new_key_account_transfer_verify_active
        .request(sdkRequest.expandedInput)
        .toJsonObject(),
    };
  }
  return nearActionToMobileBridge(sdkRequest);
}

/**
 * NEAR requests over the session bridge. The backend's
 * `session_policies.ts::hasImplementedRecoverySeams` admits the `act_impl_near` domain, so these
 * adapters carry sign-in and every account-bound NEAR action for mobile-connected accounts.
 */
async function nearActionToMobileBridge(
  sdkRequest: TMCActionRequestUnionExpandedInput<TMCActionRegistry>,
): Promise<IMobileBridgePreparedAction> {
  const input: any = sdkRequest.expandedInput;
  let pendingFunctionCallKey: KeyPair | undefined;
  let addFunctionCallKey = normalizeFunctionCallKey(input);
  if (addFunctionCallKey != null && addFunctionCallKey.publicKey == null) {
    pendingFunctionCallKey = KeyPair.fromRandom("ed25519");
    addFunctionCallKey = {
      ...addFunctionCallKey,
      publicKey: pendingFunctionCallKey.getPublicKey().toString(),
    };
  }

  switch (sdkRequest.id) {
    case "near::sign_in": {
      const actionInput = { network: input.target.network, addFunctionCallKey };
      return {
        sdkRequest,
        kind: { domain: "near", sharedActionId: "sign_in", pendingFunctionCallKey },
        actionInput,
        actionRequest: act_impl_near.action.sign_in.request(actionInput).toJsonObject(),
      };
    }
    case "near::sign_in_and_sign_message": {
      const actionInput = {
        network: input.target.network,
        addFunctionCallKey,
        messageParams: {
          message: input.messageParams.message,
          recipient: input.messageParams.recipient,
          nonceBase64: base64.encode(input.messageParams.nonce),
        },
      };
      return {
        sdkRequest,
        kind: {
          domain: "near",
          sharedActionId: "sign_in_and_sign_message",
          pendingFunctionCallKey,
          retainedMessageState: input.messageParams.state,
        },
        actionInput,
        actionRequest: act_impl_near.action.sign_in_and_sign_message
          .request(actionInput)
          .toJsonObject(),
      };
    }
    case "near::sign_out": {
      const actionInput = {
        accountId: input.account.identifier.accountId,
        network: input.account.identifier.network,
      };
      return {
        sdkRequest,
        kind: { domain: "near", sharedActionId: "sign_out" },
        actionInput,
        actionRequest: act_impl_near.action.sign_out.request(actionInput).toJsonObject(),
      };
    }
    case "near::sign_message": {
      const actionInput = {
        signerId: input.account.identifier.accountId,
        network: input.account.identifier.network,
        message: input.messageParams.message,
        recipient: input.messageParams.recipient,
        nonceBase64: base64.encode(input.messageParams.nonce),
      };
      return {
        sdkRequest,
        kind: {
          domain: "near",
          sharedActionId: "sign_message",
          retainedMessageState: input.messageParams.state,
        },
        actionInput,
        actionRequest: act_impl_near.action.sign_message.request(actionInput).toJsonObject(),
      };
    }
    case "near::sign_transactions": {
      if (input.transactions.length === 0) throw new Error("mobile_bridge_empty_transactions");
      const transactions = input.transactions.map((transaction: any) => ({
        receiverId: transaction.receiverId,
        actions: transaction.actions.map(nearActionToConnectorAction),
      }));
      const common = {
        signerId: input.account.identifier.accountId,
        network: input.account.identifier.network,
      };
      if (transactions.length === 1) {
        const actionInput = { ...common, ...transactions[0] };
        return {
          sdkRequest,
          kind: { domain: "near", sharedActionId: "sign_and_send_transaction" },
          actionInput,
          actionRequest: act_impl_near.action.sign_and_send_transaction
            .request(actionInput)
            .toJsonObject(),
        };
      }
      const actionInput = { ...common, transactions };
      return {
        sdkRequest,
        kind: { domain: "near", sharedActionId: "sign_and_send_transactions" },
        actionInput,
        actionRequest: act_impl_near.action.sign_and_send_transactions
          .request(actionInput)
          .toJsonObject(),
      };
    }
    case "near::sign_delegate_actions": {
      const actionInput = {
        signerId: input.account.identifier.accountId,
        network: input.account.identifier.network,
        delegateActions: input.delegateActions.map((delegateAction: any) => ({
          receiverId: delegateAction.receiverId,
          actions: delegateAction.actions.map(nearActionToConnectorAction),
        })),
      };
      return {
        sdkRequest,
        kind: { domain: "near", sharedActionId: "sign_delegate_actions" },
        actionInput,
        actionRequest: act_impl_near.action.sign_delegate_actions
          .request(actionInput)
          .toJsonObject(),
      };
    }
    case "near::verify_owner": {
      const actionInput = {
        accountId: input.account.identifier.accountId,
        network: input.account.identifier.network,
        message: input.message,
      };
      return {
        sdkRequest,
        kind: { domain: "near", sharedActionId: "verify_owner" },
        actionInput,
        actionRequest: act_impl_near.action.verify_owner.request(actionInput).toJsonObject(),
      };
    }
    default:
      throw new Error("mobile_bridge_unsupported_sdk_action");
  }
}

//
// Reload recovery
//

const RECOVERABLE_SDK_ACTION_IDS: ReadonlySet<string> = new Set<TRecoverableSdkActionId>([
  "near::sign_in",
  "near::sign_in_and_sign_message",
  "near::sign_out",
  "near::sign_message",
  "near::sign_transactions",
  "near::sign_delegate_actions",
  "near::verify_owner",
]);

const isRecoverableSdkActionId = (id: string): id is TRecoverableSdkActionId =>
  RECOVERABLE_SDK_ACTION_IDS.has(id);

/** The expanded-input fields `nearOutputToSdk` reads besides the targeted account's identifier. */
const RECOVERED_EXPANDED_INPUT_KEYS = ["target", "addFunctionCallKey", "contract"] as const;

/**
 * What a reloaded tab needs to collect this request's answer, or `undefined` for a request it
 * cannot collect. Only the NEAR actions qualify: the transfer families carry key handles and
 * external-work state that a page never writes down.
 */
export function preparedActionToPendingAction(
  prepared: IMobileBridgePreparedAction,
): { action: IMobileBridgePendingAction; functionCallKey?: KeyPairString } | undefined {
  const kind = prepared.kind;
  const sdkActionId = prepared.sdkRequest.id;
  if (kind.domain !== "near" || !isRecoverableSdkActionId(sdkActionId)) return undefined;
  const input: any = prepared.sdkRequest.expandedInput;
  const expandedInput: Record<string, unknown> = {};
  for (const key of RECOVERED_EXPANDED_INPUT_KEYS) {
    if (input?.[key] != null) expandedInput[key] = input[key];
  }
  const identifier = input?.account?.identifier;
  if (identifier != null) expandedInput.account = { identifier };
  return {
    action: {
      sdkActionId,
      sharedActionId: kind.sharedActionId,
      actionRequest: prepared.actionRequest,
      actionInput: prepared.actionInput,
      ...(kind.retainedMessageState == null
        ? {}
        : { retainedMessageState: kind.retainedMessageState }),
      expandedInput,
    },
    ...(kind.pendingFunctionCallKey == null
      ? {}
      : { functionCallKey: kind.pendingFunctionCallKey.toString() }),
  };
}

/**
 * The pending-request handle a session writes and clears its record through, or `undefined` for a
 * request a reloaded tab could not collect (see {@link preparedActionToPendingAction}).
 */
export function createPendingRequestHandle(input: {
  store: IMobileBridgePendingRequestStore;
  requestId: string;
  prepared: IMobileBridgePreparedAction;
  meteorAppIds: readonly EMeteorAppId[];
  expectedWalletVerifyPublicKey?: string;
}): IMobileBridgePendingRequestHandle | undefined {
  const recoverable = preparedActionToPendingAction(input.prepared);
  if (recoverable == null) return undefined;
  return {
    write: (token, walletLink) => {
      input.store.write({
        v: 1,
        requestId: input.requestId,
        createdAt: Date.now(),
        expiresAt: token.facts.absoluteExpiresAt,
        meteorAppIds: [...input.meteorAppIds],
        ...(input.expectedWalletVerifyPublicKey == null
          ? {}
          : { expectedWalletVerifyPublicKey: input.expectedWalletVerifyPublicKey }),
        token,
        // Only the link itself: its fragment secret is the token's own `partnerSecret`.
        ...(walletLink == null
          ? {}
          : { walletLink: { linkString: walletLink.linkString, linkType: walletLink.linkType } }),
        ...recoverable,
      });
    },
    // Added to this request's own record only: a record that is gone (or now another request's)
    // has nothing left to recover.
    recordAnswer: (answer) => {
      const current = input.store.read();
      if (current == null || current.requestId !== input.requestId) return;
      input.store.write({ ...current, answer });
    },
    // Another request's record is never touched.
    clear: () => input.store.clear(input.requestId),
  };
}

/**
 * The prepared action a recovered session carries. Its SDK request holds only the fields the
 * result mapping reads (see {@link IMobileBridgePendingAction}); that narrowing is the one cast
 * here, and nothing on the recovered path reads any other member of the expanded input.
 */
export function pendingRequestToPreparedAction(
  record: IMobileBridgePendingRequestRecord,
): IMobileBridgePreparedAction {
  const { action } = record;
  const sdkRequest = {
    id: action.sdkActionId,
    expandedInput: action.expandedInput,
  } as unknown as TMCActionRequestUnionExpandedInput<TMCActionRegistry>;
  return {
    sdkRequest,
    actionRequest: action.actionRequest,
    actionInput: action.actionInput,
    kind: {
      domain: "near",
      sharedActionId: action.sharedActionId,
      ...(record.functionCallKey == null
        ? {}
        : { pendingFunctionCallKey: KeyPair.fromString(record.functionCallKey) }),
      ...(action.retainedMessageState == null
        ? {}
        : { retainedMessageState: action.retainedMessageState }),
    },
  };
}

/**
 * The NEP-413 params a recorded sign-message request staged — what a reloaded page needs to verify
 * the recovered signature, which its own memory no longer holds. Read back from the staged wire
 * input without trusting its shape; `undefined` for any other action or anything unreadable.
 */
export function pendingActionMessageParams(
  action: IMobileBridgePendingAction,
): IMeteorConnectRecoveredMessageParams | undefined {
  const input = action.actionInput;
  if (typeof input !== "object" || input == null) return undefined;
  const staged =
    action.sharedActionId === "sign_message"
      ? input
      : action.sharedActionId === "sign_in_and_sign_message" && "messageParams" in input
        ? input.messageParams
        : undefined;
  if (typeof staged !== "object" || staged == null) return undefined;
  if (!("message" in staged) || !("recipient" in staged) || !("nonceBase64" in staged)) {
    return undefined;
  }
  const { message, recipient, nonceBase64 } = staged;
  if (
    typeof message !== "string" ||
    typeof recipient !== "string" ||
    typeof nonceBase64 !== "string"
  ) {
    return undefined;
  }
  try {
    return { message, recipient, nonce: base64.decode(nonceBase64) };
  } catch {
    return undefined;
  }
}
