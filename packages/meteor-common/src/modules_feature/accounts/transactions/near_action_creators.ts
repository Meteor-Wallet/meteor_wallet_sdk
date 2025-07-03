import { Action, actionCreators, stringifyJsonOrBytes } from "@near-js/transactions";

export class PositionalArgsError extends Error {
  constructor() {
    super(
      "Contract method calls expect named arguments wrapped in object, e.g. { argName1: argValue1, argName2: argValue2 }",
    );
  }
}

function encodeJSContractArgs(contractId: string, method: string, args) {
  return Buffer.concat([
    Buffer.from(contractId),
    Buffer.from([0]),
    Buffer.from(method),
    Buffer.from([0]),
    Buffer.from(args),
  ]);
}

function validateArgs(args: any) {
  const isUint8Array = args.byteLength !== undefined && args.byteLength === args.length;
  if (isUint8Array) {
    return;
  }

  if (Array.isArray(args) || typeof args !== "object") {
    throw new PositionalArgsError();
  }
}

export const DEFAULT_FUNCTION_CALL_GAS = BigInt("30000000000000");

interface IFunctionCallOptions {
  /** The NEAR account id where the contract is deployed */
  contractId: string;
  /** The name of the method to invoke */
  methodName: string;
  /**
   * named arguments to pass the method `{ messageText: 'my message' }`
   */
  args?: object;
  /** max amount of gas that method call can use */
  gas?: bigint;
  /** amount of NEAR (in yoctoNEAR) to send together with the call */
  attachedDeposit?: bigint;
  /**
   * Convert input arguments into bytes array.
   */
  stringify?: (input: any) => Buffer;
  /**
   * Is contract from JS SDK, automatically encodes args from JS SDK to binary.
   */
  jsContract?: boolean;
}

function functionCall({
  contractId,
  methodName,
  args = {},
  gas = DEFAULT_FUNCTION_CALL_GAS,
  jsContract,
  stringify,
  attachedDeposit,
}: IFunctionCallOptions): Action {
  validateArgs(args);
  let functionCallArgs;

  if (jsContract) {
    const encodedArgs = encodeJSContractArgs(contractId, methodName, JSON.stringify(args));
    functionCallArgs = ["call_js_contract", encodedArgs, gas, attachedDeposit, null, true];
  } else {
    const stringifyArg = stringify === undefined ? stringifyJsonOrBytes : stringify;
    functionCallArgs = [methodName, args, gas, attachedDeposit, stringifyArg, false];
  }

  return actionCreators.functionCall.apply(void 0, functionCallArgs);
}

export const near_action_creators = {
  functionCall,
};
