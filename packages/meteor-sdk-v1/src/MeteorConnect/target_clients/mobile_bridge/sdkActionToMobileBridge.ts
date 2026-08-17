import {
  act_impl_meteor_wallet_core,
  act_impl_near,
  type EWalletProtocolCapability,
  getServerRequiredWalletCapabilities,
  REQUIRED_METEOR_WALLET_CAPABILITIES,
} from "@meteorwallet/connect-shared";
import { KeyPair } from "@near-js/crypto";
import type { IActionPayload_Request_JsonObject } from "@nice-code/action";
import { base64 } from "@scure/base";
import { convertOldFunctionCallKeyDefToNew } from "../../../near_utils/convertOldFunctionCallKeyDefToNew";
import type { TNearNativeAction } from "../../../near_utils/meteor_actions.types";
import type { TMCActionRegistry } from "../../action/mc_action.combined";
import type { TMCActionRequestUnionExpandedInput } from "../../action/mc_action.types";
import type {
  IMobileBridgePreparedAction,
  IMobileBridgeSensitiveTransferSource,
} from "./MeteorConnectMobileBridgeClient.types";

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
      actionRequest: act_impl_meteor_wallet_core.action.transfer_accounts
        .request(actionInput)
        .toJsonObject(),
    };
  }
  if (sdkRequest.id === "meteor_wallet_core::new_key_account_transfer_start") {
    return {
      sdkRequest,
      kind: { domain: "meteor_wallet_core", sharedActionId: "new_key_account_transfer_start" },
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
      actionRequest: act_impl_meteor_wallet_core.action.new_key_account_transfer_verify_active
        .request(sdkRequest.expandedInput)
        .toJsonObject(),
    };
  }
  return nearActionToMobileBridge(sdkRequest);
}

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
    case "near::sign_in":
      return {
        sdkRequest,
        kind: { domain: "near", sharedActionId: "sign_in", pendingFunctionCallKey },
        actionRequest: act_impl_near.action.sign_in
          .request({ network: input.target.network, addFunctionCallKey })
          .toJsonObject(),
      };
    case "near::sign_in_and_sign_message":
      return {
        sdkRequest,
        kind: {
          domain: "near",
          sharedActionId: "sign_in_and_sign_message",
          pendingFunctionCallKey,
          retainedMessageState: input.messageParams.state,
        },
        actionRequest: act_impl_near.action.sign_in_and_sign_message
          .request({
            network: input.target.network,
            addFunctionCallKey,
            messageParams: {
              message: input.messageParams.message,
              recipient: input.messageParams.recipient,
              nonceBase64: base64.encode(input.messageParams.nonce),
            },
          })
          .toJsonObject(),
      };
    case "near::sign_out":
      return {
        sdkRequest,
        kind: { domain: "near", sharedActionId: "sign_out" },
        actionRequest: act_impl_near.action.sign_out
          .request({
            accountId: input.account.identifier.accountId,
            network: input.account.identifier.network,
          })
          .toJsonObject(),
      };
    case "near::sign_message":
      return {
        sdkRequest,
        kind: {
          domain: "near",
          sharedActionId: "sign_message",
          retainedMessageState: input.messageParams.state,
        },
        actionRequest: act_impl_near.action.sign_message
          .request({
            signerId: input.account.identifier.accountId,
            network: input.account.identifier.network,
            message: input.messageParams.message,
            recipient: input.messageParams.recipient,
            nonceBase64: base64.encode(input.messageParams.nonce),
          })
          .toJsonObject(),
      };
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
        return {
          sdkRequest,
          kind: { domain: "near", sharedActionId: "sign_and_send_transaction" },
          actionRequest: act_impl_near.action.sign_and_send_transaction
            .request({ ...common, ...transactions[0] })
            .toJsonObject(),
        };
      }
      return {
        sdkRequest,
        kind: { domain: "near", sharedActionId: "sign_and_send_transactions" },
        actionRequest: act_impl_near.action.sign_and_send_transactions
          .request({ ...common, transactions })
          .toJsonObject(),
      };
    }
    case "near::sign_delegate_actions":
      return {
        sdkRequest,
        kind: { domain: "near", sharedActionId: "sign_delegate_actions" },
        actionRequest: act_impl_near.action.sign_delegate_actions
          .request({
            signerId: input.account.identifier.accountId,
            network: input.account.identifier.network,
            delegateActions: input.delegateActions.map((delegateAction: any) => ({
              receiverId: delegateAction.receiverId,
              actions: delegateAction.actions.map(nearActionToConnectorAction),
            })),
          })
          .toJsonObject(),
      };
    case "near::verify_owner":
      return {
        sdkRequest,
        kind: { domain: "near", sharedActionId: "verify_owner" },
        actionRequest: act_impl_near.action.verify_owner
          .request({
            accountId: input.account.identifier.accountId,
            network: input.account.identifier.network,
            message: input.message,
          })
          .toJsonObject(),
      };
    default:
      throw new Error("mobile_bridge_unsupported_sdk_action");
  }
}
