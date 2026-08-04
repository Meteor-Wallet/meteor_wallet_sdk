import type { Action } from "../../../../near_utils/actionCreator/actions";
import type { TMeteorAction } from "../../../../near_utils/meteor_actions.types";

const deserializeArgs = (args: Uint8Array) => {
  try {
    return JSON.parse(new TextDecoder().decode(args));
  } catch {
    return args;
  }
};

export const nearActionToSdkV1Action = (action: Action): TMeteorAction => {
  if (action.functionCall) {
    return {
      type: "FunctionCall",
      params: {
        methodName: action.functionCall.methodName,
        args: deserializeArgs(action.functionCall.args),
        gas: action.functionCall.gas.toString(),
        deposit: action.functionCall.deposit.toString(),
      },
    };
  }

  /*if (action.deployGlobalContract) {
    return {
      type: "DeployGlobalContract",
      params: {
        code: action.deployGlobalContract.code,
        deployMode: action.deployGlobalContract.deployMode.AccountId ? "AccountId" : "CodeHash",
      },
    };
  }*/

  if (action.createAccount) {
    return { type: "CreateAccount" };
  }

  /*if (action.useGlobalContract) {
    return {
      type: "UseGlobalContract",
      params: {
        contractIdentifier: action.useGlobalContract.contractIdentifier.AccountId
          ? { accountId: action.useGlobalContract.contractIdentifier.AccountId }
          : { codeHash: base58.encode(action.useGlobalContract.contractIdentifier.CodeHash!) },
      },
    };
  }*/

  if (action.deployContract) {
    return {
      type: "DeployContract",
      params: { code: action.deployContract.code },
    };
  }

  /*if (action.deleteAccount) {
    return {
      type: "DeleteAccount",
      params: { beneficiaryId: action.deleteAccount.beneficiaryId },
    };
  }*/

  if (action.deleteKey) {
    return {
      type: "DeleteKey",
      params: { publicKey: action.deleteKey.publicKey.toString() },
    };
  }

  if (action.transfer) {
    return {
      type: "Transfer",
      params: { deposit: action.transfer.deposit.toString() },
    };
  }

  if (action.stake) {
    return {
      type: "Stake",
      params: {
        stake: action.stake.stake.toString(),
        publicKey: action.stake.publicKey.toString(),
      },
    };
  }

  if(action.transferToGasKey){
    return {
      type: "TransferToGasKey",
      params: {
        publicKey: action.transferToGasKey.publicKey.toString(),
        deposit: action.transferToGasKey.deposit.toString()
      }
    }
  }

  if(action.withdrawFromGasKey){
    return {
      type: "WithdrawFromGasKey",
      params: {
        publicKey: action.withdrawFromGasKey.publicKey.toString(),
        amount: action.withdrawFromGasKey.amount.toString()
      }
    }
  }

  if (action.addKey) {
    if(action.addKey.accessKey.permission.gasKeyFullAccess){
      const { gasKeyInfo } = action.addKey.accessKey.permission.gasKeyFullAccess;
      return {
        type: "AddKey",
        params: {
          publicKey: action.addKey.publicKey.toString(),
          // balance as string: this action crosses a JSON boundary, where bigint cannot survive
          gasKeyInfo: { balance: gasKeyInfo.balance.toString(), numNonces: gasKeyInfo.numNonces },
          accessKey: {
            nonce: Number(action.addKey.accessKey.nonce),
            permission: 'FullAccess'
          }
        }
      }
    }
    
    if(action.addKey.accessKey.permission.gasKeyFunctionCall){
      const { gasKeyInfo } = action.addKey.accessKey.permission.gasKeyFunctionCall;
      return {
        type: "AddKey",
        params: {
          publicKey: action.addKey.publicKey.toString(),
          gasKeyInfo: { balance: gasKeyInfo.balance.toString(), numNonces: gasKeyInfo.numNonces },
          accessKey: {
            nonce: Number(action.addKey.accessKey.nonce),
            permission: {
              receiverId: action.addKey.accessKey.permission.gasKeyFunctionCall.functionCall.receiverId,
              allowance: action.addKey.accessKey.permission.gasKeyFunctionCall.functionCall.allowance?.toString(),
              methodNames: action.addKey.accessKey.permission.gasKeyFunctionCall.functionCall.methodNames,
            }
          }
        }
      }
    }
    return {
      type: "AddKey",
      params: {
        publicKey: action.addKey.publicKey.toString(),
        accessKey: {
          nonce: Number(action.addKey.accessKey.nonce),
          permission: action.addKey.accessKey.permission.functionCall
            ? {
                receiverId: action.addKey.accessKey.permission.functionCall.receiverId,
                allowance: action.addKey.accessKey.permission.functionCall.allowance?.toString(),
                methodNames: action.addKey.accessKey.permission.functionCall.methodNames,
              }
            : "FullAccess",
        },
      },
    };
  }

  throw new Error("Unsupported action type");
};
