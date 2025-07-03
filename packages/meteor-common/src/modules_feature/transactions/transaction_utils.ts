import { Transaction } from "@near-js/transactions";
import { Action, AddKeyPermission } from "@near-wallet-selector/core";
import { transactions, utils } from "near-api-js";
import { NEAR_SYM } from "../../modules_external/near/near_constants";
import { EFunctionCallMethod_FungibleTokenStandard } from "../../modules_external/near/types/standards/fungible_token_standard_types";
import { ENearFunctionCallMethod_NftStandard } from "../../modules_external/near/types/standards/nft_standard_types";
import {
  ENearIndexer_ActionKind,
  INearIndexer_Transaction_WithActions,
} from "../../modules_external/near_public_indexer/types/near_indexer_transaction_types";

// export type TTransactionType = "receive" | "send" | "self" | "unknown";

export enum ETransactionType {
  receive = "receive",
  send = "send",
  self = "self",
  unknown = "unknown",
}

export const getTrxType = (
  trx: INearIndexer_Transaction_WithActions,
  accountId: string,
): ETransactionType => {
  // const accountId = AppStore.useState((s) => s.selectedAccountId);
  if (trx.signer_account_id === accountId && trx.signer_account_id === trx.receiver_account_id) {
    return ETransactionType.self;
  }
  if (trx.receiver_account_id === "meteor-points.near") {
    return ETransactionType.receive;
  }
  if (trx.signer_account_id === accountId) {
    return ETransactionType.send;
  }
  if (trx.receiver_account_id === accountId) {
    return ETransactionType.receive;
  }
  if (trx?.actions) {
    for (const action of trx.actions) {
      if (action.action_kind === ENearIndexer_ActionKind.FUNCTION_CALL) {
        if (action?.args?.args_json?.receiver_id === accountId) {
          // console.log(action?.args?.method_name)
          // console.log(action?.args?.args_json?.receiver_id)
          return ETransactionType.receive;
        }
      }
    }
  }
  return ETransactionType.unknown;
};

export const isSingleActionTrx = (trx: INearIndexer_Transaction_WithActions) => {
  return trx?.actions && trx.actions.length === 1;
};

const deserializeTransactionsFromString = (transactionsString: string) =>
  transactionsString
    .split(",")
    .map((str) => Buffer.from(str, "base64"))
    .map((buffer) => Transaction.decode(buffer));

const parseNearApiTrxActionToIndexType = (action: transactions.Action) => {
  if (action.functionCall != null) {
    const action_kind: ENearIndexer_ActionKind = ENearIndexer_ActionKind.FUNCTION_CALL;
    const deposit = action.functionCall.deposit.toString(10);
    const gas = action.functionCall.gas.toString(10);
    const method_name = action.functionCall.methodName;
    const args_base64 = Buffer.from(action.functionCall.args).toString("base64");
    let args_json: any;
    let args_str: any;

    try {
      args_str = Buffer.from(action.functionCall.args).toString("utf8");
      try {
        args_json = JSON.parse(args_str);
      } catch (err) {
        console.debug("arg string cannot parse to json:", args_str);
      }
    } catch (err) {
      console.debug("arg string cannot parse by utf_8:", args_str);
    }
    const args = {
      gas,
      method_name,
      deposit,
      args_base64,
      args_json,
      args_str,
    };
    return {
      action_kind,
      args,
    };
  }
  return {};
};

const parseNearApiTrxToIndexType = (trx: transactions.Transaction) => {
  const actions = trx.actions.map(parseNearApiTrxActionToIndexType);
  const receiver_account_id = trx.receiverId;
  const signer_account_id = trx.signerId;
  // trx.blockHash;
  const nonce = trx.nonce;
  const signer_public_key = trx.publicKey;
  return {
    actions,
    signer_public_key,
    signer_account_id,
    receiver_account_id,
    nonce,
  };
};

// 10 yocto NEAR
const NEAR_THRESHOLD_YOCTO_STRING = "10";
const NEAR_THRESHOLD_YOCTO_BIGINT = BigInt(NEAR_THRESHOLD_YOCTO_STRING);

const calcTotalTokenInTransactions = (trxs: transactions.Transaction[]) => {
  const ftTokens: { [tokenName: string]: bigint } = {};
  let totalTokens: {
    type: "ft" | "nft";
    contractName: string;
    amount?: bigint;
    tokenId?: string;
  }[] = [];
  if (!trxs || !trxs.length) {
    return { ftTokens, totalTokens };
  }

  const addToFtToken = (tokenName: string, amount: bigint | string) => {
    if (!ftTokens[tokenName]) {
      ftTokens[tokenName] = BigInt(0);
    }
    ftTokens[tokenName] = ftTokens[tokenName] + BigInt(amount);
  };

  const isOverThreshold = (amount: bigint): boolean => {
    return amount >= NEAR_THRESHOLD_YOCTO_BIGINT;
    // return number_utils.bigIntCompare(amount, NEAR_THRESHOLD_YOCTO_BIGINT) >= 0;
    // return amount.cmp(BigInt(NEAR_THRESHOLD_YOCTO_STRING)) >= 0;
  };

  trxs.forEach((trx) => {
    trx.actions.forEach((action) => {
      try {
        if (action?.transfer?.deposit && isOverThreshold(action?.transfer?.deposit)) {
          addToFtToken(NEAR_SYM, action.transfer.deposit);
        }
        if (action?.functionCall) {
          if (action?.functionCall?.deposit && isOverThreshold(action?.functionCall?.deposit)) {
            addToFtToken(NEAR_SYM, action.functionCall.deposit);
          }
          if (
            action?.functionCall?.methodName ===
              EFunctionCallMethod_FungibleTokenStandard.ft_transfer ||
            action?.functionCall?.methodName ===
              EFunctionCallMethod_FungibleTokenStandard.ft_transfer_call
          ) {
            const parsed = parseNearApiTrxActionToIndexType(action);
            addToFtToken(trx.receiverId, parsed.args?.args_json.amount);
          }
          if (
            action?.functionCall?.methodName === ENearFunctionCallMethod_NftStandard.nft_transfer ||
            action?.functionCall?.methodName === ENearFunctionCallMethod_NftStandard.nft_transfer
          ) {
            const parsed = parseNearApiTrxActionToIndexType(action);
            totalTokens.push({
              type: "nft",
              contractName: trx.receiverId,
              tokenId: parsed.args?.args_json.token_id,
            });
          }
        }
      } catch (err) {
        console.error(err);
      }
    });
  });

  totalTokens = [
    ...totalTokens,
    ...Object.entries(ftTokens).map(([contractName, amount]) => ({
      type: "ft" as const,
      contractName,
      amount,
    })),
  ];

  return {
    ftTokens,
    totalTokens,
  };
};

function tryParseArgsBase64Json(
  rawArgBase64: string | Array<number> | Uint8Array,
): any | undefined {
  if (!rawArgBase64) {
    return;
  }
  try {
    if (typeof rawArgBase64 !== "string") {
      rawArgBase64 = Buffer.from(rawArgBase64).toString("utf8");
    }
    return JSON.parse(rawArgBase64);
  } catch (err) {
    return;
  }
}

function tryAddParseActionArgsJsonForTrx(
  trxs: INearIndexer_Transaction_WithActions | INearIndexer_Transaction_WithActions[],
): INearIndexer_Transaction_WithActions[] {
  if (!trxs) {
    return trxs;
  }

  if (!(trxs instanceof Array)) {
    trxs = [trxs];
  }

  trxs.forEach((trx) => {
    trx?.actions?.forEach?.((action) => {
      if (action.action_kind === ENearIndexer_ActionKind.FUNCTION_CALL) {
        if (action.args.args_json !== undefined) {
          return;
        }

        if (action.args.args_base64) {
          const args_json = tryParseArgsBase64Json(action.args.args_base64);
          if (args_json) {
            action.args.args_json = args_json;
          }
        }
      }
    });
  });

  return trxs;
}

const getAccessKey = (permission: AddKeyPermission) => {
  if (permission === "FullAccess") {
    return transactions.fullAccessKey();
  }

  const { receiverId, methodNames = [] } = permission;
  const allowance = permission.allowance ? BigInt(permission.allowance) : undefined;

  return transactions.functionCallAccessKey(receiverId, methodNames, allowance);
};

const createAction = (action: Action) => {
  switch (action.type) {
    case "CreateAccount":
      return transactions.createAccount();
    case "DeployContract": {
      const { code } = action.params;

      return transactions.deployContract(code);
    }
    case "FunctionCall": {
      const { methodName, args, gas, deposit } = action.params;

      return transactions.functionCall(methodName, args, BigInt(gas), BigInt(deposit));
    }
    case "Transfer": {
      const { deposit } = action.params;

      return transactions.transfer(BigInt(deposit));
    }
    case "Stake": {
      const { stake, publicKey } = action.params;

      return transactions.stake(BigInt(stake), utils.PublicKey.from(publicKey));
    }
    case "AddKey": {
      const { publicKey, accessKey } = action.params;

      return transactions.addKey(
        utils.PublicKey.from(publicKey),
        // TODO: Use accessKey.nonce? near-api-js seems to think 0 is fine?
        getAccessKey(accessKey.permission),
      );
    }
    case "DeleteKey": {
      const { publicKey } = action.params;

      return transactions.deleteKey(utils.PublicKey.from(publicKey));
    }
    case "DeleteAccount": {
      const { beneficiaryId } = action.params;

      return transactions.deleteAccount(beneficiaryId);
    }
    default:
      throw new Error("Invalid action type");
  }
};

export const transaction_utils = {
  deserializeTransactionsFromString,
  parseNearApiTrxActionToIndexType,
  parseNearApiTrxToIndexType,
  calcTotalTokenInTransactions,
  tryAddParseActionArgsJsonForTrx,
  tryParseArgsBase64Json,
  createAction,
};
