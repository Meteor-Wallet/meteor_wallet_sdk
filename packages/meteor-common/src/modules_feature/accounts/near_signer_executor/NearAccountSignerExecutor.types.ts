import { MeteorError } from "@meteorwallet/errors";
import { SignedDelegate, SignedTransaction, Transaction } from "@near-js/transactions";
import { ExecutionError, FinalExecutionOutcome } from "@near-js/types";
import { ExecutionOutcome } from "@perk.money/perk-swap-core";
import { ENearNetwork } from "../../../modules_external/near/types/near_basic_types";

export type TTransactionSimpleNoSigner = Omit<
  Transaction,
  "nonce" | "encode" | "publicKey" | "blockHash" | "signerId"
> & {
  asDelegated?: boolean;
};

export type TTransactionSimple = Omit<
  Transaction,
  "nonce" | "encode" | "publicKey" | "blockHash"
> & {
  asDelegated?: boolean;
};

export interface INearAccountSignerHooks {
  getAccountSigner: (accountId: string, networkId: ENearNetwork) => Promise<TSigner>;
  onStartTransactions: () => void;
  onCompleteTransactions: (outcome: TTransactionExecutionOutcome) => void;
}

export enum ETransactionExecutionStatus {
  pending_signing = "pending_signing",
  awaiting_signer = "awaiting_signer",
  signed = "signed",
  publishing = "publishing",
  success = "success",
  failed = "failed",
}

export enum ESignerExecutor_ExtraStatus {
  cleared = "cleared",
}

/*export type TLedgerStatus_SignerExecutor =
  | ELedgerConnectedStatus
  | ELedgerDisconnectedStatus;*/
export enum ESignerExecutor_LedgerStatus {
  ledger_ready = "ledger_ready",
  ledger_bad_connection_status = "ledger_bad_connection_status",
  ledger_rejected_action = "ledger_rejected_action",
  ledger_error = "ledger_error",
}

export type TSignerExecutor_CombinedStatus =
  | ESignerExecutor_ExtraStatus
  | ETransactionExecutionStatus
  | ESignerExecutor_LedgerStatus;
// | TLedgerStatus_SignerExecutor;

export enum ESignerMethod {
  ledger = "ledger",
  local_key = "local_key",
}

export enum ELedgerStatus_Signing {
  unused = "unused",
  checking = "checking",
  user_input_required = "user_input_required",
  user_rejected_signing = "user_rejected_signing",
  unknown_transport_error = "unknown_transport_error",
}

export interface ILedgerSigner {
  method: ESignerMethod.ledger;
  // "ed25519" prefixed public key string
  publicKey: string;
  // HD path of the key in the ledger
  path: string;
}

export interface ILocalKeySigner {
  method: ESignerMethod.local_key;
  // "ed25519" prefixed public key string
  publicKey: string;
  // "ed25519" prefixed private / secret key string
  privateKey: string;
}

export type TSigner = ILocalKeySigner | ILedgerSigner;

export interface IExecutionStatus_Success {
  status: ETransactionExecutionStatus.success;
  finalExecutionOutcome: FinalExecutionOutcome;
  hash: string;
}

export interface IExecutionStatus_Failed {
  status: ETransactionExecutionStatus.failed;
  finalExecutionOutcome?: FinalExecutionOutcome;
  hash?: string;
  error: MeteorError;
}

export type TExecutionStatus =
  | {
      status:
        | ETransactionExecutionStatus.pending_signing
        | ETransactionExecutionStatus.awaiting_signer
        | ETransactionExecutionStatus.publishing
        | ETransactionExecutionStatus.signed;
    }
  | IExecutionStatus_Success
  | IExecutionStatus_Failed;

export interface ITransactionStep {
  mainOrd: number;
  ordinalId: number;
  stepIndex: number;
  signer: TSigner;
  status: TExecutionStatus;
  transaction: Transaction;
  asDelegated: boolean;
}

export interface IExtraOptionsForStartAwait {
  throwOnNoFinalExecutionOutcome?: boolean;
}

export type TTransactionExecutionOutcome =
  | {
      success: false;
      error?: MeteorError;
      finalExecutionOutcome?: (FinalExecutionOutcome | undefined)[];
    }
  | {
      success: true;
      finalExecutionOutcome: FinalExecutionOutcome[];
    };

export type TOnCompleteTransactionsFunction = (outcome: TTransactionExecutionOutcome) => void;

export interface IAllTransactionsExecutionState {
  isTest: boolean;
  ordinalId: number;
  currentTransactionStatus: TSignerExecutor_CombinedStatus;
  signAndExecute: boolean;
  transactions: ITransactionStep[];
  ledgerInfo: {
    status: ESignerExecutor_LedgerStatus | null;
    version?: string;
  };
  autoCloseModal: boolean;
  noAutoModal: boolean;
  isModalOpen: boolean;
  isProcessing: boolean;
  isCancelable: boolean;
}

export interface IFinalExecutionOutcome_Failure extends FinalExecutionOutcome {
  status: {
    SuccessValue?: undefined;
    Failure: ExecutionError;
  };
}

export interface IReceiptExecutionOutcome_Failure extends ExecutionOutcome {
  status: {
    SuccessValue?: undefined;
    Failure: ExecutionError;
  };
}

export interface INearAccountSignerExecutor_StartOptions {
  signOnly?: boolean;
  isTestSimulation?: boolean;
  onCompleteTransactions?: TOnCompleteTransactionsFunction;
  onCloseModalAfterFinished?: TOnCompleteTransactionsFunction;
  noAutoModal?: boolean;
  autoCloseModal?: boolean;
}

export interface INearAccountSignerExecutor_StartOptions_Await
  extends INearAccountSignerExecutor_StartOptions,
    IExtraOptionsForStartAwait {}

export interface INearAccountSignerExecutorState {
  currentTransactionsOrdinalId: number;
  transactionStateByOrdinalId: {
    [ordinal: number]: IAllTransactionsExecutionState | undefined;
  };
}

export interface ISignedTransactionState {
  signedDelegate?: SignedDelegate;
  signedRegular?: SignedTransaction;
}

export interface ISignerExecutorInternalExecutionState {
  onResolveAwaited?: TOnCompleteTransactionsFunction;
  onComplete?: TOnCompleteTransactionsFunction;
  onCloseModal?: TOnCompleteTransactionsFunction;
  autoCloseModal: boolean;
  ranOnComplete: boolean;
  finalOutcomeState?: TTransactionExecutionOutcome;
  currentTransactionNonce: string;
  transactionStepState: {
    [stepOrd: number]: ISignedTransactionState;
  };
}
