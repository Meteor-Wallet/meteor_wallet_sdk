import { PublicKey } from "./actionCreator/public_key";
import { actionCreators } from './actionCreator/action_creators'
import type { AddKeyPermission } from "./wallet_selector_actions.types";
import type { IMeteorGasKeyInfo, TMeteorAction } from "./meteor_actions.types";

const getAccessKey = (permission: AddKeyPermission) => {
  if (permission === "FullAccess") {
    return actionCreators.fullAccessKey();
  }

  const { receiverId, methodNames = [] } = permission;
  const allowance = permission.allowance ? BigInt(permission.allowance) : undefined;

  return actionCreators.functionCallAccessKey(receiverId, methodNames, allowance);
};

const getGasAccessKey = (permission: AddKeyPermission, gasKeyInfo: IMeteorGasKeyInfo) => {
  const transformedGasKeyInfo = {
    balance: BigInt(gasKeyInfo.balance),
    numNonces: gasKeyInfo.numNonces
  }
  if (permission === "FullAccess") {
    return actionCreators.gasKeyFullAccessKey(transformedGasKeyInfo);
  }

  const { receiverId, methodNames = [] } = permission;
  const allowance = permission.allowance ? BigInt(permission.allowance) : undefined;

  return actionCreators.gasKeyFunctionCallAccessKey(receiverId, methodNames, transformedGasKeyInfo, allowance);
};

export const parseArgs = (data: Object | string) => {
  if (typeof data === "string") return Buffer.from(data, "base64");
  return data;
};

export const convertSelectorActionToNearAction = (action: TMeteorAction) => {
  switch (action.type) {
    case "CreateAccount":
      return actionCreators.createAccount();
    case "DeployContract": {
      const { code } = action.params;

      return actionCreators.deployContract(code);
    }
    case "FunctionCall": {
      const { methodName, args, gas, deposit } = action.params;

      return actionCreators.functionCall(methodName, parseArgs(args), BigInt(gas), BigInt(deposit));
    }
    case "Transfer": {
      const { deposit } = action.params;

      return actionCreators.transfer(BigInt(deposit));
    }
    case "Stake": {
      const { stake, publicKey } = action.params;

      return actionCreators.stake(BigInt(stake), PublicKey.from(publicKey));
    }
    case "AddKey": {
      const { publicKey, accessKey, gasKeyInfo } = action.params;

      if(gasKeyInfo){
        return actionCreators.addKey(
          PublicKey.from(publicKey), // TODO: Use accessKey.nonce? near-api-js seems to think 0 is fine?
          getGasAccessKey(accessKey.permission, gasKeyInfo),
        )
      }

      return actionCreators.addKey(
        PublicKey.from(publicKey), // TODO: Use accessKey.nonce? near-api-js seems to think 0 is fine?
        getAccessKey(accessKey.permission),
      );
    }
    case "DeleteKey": {
      const { publicKey } = action.params;

      return actionCreators.deleteKey(PublicKey.from(publicKey));
    }
    case "DeleteAccount": {
      const { beneficiaryId } = action.params;
      return actionCreators.deleteAccount(beneficiaryId);
    }
    case "TransferToGasKey": {
      const { publicKey, deposit } = action.params;

      return actionCreators.transferToGasKey(PublicKey.from(publicKey), BigInt(deposit))
    }
    case "WithdrawFromGasKey": {
      const { publicKey, amount } = action.params;

      return actionCreators.withdrawFromGasKey(PublicKey.from(publicKey), BigInt(amount))
    }
    default:
      throw new Error("Invalid action type");
  }
};
