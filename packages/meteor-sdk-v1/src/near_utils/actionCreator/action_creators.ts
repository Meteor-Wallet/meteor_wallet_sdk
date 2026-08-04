import type { PublicKey } from './public_key';

import {
    AccessKey,
    AccessKeyPermission,
    Action,
    AddKey,
    CreateAccount,
    DelegateV2,
    DelegateActionV2,
    DeployGlobalContract,
    DeterministicAccountStateInitV1,
    DeterministicStateInit,
    DeleteAccount,
    DeleteKey,
    DeployContract,
    FullAccessPermission,
    FunctionCall,
    FunctionCallPermission,
    GasKeyFullAccessPermission,
    GasKeyFunctionCallPermission,
    GasKeyInfo,
    GasKeyNonce,
    GlobalContractDeployMode,
    GlobalContractIdentifier,
    Nonce,
    SignedDelegate,
    StateInit,
    Stake,
    TransactionNonce,
    Transfer,
    TransferToGasKey,
    UseGlobalContract,
    VersionedDelegateActionPayloadSchema,
    WithdrawFromGasKey,
} from './actions';
import type { DelegateAction } from './delegate';
import type { Signature } from './signature';

/**
 * Creates a full access key with full access permissions.
 * @returns A new full access key.
 */
function fullAccessKey(): AccessKey {
    return new AccessKey({
        nonce: 0n,
        permission: new AccessKeyPermission({
            fullAccess: new FullAccessPermission(),
        }),
    });
}

/**
 * Creates an access key with function call permission for a specific receiver and method names.
 * @param receiverId The NEAR account ID of the function call receiver.
 * @param methodNames An array of method names allowed for function calls.
 * @param allowance An optional allowance (maximum amount) for the function call. Default: Unlimited.
 * @returns A new access key with function call permission.
 */
function functionCallAccessKey(
    receiverId: string,
    methodNames: string[],
    allowance?: bigint
): AccessKey {
    return new AccessKey({
        nonce: 0n,
        permission: new AccessKeyPermission({
            functionCall: new FunctionCallPermission({
                receiverId,
                allowance,
                methodNames,
            }),
        }),
    });
}

/**
 * Creates an access key with gas-key function call permission.
 * @param receiverId The NEAR account ID of the function call receiver.
 * @param methodNames An array of method names allowed for function calls.
 * @param gasKeyInfo Gas-key metadata for the access key.
 * @param allowance An optional allowance (maximum amount) for the function call. Default: Unlimited.
 * @returns A new access key with gas-key function call permission.
 */
function gasKeyFunctionCallAccessKey(
    receiverId: string,
    methodNames: string[],
    gasKeyInfo: GasKeyInfo,
    allowance?: bigint
): AccessKey {
    const permission = new AccessKeyPermission({
        gasKeyFunctionCall: new GasKeyFunctionCallPermission({
            gasKeyInfo,
            functionCall: new FunctionCallPermission({
                receiverId,
                allowance,
                methodNames,
            }),
        }),
    })

    return new AccessKey({
        nonce: 0n,
        permission,
    });
}

/**
 * Creates a full access gas-key access key.
 * @param gasKeyInfo Gas-key metadata for the access key.
 * @returns A new full access gas-key access key.
 */
function gasKeyFullAccessKey(gasKeyInfo: GasKeyInfo): AccessKey {
    return new AccessKey({
        nonce: 0n,
        permission: new AccessKeyPermission({
            gasKeyFullAccess: new GasKeyFullAccessPermission({
                gasKeyInfo,
            }),
        }),
    });
}

/**
 * Creates a new action for creating a new NEAR account.
 * @returns A new action for creating a new account.
 */
function createAccount(): Action {
    return new Action({ createAccount: new CreateAccount() });
}

/**
 * Creates a new action for deploying a contract with the provided code.
 * @param code The Uint8Array representing the code of the contract.
 * @returns A new action for deploying a contract.
 */
function deployContract(code: Uint8Array): Action {
    return new Action({ deployContract: new DeployContract({ code }) });
}

/**
 * Converts an input argument to a Buffer, handling cases for both JSON and Uint8Array.
 * @param args The input argument, either JSON object or Uint8Array.
 * @returns A Buffer representation of the input argument.
 */
export function stringifyJsonOrBytes(args: any): Buffer {
    const isUint8Array =
        args.byteLength !== undefined && args.byteLength === args.length;
    return isUint8Array ? args : Buffer.from(JSON.stringify(args));
}

/**
 * Constructs {@link Action} instance representing contract method call.
 *
 * @param methodName the name of the method to call
 * @param args arguments to pass to method. Can be either plain JS object which gets serialized as JSON automatically
 *  or `Uint8Array` instance which represents bytes passed as is.
 * @param gas max amount of gas that method call can use
 * @param deposit amount of NEAR (in yoctoNEAR) to send together with the call
 * @param stringify Convert input arguments into bytes array.
 * @param jsContract  Is contract from JS SDK, skips stringification of arguments.
 */
function functionCall(
    methodName: string,
    args: Uint8Array | object,
    gas = 0n,
    deposit = 0n,
    stringify = stringifyJsonOrBytes,
    jsContract = false
): Action {
    if (jsContract) {
        return new Action({
            functionCall: new FunctionCall({ methodName, args: args as Uint8Array, gas, deposit }),
        });
    }

    return new Action({
        functionCall: new FunctionCall({
            methodName,
            args: stringify(args),
            gas,
            deposit,
        }),
    });
}

/**
 * Creates a new action for transferring funds, optionally specifying a deposit amount.
 * @param deposit The amount to be deposited along with the transfer. Default: 0.
 * @returns A new action for transferring funds.
 */
function transfer(deposit = 0n): Action {
    return new Action({ transfer: new Transfer({ deposit }) });
}

/**
 * Creates a new action for staking tokens, specifying the stake amount and public key.
 * @param stake The amount to be staked. Default: 0.
 * @param publicKey The public key associated with the staking action.
 * @returns A new action for staking tokens.
 */
function stake(stake = 0n, publicKey: PublicKey): Action {
    return new Action({ stake: new Stake({ stake, publicKey }) });
}

/**
 * Creates a new action for adding a public key with a specified access key.
 * @param publicKey The public key to be added.
 * @param accessKey The access key associated with the added public key.
 * @returns A new action for adding a public key.
 */
function addKey(publicKey: PublicKey, accessKey: AccessKey): Action {
    return new Action({ addKey: new AddKey({ publicKey, accessKey }) });
}

/**
 * Creates a new action for deleting a public key.
 * @param publicKey The public key to be deleted.
 * @returns A new action for deleting a public key.
 */
function deleteKey(publicKey: PublicKey): Action {
    return new Action({ deleteKey: new DeleteKey({ publicKey }) });
}

/**
 * Creates a new action for deleting an account with the specified beneficiary ID.
 * @param beneficiaryId The NEAR account ID of the beneficiary.
 * @returns A new action for deleting an account.
 */
function deleteAccount(beneficiaryId: string): Action {
    return new Action({ deleteAccount: new DeleteAccount({ beneficiaryId }) });
}

/**
 * Creates a new action for deploying a global contract.
 * @param code The global contract code.
 * @param deployMode The deploy mode for the global contract.
 * @returns A new global contract deployment action.
 */
function deployGlobalContract(code: Uint8Array, deployMode: GlobalContractDeployMode): Action {
    return new Action({
        deployGlobalContract: new DeployGlobalContract({ code, deployMode }),
    });
}

/**
 * Creates a new action for using a global contract.
 * @param contractIdentifier The identifier for the global contract.
 * @returns A new action for selecting a global contract.
 */
function useGlobalContract(contractIdentifier: GlobalContractIdentifier): Action {
    return new Action({
        useGlobalContract: new UseGlobalContract({ contractIdentifier }),
    });
}

/**
 * Creates a V1 state init payload.
 * @param code The code identifier for the state init.
 * @param data The initialization data map.
 * @returns A new V1 state init payload.
 */
function deterministicAccountStateInitV1(
    code: GlobalContractIdentifier,
    data: Map<Uint8Array, Uint8Array>
): StateInit {
    return new StateInit({
        V1: new DeterministicAccountStateInitV1({ code, data }),
    });
}

/**
 * Creates a deterministic state init action.
 * @param deposit The attached deposit.
 * @param stateInit The state init payload.
 * @returns A new deterministic state init action.
 */
function deterministicStateInit(deposit: bigint, stateInit: StateInit): Action {
    return new Action({
        deterministicStateInit: new DeterministicStateInit({ deposit, stateInit }),
    });
}

/**
 * Creates a new action for transferring funds to a gas key.
 * @param publicKey The gas-key public key.
 * @param deposit The amount to transfer.
 * @returns A new transfer-to-gas-key action.
 */
function transferToGasKey(publicKey: PublicKey, deposit: bigint): Action {
    return new Action({
        transferToGasKey: new TransferToGasKey({ publicKey, deposit }),
    });
}

/**
 * Creates a new action for withdrawing funds from a gas key.
 * @param publicKey The gas-key public key.
 * @param amount The amount to withdraw.
 * @returns A new withdraw-from-gas-key action.
 */
function withdrawFromGasKey(publicKey: PublicKey, amount: bigint): Action {
    return new Action({
        withdrawFromGasKey: new WithdrawFromGasKey({ publicKey, amount }),
    });
}

/**
 * Creates a new action for a signed delegation, specifying the delegate action and signature.
 * @param delegateAction The delegate action to be performed.
 * @param signature The signature associated with the delegate action.
 * @returns A new action for a signed delegation.
 */
function signedDelegate({
    delegateAction,
    signature,
}: {
    delegateAction: DelegateAction;
    signature: Signature;
}): Action {
    return new Action({
        signedDelegate: new SignedDelegate({ delegateAction, signature }),
    });
}

/**
 * Creates a standard transaction nonce wrapper for delegate v2.
 * @param nonce The transaction nonce value.
 * @returns A wrapped transaction nonce.
 */
function nonce(nonce: bigint): TransactionNonce {
    return new TransactionNonce({
        nonce: new Nonce({ nonce }),
    });
}

/**
 * Creates a gas-key transaction nonce wrapper for delegate v2.
 * @param nonce The base nonce value.
 * @param nonceIndex The gas-key nonce index.
 * @returns A wrapped gas-key transaction nonce.
 */
function gasKeyNonce(nonce: bigint, nonceIndex: number): TransactionNonce {
    return new TransactionNonce({
        gasKeyNonce: new GasKeyNonce({ nonce, nonceIndex }),
    });
}

/**
 * Creates a versioned v2 delegate action payload.
 * @param delegateAction The delegate action v2 body.
 * @returns The versioned delegate payload.
 */
function versionedDelegateActionV2(delegateAction: DelegateActionV2): VersionedDelegateActionPayloadSchema {
    return new VersionedDelegateActionPayloadSchema({
        v2: delegateAction,
    });
}

/**
 * Creates a new action for a v2 delegate payload and signature.
 * @param delegateAction The versioned delegate action payload.
 * @param signature The signature associated with the delegate action.
 * @returns A new action for a v2 delegate.
 */
function delegateV2({
    delegateAction,
    signature,
}: {
    delegateAction: VersionedDelegateActionPayloadSchema;
    signature: Signature;
}): Action {
    return new Action({
        delegateV2: new DelegateV2({ delegateAction, signature }),
    });
}

export const actionCreators = {
    addKey,
    createAccount,
    delegateV2,
    deployGlobalContract,
    deterministicAccountStateInitV1,
    deterministicStateInit,
    deleteAccount,
    deleteKey,
    deployContract,
    fullAccessKey,
    functionCall,
    functionCallAccessKey,
    gasKeyNonce,
    gasKeyFullAccessKey,
    gasKeyFunctionCallAccessKey,
    nonce,
    signedDelegate,
    stake,
    transfer,
    transferToGasKey,
    useGlobalContract,
    versionedDelegateActionV2,
    withdrawFromGasKey,
};
