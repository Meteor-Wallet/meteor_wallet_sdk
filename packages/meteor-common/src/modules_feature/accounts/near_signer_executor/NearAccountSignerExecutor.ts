import { IErrorIdWithContextData } from "@meteorwallet/core-sdk/errors/MeteorSdkErrorContext";
import { MeteorSdkErrorV1 } from "@meteorwallet/core-sdk/errors/MeteorSdkErrorV1";
import { TSdkErrorId } from "@meteorwallet/core-sdk/errors/ids/MeteorError.combined_ids";
import { EErrorId_GenericSdk } from "@meteorwallet/core-sdk/errors/ids/MeteorErrorIds";
import { EErrorId_AccountSignerExecutor } from "@meteorwallet/core-sdk/errors/ids/by_feature/old_meteor_wallet.errors";
import { MeteorError, createMeteorErrorSubtype, meteor_error_utils } from "@meteorwallet/errors";
import {
  EErr_NearLedger,
  MeteorNearLedgerError,
} from "@meteorwallet/ledger-client/near/MeteorErrorNearLedger";
import { getNearLedgerClient } from "@meteorwallet/ledger-client/near/NearLedgerClient";
import { PublicKey } from "@near-js/crypto";
import {
  Signature,
  SignedDelegate,
  SignedDelegateWithHash,
  SignedTransaction,
  Transaction,
  buildDelegateAction,
  createTransaction,
  encodeTransaction,
  signDelegateAction,
} from "@near-js/transactions";
import { FinalExecutionOutcome, FinalExecutionStatus, TypedError } from "@near-js/types";
import { parseResultError } from "@near-js/utils";
import Big from "big.js";
import type { Draft } from "immer";
import { sha256 } from "js-sha256";
import { Store } from "pullstate";
import nacl from "tweetnacl";
import { getNearApi } from "../../../modules_external/near/clients/near_api_js/NearApiJsClient";
// import { getNearRpcClientV2 } from "../../../modules_external/near/clients/near_rpc_v2/NearRpcClientV2";
import { ENearNetwork } from "../../../modules_external/near/types/near_basic_types";
import { ENearRpc_Finality } from "../../../modules_external/near/types/near_rpc_types";
import { encoding_base58 } from "../../../modules_utility/encoding/encoding_base58.utils";
import { AsyncUtils } from "../../../modules_utility/javascript_helpers/AsyncUtils";
import { Relayer } from "../../relayer/Relayer";
import {
  ESignerExecutor_LedgerStatus,
  ESignerMethod,
  ETransactionExecutionStatus,
  IAllTransactionsExecutionState,
  IExecutionStatus_Failed,
  IExecutionStatus_Success,
  IFinalExecutionOutcome_Failure,
  ILedgerSigner,
  ILocalKeySigner,
  INearAccountSignerExecutorState,
  INearAccountSignerExecutor_StartOptions,
  IReceiptExecutionOutcome_Failure,
  ISignedTransactionState,
  ISignerExecutorInternalExecutionState,
  ITransactionStep,
  TSigner,
  TTransactionExecutionOutcome,
  TTransactionSimpleNoSigner,
  INearAccountSignerHooks,
} from "./NearAccountSignerExecutor.types";
import { TestLedgerClient } from "./TestLedgerClient";
import { getNearRpcClient } from "../../../modules_external/near/clients/near_rpc/NearRpcClient";
import { getNearRpcClientV2 } from "../../../modules_external/near/clients/near_rpc_v2/NearRpcClientV2";

const DEFAULT_DELEGATE_BLOCK_HEIGHT_TTL = 600;

const unsetMeteorError = createMeteorErrorSubtype<"Unset", TSdkErrorId, IErrorIdWithContextData>(
  "Unset",
);

export class NearAccountSignerExecutor {
  private static instances: { [key: string]: NearAccountSignerExecutor } = {};
  private static getAccountSigner: (accountId: string, networkId: ENearNetwork) => Promise<TSigner>;
  private static onStartTransactions: () => void;
  private static onCompleteTransactions: (outcome: TTransactionExecutionOutcome) => void;
  private static _transactionOrd: number = 0;

  private stateStore: Store<INearAccountSignerExecutorState>;

  private runningOrdinals: {
    [ord: number]: boolean;
  } = {};

  private internalState: {
    [ord: number]: ISignerExecutorInternalExecutionState;
  } = {};

  public static setupHooks({
    onStartTransactions,
    onCompleteTransactions,
    getAccountSigner,
  }: INearAccountSignerHooks) {
    NearAccountSignerExecutor.getAccountSigner = getAccountSigner;
    NearAccountSignerExecutor.onStartTransactions = onStartTransactions;
    NearAccountSignerExecutor.onCompleteTransactions = onCompleteTransactions;
  }

  public static setAccountSignerGetter(
    getAccountSigner: (accountId: string, networkId: ENearNetwork) => Promise<TSigner>,
  ): void {
    NearAccountSignerExecutor.getAccountSigner = getAccountSigner;
  }

  private constructor(
    private accountId: string,
    private networkId: ENearNetwork,
  ) {
    // Initialize the instance with the provided account ID and network ID

    const initialOrd = NearAccountSignerExecutor._transactionOrd++;
    this.stateStore = new Store<INearAccountSignerExecutorState>({
      currentTransactionsOrdinalId: initialOrd,
      transactionStateByOrdinalId: {},
    });
  }

  public static getInstance(accountId: string, networkId: ENearNetwork): NearAccountSignerExecutor {
    const key = `${accountId}-${networkId}`;

    if (!NearAccountSignerExecutor.instances[key]) {
      NearAccountSignerExecutor.instances[key] = new NearAccountSignerExecutor(
        accountId,
        networkId,
      );
    }

    return NearAccountSignerExecutor.instances[key];
  }

  public toggleModal() {
    const { isModalOpen, ordinalId } = this.getTransactionsState();
    this.updateTransactionExecutionState(ordinalId, (s) => {
      s.isModalOpen = !isModalOpen;
    });
  }

  public cancelSigning() {
    console.log("Cancelling signing");
    const { ordinalId, isCancelable } = this.getTransactionsState();

    if (!isCancelable) {
      throw MeteorSdkErrorV1.fromId(
        EErrorId_AccountSignerExecutor.signer_executor_only_cancel_async_signing,
      );
    }

    this.updateTransactionExecutionState(ordinalId, (s, o) => {
      s.currentTransactionStatus = ETransactionExecutionStatus.failed;
      s.transactions = o.transactions.map((t) => {
        if (
          [
            ETransactionExecutionStatus.signed,
            ETransactionExecutionStatus.success,
            ETransactionExecutionStatus.failed,
            ETransactionExecutionStatus.publishing,
          ].includes(t.status.status)
        ) {
          return t;
        }

        return {
          ...t,
          status: {
            status: ETransactionExecutionStatus.failed,
            error: MeteorSdkErrorV1.fromId(
              EErrorId_AccountSignerExecutor.signer_executor_execution_cancelled,
            ) as unknown as MeteorError,
          },
        };
      });
    });

    this.onComplete(ordinalId);
    this.onFinishedCloseModal();

    const newOrdinal = NearAccountSignerExecutor._transactionOrd++;

    this.stateStore.update((s) => {
      s.currentTransactionsOrdinalId = newOrdinal;
    });
  }

  public onFinishedCloseModal(state?: TTransactionExecutionOutcome) {
    const { ordinalId } = this.getTransactionsState();

    const finalState = state ?? this.createFinalOutcomeState(ordinalId);

    this.internalState[ordinalId].onCloseModal?.(finalState);

    this.updateTransactionExecutionState(ordinalId, (s) => {
      s.isModalOpen = false;
    });
  }

  public useTransactionsState(): IAllTransactionsExecutionState | undefined {
    return this.stateStore.useState(
      (s) => s.transactionStateByOrdinalId[s.currentTransactionsOrdinalId],
    );
  }

  private getStep({ stepIndex }: { stepIndex: number; mainOrd: number }) {
    const transaction = this.getTransactionsState().transactions[stepIndex];

    if (!transaction) {
      throw MeteorSdkErrorV1.fromId(
        EErrorId_AccountSignerExecutor.signer_executor_step_index_nonexistent,
      );
    }

    return transaction;
  }

  private getTransactionsState(ord?: number): IAllTransactionsExecutionState & {
    hasLedgerSigner: boolean;
  } {
    const { currentTransactionsOrdinalId, transactionStateByOrdinalId } =
      this.stateStore.getRawState();

    const useOrdId = ord ?? currentTransactionsOrdinalId;

    if (!transactionStateByOrdinalId[useOrdId]) {
      throw MeteorSdkErrorV1.fromId(
        EErrorId_AccountSignerExecutor.signer_executor_ordinal_state_nonexistent,
      );
    }

    const state = transactionStateByOrdinalId[useOrdId]!;

    return {
      ...state,
      hasLedgerSigner: state.transactions.some((t) => t.signer.method === ESignerMethod.ledger),
    };
  }

  private isOrdinalCurrentAndInGoodState(ordinal?: number, onlyCheckOrdinal: boolean = false) {
    const { currentTransactionsOrdinalId, transactionStateByOrdinalId } =
      this.stateStore.getRawState();

    if (
      (ordinal != null && ordinal !== currentTransactionsOrdinalId) ||
      transactionStateByOrdinalId[currentTransactionsOrdinalId] == null
    ) {
      console.warn(
        "Transaction state has changed during execution, aborting previously running transactions",
      );
      return false;
    }

    if (onlyCheckOrdinal) {
      return true;
    }

    const { currentTransactionStatus, transactions } =
      transactionStateByOrdinalId[currentTransactionsOrdinalId]!;

    if (
      [ETransactionExecutionStatus.success, ETransactionExecutionStatus.failed].includes(
        currentTransactionStatus as any,
      )
    ) {
      console.log("Transactions have already either failed or succeeded- cannot continue");
      return false;
    }

    if (transactions.some((t) => t.status.status === ETransactionExecutionStatus.failed)) {
      this.updateTransactionExecutionState(currentTransactionsOrdinalId, (s) => {
        s.currentTransactionStatus = ETransactionExecutionStatus.failed;
      });

      console.warn("A transaction within this batch has failed, aborting further action.");
      return false;
    }

    return true;
  }

  private updateTransactionExecutionState(
    ordinal: number,
    updater: (
      draft: Draft<IAllTransactionsExecutionState>,
      original: IAllTransactionsExecutionState,
    ) => void,
  ) {
    this.stateStore.update((s, o) => {
      updater(s.transactionStateByOrdinalId[ordinal]!, o.transactionStateByOrdinalId[ordinal]!);
    });
  }

  private async getNonceAndBlockHash(
    mainOrd: number,
    signer: TSigner,
    { isTest, finality }: { isTest: boolean; finality?: ENearRpc_Finality },
  ): Promise<{
    nonce: string;
    blockHash: string;
  }> {
    const accessKeyResponse = isTest
      ? TestLedgerClient.get(mainOrd).viewAccessKey()
      : await getNearRpcClient(this.networkId).view_access_key({
          account_id: this.accountId,
          public_key: signer.publicKey,
          finality: finality ?? ENearRpc_Finality.optimistic,
        });

    const currentNonce = new Big(accessKeyResponse.nonce);

    return {
      blockHash: accessKeyResponse.block_hash,
      nonce: currentNonce.toString(),
    };
  }

  public async startTransactionsAwait(
    transactions: TTransactionSimpleNoSigner[],
    options: INearAccountSignerExecutor_StartOptions = {},
  ): Promise<FinalExecutionOutcome[]> {
    // biome-ignore lint/suspicious/noAsyncPromiseExecutor: <explanation>
    return new Promise<FinalExecutionOutcome[]>(async (resolve, reject) => {
      await this._startTransactions(transactions, {
        ...options,
        onCompleteTransactions: (outcome) => {
          let error: Error;

          if (!outcome.success) {
            let badExecutionOutcome: FinalExecutionOutcome | undefined;
            const err = MeteorSdkErrorV1.castOrNull(outcome.error);
            const unsetErr = unsetMeteorError.castOrNull(outcome.error);

            if (err != null) {
              if (
                err.hasId(
                  EErrorId_AccountSignerExecutor.publishing_transaction_failed_final_execution_outcome,
                )
              ) {
                badExecutionOutcome = err.getContextForId(
                  EErrorId_AccountSignerExecutor.publishing_transaction_failed_final_execution_outcome,
                );
              }

              if (
                err.hasId(
                  EErrorId_AccountSignerExecutor.publishing_transaction_failed_receipt_execution_outcome,
                )
              ) {
                const { mergedOutcome } = err.getContextForId(
                  EErrorId_AccountSignerExecutor.publishing_transaction_failed_receipt_execution_outcome,
                );

                badExecutionOutcome = mergedOutcome;
              }

              if (
                err.hasId(EErrorId_AccountSignerExecutor.publishing_transaction_failed_near_error)
              ) {
                reject(
                  err.getContextForId(
                    EErrorId_AccountSignerExecutor.publishing_transaction_failed_near_error,
                  ),
                );
                return;
              }
            }

            if (unsetErr != null) {
              if (
                unsetErr.hasId(
                  EErrorId_AccountSignerExecutor.publishing_transaction_failed_receipt_execution_outcome,
                )
              ) {
                const { mergedOutcome } = unsetErr.getContextForId(
                  EErrorId_AccountSignerExecutor.publishing_transaction_failed_receipt_execution_outcome,
                );

                badExecutionOutcome = mergedOutcome;
              }
            }

            if (!badExecutionOutcome) {
              badExecutionOutcome = outcome.finalExecutionOutcome?.find((result) => {
                if (result == null) {
                  return false;
                }

                if (
                  typeof result.status === "object" &&
                  typeof result.status.Failure === "object" &&
                  result.status.Failure !== null
                ) {
                  return true;
                }
              });
            }

            console.log("Bad execution outcome", badExecutionOutcome);

            if (badExecutionOutcome != null) {
              // if error data has error_message and error_type properties, we consider that node returned an error in the old format
              const executionError = (badExecutionOutcome.status as FinalExecutionStatus).Failure!;

              if (executionError.error_message && executionError.error_type) {
                error = new TypedError(
                  `Transaction ${badExecutionOutcome.transaction_outcome.id} failed. ${executionError.error_message}`,
                  executionError.error_type,
                );
              } else {
                error = parseResultError(badExecutionOutcome);
              }
            } else {
              error = outcome.error ?? MeteorSdkErrorV1.fromId(EErrorId_GenericSdk.unhandled_error);
            }

            if (error instanceof MeteorError) {
              if (
                error.hasId(EErrorId_AccountSignerExecutor.publishing_transaction_failed_near_error)
              ) {
                error = error.getContextForId(
                  EErrorId_AccountSignerExecutor.publishing_transaction_failed_near_error,
                );
              }
            }

            reject(error);
          } else {
            resolve(outcome.finalExecutionOutcome);
          }

          NearAccountSignerExecutor.onCompleteTransactions(outcome);
          options?.onCompleteTransactions?.(outcome);
        },
      });

      console.log("Started transactions");
    });
  }

  private async _startTransactions(
    transactions: TTransactionSimpleNoSigner[],
    {
      signOnly = false,
      isTestSimulation = false,
      onCompleteTransactions,
      noAutoModal = false,
      autoCloseModal = true,
      onCloseModalAfterFinished,
    }: INearAccountSignerExecutor_StartOptions = {},
  ): Promise<void> {
    // Start the signer and executor process for these transactions

    const newMainOrdinal = NearAccountSignerExecutor._transactionOrd++;

    let signer: TSigner;

    try {
      signer = isTestSimulation
        ? TestLedgerClient.get(newMainOrdinal).getSigner()
        : await NearAccountSignerExecutor.getAccountSigner(this.accountId, this.networkId);
    } catch (e) {
      console.error("Error while getting account signer", e);
      NearAccountSignerExecutor.onCompleteTransactions({
        success: false,
        error: meteor_error_utils.meteorOrUnknownError(e),
      });
      throw e;
    }

    const { blockHash, nonce } = await this.getNonceAndBlockHash(newMainOrdinal, signer, {
      isTest: isTestSimulation,
    });

    this.internalState[newMainOrdinal] = {
      autoCloseModal: autoCloseModal,
      transactionStepState: {},
      ranOnComplete: false,
      onComplete: onCompleteTransactions,
      onCloseModal: onCloseModalAfterFinished,
      currentTransactionNonce: nonce,
    };

    const transactionExecutions = transactions.map((transaction, index): ITransactionStep => {
      const nearTransaction = createTransaction(
        this.accountId,
        PublicKey.fromString(signer.publicKey),
        transaction.receiverId,
        // Put a nonce of zero as a placeholder, we will update it later
        "0",
        transaction.actions,
        encoding_base58.decode(blockHash),
      );

      const message = encodeTransaction(nearTransaction);

      // sha256 hash of the encoded transaction (becomes the transaction hash, which can be referenced in Explorer)
      const hash = Buffer.from(sha256.array(message));

      return {
        mainOrd: newMainOrdinal,
        stepIndex: index,
        ordinalId: NearAccountSignerExecutor._transactionOrd++,
        signer,
        status: {
          status: ETransactionExecutionStatus.pending_signing,
        },
        transaction: nearTransaction,
        asDelegated: transaction.asDelegated ?? false,
      };
    });

    const _noAutoModal = noAutoModal ?? false;

    this.stateStore.update((state) => {
      state.currentTransactionsOrdinalId = newMainOrdinal;
      state.transactionStateByOrdinalId[newMainOrdinal] = {
        autoCloseModal: autoCloseModal,
        isModalOpen: !_noAutoModal,
        noAutoModal: _noAutoModal,
        isTest: isTestSimulation,
        currentTransactionStatus: ETransactionExecutionStatus.pending_signing,
        ordinalId: newMainOrdinal,
        signAndExecute: !signOnly,
        ledgerInfo: {
          status: null,
        },
        transactions: transactionExecutions,
        isProcessing: true,
        isCancelable: signer.method === ESignerMethod.ledger,
      };
    });

    this.continueTransactions({ incomingOrdinal: newMainOrdinal });
  }

  private onComplete(mainOrd: number, state?: TTransactionExecutionOutcome) {
    console.log("Running onComplete()");
    try {
      if (!this.internalState[mainOrd].ranOnComplete) {
        if (state == null) {
          try {
            state = this.createFinalOutcomeState(mainOrd);
          } catch (e) {
            state = {
              success: false,
              error: MeteorError.fromId(EErrorId_GenericSdk.unhandled_error),
            };
          }
        }

        this.internalState[mainOrd].ranOnComplete = true;
        this.internalState[mainOrd].finalOutcomeState = state;
        this.internalState[mainOrd].onComplete?.(state);
      }
    } catch (e) {
    } finally {
      if (this.internalState[mainOrd].autoCloseModal) {
        this.onFinishedCloseModal(state);
      }
    }
  }

  private createFinalOutcomeState(
    ordinalId: number,
    error?: MeteorError,
  ): TTransactionExecutionOutcome {
    const { transactions, currentTransactionStatus } = this.getTransactionsState(ordinalId);

    if (error != null) {
      return {
        success: false,
        error,
        finalExecutionOutcome: transactions.map((t) =>
          t.status.status === ETransactionExecutionStatus.failed ||
          t.status.status === ETransactionExecutionStatus.success
            ? t.status.finalExecutionOutcome
            : undefined,
        ),
      };
    }

    if (currentTransactionStatus === ETransactionExecutionStatus.success) {
      return {
        success: true,
        finalExecutionOutcome: transactions.map(
          (t) => (t.status as IExecutionStatus_Success).finalExecutionOutcome,
        ),
      };
    }

    if (currentTransactionStatus === ETransactionExecutionStatus.failed) {
      const step = transactions.find(
        (t) => t.status.status === ETransactionExecutionStatus.failed,
      )!;

      return {
        success: false,
        error: (step.status as IExecutionStatus_Failed).error,
        finalExecutionOutcome: transactions.map((t) =>
          t.status.status === ETransactionExecutionStatus.failed ||
          t.status.status === ETransactionExecutionStatus.success
            ? t.status.finalExecutionOutcome
            : undefined,
        ),
      };
    }

    const { currentTransactionsOrdinalId } = this.stateStore.getRawState();

    if (currentTransactionsOrdinalId !== ordinalId) {
      return {
        success: false,
        error: MeteorError.fromId(EErrorId_AccountSignerExecutor.signer_executor_stale_execution),
      };
    }

    throw MeteorError.fromId(EErrorId_AccountSignerExecutor.signer_executor_execution_not_finished);
  }

  private incrementNonce(mainOrd: number): string {
    const currentNonce = this.internalState[mainOrd].currentTransactionNonce;
    this.internalState[mainOrd].currentTransactionNonce = new Big(currentNonce).add(1).toString();
    return this.internalState[mainOrd].currentTransactionNonce;
  }

  public async continueTransactions(
    inputs: {
      incomingOrdinal?: number;
    } = {},
  ): Promise<void> {
    if (!this.isOrdinalCurrentAndInGoodState(inputs.incomingOrdinal)) {
      if (inputs.incomingOrdinal != null) {
        this.onComplete(inputs.incomingOrdinal);
      } else {
        this.onComplete(this.stateStore.getRawState().currentTransactionsOrdinalId);
      }
      return;
    }

    const { currentTransactionsOrdinalId } = this.stateStore.getRawState();

    if (this.runningOrdinals[currentTransactionsOrdinalId]) {
      console.log("Transactions already running, aborting");
      return;
    }

    this.runningOrdinals[currentTransactionsOrdinalId] = true;
    this.updateTransactionExecutionState(currentTransactionsOrdinalId, (draft) => {
      draft.isProcessing = true;
    });

    try {
      await this._continueTransactions(inputs);
    } catch (e) {
      const error = meteor_error_utils.meteorOrUnknownError(e);
      console.error("Error while continuing to execute a transaction", e);

      if (this.isOrdinalCurrentAndInGoodState(currentTransactionsOrdinalId, true)) {
        const { currentTransactionStatus } = this.getTransactionsState(
          currentTransactionsOrdinalId,
        );

        if (currentTransactionStatus === ETransactionExecutionStatus.failed) {
          console.warn("Threw error with failed state, should handle it");

          const state = this.createFinalOutcomeState(currentTransactionsOrdinalId, error);

          this.onComplete(currentTransactionsOrdinalId, state);
        }
      } else {
        const state = this.createFinalOutcomeState(currentTransactionsOrdinalId, error);

        this.onComplete(currentTransactionsOrdinalId, state);
      }

      throw e;
    } finally {
      this.runningOrdinals[currentTransactionsOrdinalId] = false;
      this.updateTransactionExecutionState(currentTransactionsOrdinalId, (draft) => {
        draft.isProcessing = false;
      });
    }

    this.onComplete(currentTransactionsOrdinalId);
  }

  private async _continueTransactions({
    incomingOrdinal,
  }: {
    incomingOrdinal?: number;
  } = {}) {
    if (!this.isOrdinalCurrentAndInGoodState(incomingOrdinal)) {
      return;
    }

    const { transactions, signAndExecute, hasLedgerSigner, ordinalId, isTest } =
      this.getTransactionsState();

    if (hasLedgerSigner) {
      // Need to sign each transaction in order and then only execute them

      for (const transactionStep of transactions) {
        if (transactionStep.asDelegated) {
          console.warn(
            "Can't sign delegate transactions with Ledger yet. Having no gas will fail the transaction.",
          );
        }
        const nonce = this.incrementNonce(transactionStep.mainOrd);

        await this.signTransaction(transactionStep, nonce);
      }

      this.updateTransactionExecutionState(ordinalId, (draft) => {
        draft.currentTransactionStatus = ETransactionExecutionStatus.signed;
        draft.isCancelable = false;
      });

      NearAccountSignerExecutor.onStartTransactions();

      for (const transactionStep of transactions) {
        await this.executeTransaction(transactionStep, {
          // typeToExecute: transactionStep.asDelegated ? "delegate" : "regular",
          typeToExecute: "regular",
          failOnDelegateError: true,
        });
      }
    } else {
      NearAccountSignerExecutor.onStartTransactions();

      // Can sign and execute in order, to attempt delegated and non-delegated transactions
      for (const transactionStep of transactions) {
        const nonce = this.incrementNonce(transactionStep.mainOrd);

        let signedTransaction = await this.signTransaction(transactionStep, nonce);

        console.log("Signed Transaction", signedTransaction);

        let runRegularTransaction = !transactionStep.asDelegated;

        if (transactionStep.asDelegated) {
          try {
            await this.executeTransaction(transactionStep, {
              typeToExecute: "delegate",
            });
          } catch (e) {
            runRegularTransaction = true;
            console.error(e);

            // If it is a receipt or transaction outcome issue on the delegate transaction, we fail
            // so that we get a better error message (not just a Gas error)
            if (
              e instanceof MeteorError &&
              e.hasOneOfIds([
                EErrorId_AccountSignerExecutor.publishing_transaction_failed_receipt_execution_outcome,
                EErrorId_AccountSignerExecutor.publishing_transaction_failed_final_execution_outcome,
              ])
            ) {
              const finalExecutionOutcome = e.hasId(
                EErrorId_AccountSignerExecutor.publishing_transaction_failed_final_execution_outcome,
              )
                ? e.getContextForId(
                    EErrorId_AccountSignerExecutor.publishing_transaction_failed_final_execution_outcome,
                  )
                : e.getContextForId(
                    EErrorId_AccountSignerExecutor.publishing_transaction_failed_receipt_execution_outcome,
                  ).mergedOutcome;

              const castError = e;

              this.updateTransactionExecutionState(transactionStep.mainOrd, (draft) => {
                draft.transactions[transactionStep.stepIndex].status = {
                  status: ETransactionExecutionStatus.failed,
                  finalExecutionOutcome,
                  hash: finalExecutionOutcome.transaction.hash,
                  error: castError,
                };
                draft.currentTransactionStatus = ETransactionExecutionStatus.failed;
              });

              throw e;
            }

            console.log("Delegated transaction failed, trying regular");
          }
        }

        if (runRegularTransaction) {
          if (transactionStep.asDelegated) {
            const { nonce } = await this.getNonceAndBlockHash(ordinalId, transactionStep.signer, {
              isTest,
              finality: ENearRpc_Finality.final,
            });

            this.internalState[ordinalId].currentTransactionNonce = nonce;
            const wantedNonce = this.incrementNonce(transactionStep.mainOrd);

            if (signedTransaction.signedRegular?.transaction.nonce.toString() !== wantedNonce) {
              signedTransaction = await this.signTransaction(transactionStep, wantedNonce, true);
            }
          }

          await this.executeTransaction(transactionStep, {
            typeToExecute: "regular",
          });
        }
      }
    }

    this.updateTransactionExecutionState(ordinalId, (draft) => {
      draft.currentTransactionStatus = ETransactionExecutionStatus.success;
    });
  }

  private async internalSignDelegateTransaction({
    sign,
    transaction,
  }: {
    sign: (message: Uint8Array) => Promise<Uint8Array>;
    transaction: Transaction;
  }): Promise<SignedDelegateWithHash> {
    const blockQuery = await getNearApi(this.networkId).nativeApi.connection.provider.block({
      finality: "final",
    });

    const delegateAction = buildDelegateAction({
      actions: transaction.actions,
      maxBlockHeight: BigInt(blockQuery.header.height) + BigInt(DEFAULT_DELEGATE_BLOCK_HEIGHT_TTL),
      nonce: transaction.nonce,
      publicKey: transaction.publicKey,
      receiverId: transaction.receiverId,
      senderId: transaction.signerId,
    });

    return await signDelegateAction({
      delegateAction,
      signer: {
        sign,
      },
    });
  }

  private async signTransaction(
    transactionStep: ITransactionStep,
    currentNonce: string,
    forceSignAgain: boolean = false,
  ): Promise<ISignedTransactionState> {
    if (
      !forceSignAgain &&
      this.internalState[transactionStep.mainOrd].transactionStepState[transactionStep.ordinalId]
    ) {
      return this.internalState[transactionStep.mainOrd].transactionStepState[
        transactionStep.ordinalId
      ];
    }

    let transactionState: ISignedTransactionState;

    if (transactionStep.signer.method === ESignerMethod.local_key) {
      try {
        transactionState = await this.signLocalKeyTransaction(transactionStep, currentNonce);
      } catch (e) {
        this.updateTransactionExecutionState(transactionStep.mainOrd, (draft) => {
          draft.currentTransactionStatus = ETransactionExecutionStatus.failed;
          draft.transactions[transactionStep.stepIndex].status = {
            status: ETransactionExecutionStatus.failed,
            error: meteor_error_utils.meteorOrUnknownError(e),
          };
        });

        throw meteor_error_utils.meteorOrUnknownError(e);
      }
    } else {
      transactionState = await this.signLedgerTransaction(transactionStep, currentNonce);
    }

    this.updateTransactionExecutionState(transactionStep.mainOrd, (draft) => {
      draft.transactions[transactionStep.stepIndex].status = {
        status: ETransactionExecutionStatus.signed,
      };
    });

    this.internalState[transactionStep.mainOrd].transactionStepState[transactionStep.ordinalId] =
      transactionState;

    return transactionState;
  }

  private async signLocalKeyTransaction(
    transactionExecution: ITransactionStep,
    currentNonce: string,
  ): Promise<ISignedTransactionState> {
    const { transaction, asDelegated, signer: localKeySigner } = transactionExecution;

    const signer = localKeySigner as ILocalKeySigner;
    let signedDelegateTransaction: SignedDelegate | undefined;

    transaction.nonce = BigInt(currentNonce);

    const privateKeyBytes = encoding_base58.decode(signer.privateKey.split(":")[1]);

    if (asDelegated) {
      const delegateResponse = await this.internalSignDelegateTransaction({
        transaction,
        sign: async (message: Uint8Array): Promise<Uint8Array> => {
          const hash = Buffer.from(sha256.array(message));
          return nacl.sign.detached(hash, privateKeyBytes);
        },
      });

      signedDelegateTransaction = delegateResponse.signedDelegateAction;
    }

    // if (asDelegated) {
    //   transaction.nonce = transaction.nonce.add(BigInt(1));
    // }

    // the "message" is the encoded transaction according to the NEAR protocol
    const message = encodeTransaction(transaction);

    // the "hash" is the sha256 hash of the encoded transaction
    // (becomes the transaction hash, which can be referenced in Explorer)
    const hash = Buffer.from(sha256.array(message));

    // the "hash" needs to be signed with the private key
    const signatureBytes = nacl.sign.detached(hash, privateKeyBytes);

    const signedTransactionRegular = new SignedTransaction({
      transaction,
      signature: new Signature({
        keyType: transaction.publicKey.keyType,
        data: signatureBytes,
      }),
    });

    return {
      signedRegular: signedTransactionRegular,
      signedDelegate: signedDelegateTransaction,
    };
  }

  private updateStateForLedgerError(e: unknown, transactionStep: ITransactionStep) {
    const { mainOrd, stepIndex } = transactionStep;

    if (e instanceof MeteorError) {
      const ledgerError = MeteorNearLedgerError.castOrNull(e);

      if (ledgerError != null) {
        this.updateTransactionExecutionState(mainOrd, (draft) => {
          draft.currentTransactionStatus = ETransactionExecutionStatus.awaiting_signer;
          draft.transactions[stepIndex].status = {
            status: ETransactionExecutionStatus.awaiting_signer,
          };

          if (ledgerError.hasId(EErr_NearLedger.ledger_user_rejected_action)) {
            draft.ledgerInfo.status = ESignerExecutor_LedgerStatus.ledger_rejected_action;
            draft.currentTransactionStatus = ETransactionExecutionStatus.failed;
            draft.transactions[stepIndex].status = {
              status: ETransactionExecutionStatus.failed,
              error: ledgerError,
            };
            return;
          }

          if (
            ledgerError.hasOneOfIds([
              EErr_NearLedger.ledger_device_browser_refresh_needed,
              EErr_NearLedger.ledger_device_unknown_error,
              EErr_NearLedger.ledger_transaction_data_too_large,
              EErr_NearLedger.ledger_unknown_transport_error,
              EErr_NearLedger.ledger_unknown_transport_status_error,
            ])
          ) {
            draft.ledgerInfo.status = ESignerExecutor_LedgerStatus.ledger_error;
            draft.currentTransactionStatus = ETransactionExecutionStatus.failed;
            draft.transactions[stepIndex].status = {
              status: ETransactionExecutionStatus.failed,
              error: ledgerError,
            };
            return;
          }

          draft.ledgerInfo.status = ESignerExecutor_LedgerStatus.ledger_bad_connection_status;
        });
      } else {
        this.updateTransactionExecutionState(mainOrd, (draft) => {
          draft.currentTransactionStatus = ETransactionExecutionStatus.failed;
          draft.transactions[stepIndex].status = {
            status: ETransactionExecutionStatus.failed,
            error: meteor_error_utils.meteorOrUnknownError(e),
          };
        });
      }
    }
  }

  private async signLedgerTransaction(
    transactionStep: ITransactionStep,
    currentNonce: string,
  ): Promise<ISignedTransactionState> {
    const { isTest } = this.getTransactionsState();
    const { transaction, asDelegated, signer: ledgerSigner, stepIndex, mainOrd } = transactionStep;

    const signer = ledgerSigner as ILedgerSigner;

    this.updateTransactionExecutionState(mainOrd, (draft) => {
      draft.currentTransactionStatus = ETransactionExecutionStatus.awaiting_signer;
      draft.transactions[stepIndex].status = {
        status: ETransactionExecutionStatus.awaiting_signer,
      };
    });

    transaction.nonce = BigInt(currentNonce);
    const message = encodeTransaction(transaction);

    try {
      if (asDelegated) {
        console.warn("Delegated transactions not supported yet on Ledger");
      }

      const signatureBytes = isTest
        ? await TestLedgerClient.get(mainOrd).signTransactionBuffer(
            Buffer.from(message),
            signer.path,
          )
        : await getNearLedgerClient().signTransactionBuffer(Buffer.from(message), signer.path);

      const signedTransactionRegular = new SignedTransaction({
        transaction,
        signature: new Signature({
          keyType: transaction.publicKey.keyType,
          data: signatureBytes,
        }),
      });

      return { signedRegular: signedTransactionRegular };
    } catch (e) {
      console.log("Signing failed on ledger device");
      this.updateStateForLedgerError(e, transactionStep);
      throw meteor_error_utils.meteorOrUnknownError(e);
    }
  }

  private async executeTransaction(
    transactionStep: ITransactionStep,
    {
      typeToExecute = "regular",
      failOnDelegateError = false,
    }: {
      typeToExecute?: "regular" | "delegate";
      failOnDelegateError?: boolean;
    } = {},
  ): Promise<void> {
    const { mainOrd, stepIndex, transaction } = transactionStep;
    const isDelegated = typeToExecute === "delegate";

    if (!this.isOrdinalCurrentAndInGoodState(transactionStep.mainOrd)) {
      return;
    }

    const { isTest } = this.getTransactionsState(transactionStep.mainOrd);

    const { signedRegular, signedDelegate } =
      this.internalState[transactionStep.mainOrd].transactionStepState[transactionStep.ordinalId] ??
      {};

    if (
      (typeToExecute === "regular" && signedRegular == null) ||
      (typeToExecute === "delegate" && signedDelegate == null)
    ) {
      throw MeteorError.fromId(EErrorId_AccountSignerExecutor.publishing_transaction_not_signed);
    }

    this.updateTransactionExecutionState(mainOrd, (draft) => {
      draft.currentTransactionStatus = ETransactionExecutionStatus.publishing;
      draft.transactions[stepIndex].status = {
        status: ETransactionExecutionStatus.publishing,
      };
    });

    let finalExecutionOutcome: FinalExecutionOutcome;

    if (isTest) {
      await AsyncUtils.waitMillis(Math.round(Math.random() * 1500) + 300);
      finalExecutionOutcome = {
        ...TestLedgerClient.get(mainOrd).finalExecutionOutcome(),
        transaction,
      };
    } else {
      try {
        if (typeToExecute === "regular") {
          // finalExecutionOutcome = await getNearApi(
          //   this.networkId,
          // ).nativeApi.connection.provider.sendTransaction(signedRegular!);
          finalExecutionOutcome = await getNearRpcClientV2(
            this.networkId,
          ).customBroadcastTxAsyncWaitAllReceipts({
            signed_transaction: signedRegular!,
            sender_account_id: this.accountId,
            signed_transaction_base64: Buffer.from(signedRegular!.encode()).toString("base64"),
            transaction,
          });
        } else {
          const relayer = Relayer.get(this.networkId);

          finalExecutionOutcome = await relayer.relayTransaction({
            delegated: signedDelegate!,
            regular: signedRegular!,
          });
        }
        /*finalExecutionOutcome = await getNearRpcClientV2(
          this.networkId,
        ).customBroadcastTxAsyncWaitAllReceipts({
          sender_account_id: this.accountId,
          signed_transaction_base64: signedTransactionBase64,
        });*/
      } catch (e) {
        let error: MeteorError;

        if (e instanceof Error) {
          error = MeteorError.fromId(
            EErrorId_AccountSignerExecutor.publishing_transaction_failed_near_error,
            e,
          ).withMessage(e.message);
        } else {
          error = meteor_error_utils.meteorOrUnknownError(e);
        }

        this.updateTransactionExecutionState(mainOrd, (draft) => {
          draft.transactions[stepIndex].status = {
            status: ETransactionExecutionStatus.failed,
            error,
          };
          draft.currentTransactionStatus = ETransactionExecutionStatus.failed;
        });

        throw error;
      }
    }

    console.log("Final execution outcome", finalExecutionOutcome);

    if (Object.keys(finalExecutionOutcome.status).includes("SuccessValue")) {
      const bad = finalExecutionOutcome.receipts_outcome.find((o) =>
        Object.keys(o.outcome.status).includes("Failure"),
      )?.outcome as IReceiptExecutionOutcome_Failure | undefined;
      // fail receipt example
      // const bad = JSON.parse('{"executor_id":"v2.ref-finance.near","gas_burnt":4518379472501,"logs":[],"metadata":{"gas_profile":[{"cost":"BASE","cost_category":"WASM_HOST_COST","gas_used":"12708869328"},{"cost":"CONTRACT_LOADING_BASE","cost_category":"WASM_HOST_COST","gas_used":"35445963"},{"cost":"CONTRACT_LOADING_BYTES","cost_category":"WASM_HOST_COST","gas_used":"913812843385"},{"cost":"READ_CACHED_TRIE_NODE","cost_category":"WASM_HOST_COST","gas_used":"116280000000"},{"cost":"READ_MEMORY_BASE","cost_category":"WASM_HOST_COST","gas_used":"54807127200"},{"cost":"READ_MEMORY_BYTE","cost_category":"WASM_HOST_COST","gas_used":"2029911822"},{"cost":"READ_REGISTER_BASE","cost_category":"WASM_HOST_COST","gas_used":"27688817046"},{"cost":"READ_REGISTER_BYTE","cost_category":"WASM_HOST_COST","gas_used":"190914594"},{"cost":"STORAGE_HAS_KEY_BASE","cost_category":"WASM_HOST_COST","gas_used":"108079793250"},{"cost":"STORAGE_HAS_KEY_BYTE","cost_category":"WASM_HOST_COST","gas_used":"3017502810"},{"cost":"STORAGE_READ_BASE","cost_category":"WASM_HOST_COST","gas_used":"563568457490"},{"cost":"STORAGE_READ_KEY_BYTE","cost_category":"WASM_HOST_COST","gas_used":"6716699661"},{"cost":"STORAGE_READ_VALUE_BYTE","cost_category":"WASM_HOST_COST","gas_used":"8854164312"},{"cost":"STORAGE_WRITE_BASE","cost_category":"WASM_HOST_COST","gas_used":"256786944000"},{"cost":"STORAGE_WRITE_EVICTED_BYTE","cost_category":"WASM_HOST_COST","gas_used":"513876912"},{"cost":"STORAGE_WRITE_KEY_BYTE","cost_category":"WASM_HOST_COST","gas_used":"5497663626"},{"cost":"STORAGE_WRITE_VALUE_BYTE","cost_category":"WASM_HOST_COST","gas_used":"2047223574"},{"cost":"UTF8_DECODING_BASE","cost_category":"WASM_HOST_COST","gas_used":"3111779061"},{"cost":"UTF8_DECODING_BYTE","cost_category":"WASM_HOST_COST","gas_used":"21868535925"},{"cost":"WASM_INSTRUCTION","cost_category":"WASM_HOST_COST","gas_used":"1444147405536"},{"cost":"WRITE_MEMORY_BASE","cost_category":"WASM_HOST_COST","gas_used":"33645538332"},{"cost":"WRITE_MEMORY_BYTE","cost_category":"WASM_HOST_COST","gas_used":"5319526716"},{"cost":"WRITE_REGISTER_BASE","cost_category":"WASM_HOST_COST","gas_used":"31520747346"},{"cost":"WRITE_REGISTER_BYTE","cost_category":"WASM_HOST_COST","gas_used":"7363629468"}],"version":3},"receipt_ids":["7VGTXrZNgS41c18Hco4HBqgMGJnmX8s1Ww5iZVh1SdhC"],"status":{"Failure":{"ActionError":{"index":0,"kind":{"FunctionCallError":{"ExecutionError":"Smart contract panicked: panicked at \'E68: slippage error\', ref-exchange/src/degen_swap/mod.rs:582:9"}}}}},"tokens_burnt":"451837947250100000000"}')

      console.log("Bad receipt", bad);

      if (bad) {
        // One of the receipts had an error but the transaction passed (usually with delegated transactions)
        const error = MeteorError.fromId(
          EErrorId_AccountSignerExecutor.publishing_transaction_failed_receipt_execution_outcome,
          {
            receiptOutcomeFailure: bad,
            finalExecutionOutcome,
            mergedOutcome: {
              ...finalExecutionOutcome,
              ...bad,
            },
          },
        );

        // If we are delegated, we will try the regular transaction next, so don't fail now
        // Else, we fail now on regular transactions
        if (!isDelegated || failOnDelegateError) {
          this.updateTransactionExecutionState(mainOrd, (draft) => {
            draft.transactions[stepIndex].status = {
              status: ETransactionExecutionStatus.failed,
              finalExecutionOutcome,
              hash: finalExecutionOutcome.transaction.hash,
              error,
            };

            draft.currentTransactionStatus = ETransactionExecutionStatus.failed;
          });
        }

        throw error;
      } else {
        this.updateTransactionExecutionState(mainOrd, (draft) => {
          draft.transactions[stepIndex].status = {
            status: ETransactionExecutionStatus.success,
            finalExecutionOutcome,
            hash: finalExecutionOutcome.transaction.hash,
          };
        });
      }
    } else {
      const error = MeteorError.fromId(
        EErrorId_AccountSignerExecutor.publishing_transaction_failed_final_execution_outcome,
        finalExecutionOutcome as IFinalExecutionOutcome_Failure,
      );

      // If we are delegated, we will try the regular transaction next, so don't fail now
      // Else, we fail now on regular transactions
      if (!isDelegated || failOnDelegateError) {
        this.updateTransactionExecutionState(mainOrd, (draft) => {
          draft.transactions[stepIndex].status = {
            status: ETransactionExecutionStatus.failed,
            finalExecutionOutcome,
            hash: finalExecutionOutcome.transaction.hash,
            error,
          };
          draft.currentTransactionStatus = ETransactionExecutionStatus.failed;
        });
      }

      throw error;
    }

    return;
  }
}
