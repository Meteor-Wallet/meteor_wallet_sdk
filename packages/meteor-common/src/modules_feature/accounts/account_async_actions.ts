import { AppStore } from "../../modules_app_core/state/app_store/AppStore";
import { EEnrollmentDataStatusExtras } from "../../modules_app_core/state/app_store/AppStore_types";
import { createAsyncActionWithErrors } from "../../modules_utility/api_utilities/async_action_utils";
import { EFeatureEnrollmentRecord_ConsentStatus } from "../missions/feature_enrollment_records/feature_enrollment_records.enum";
import { account_async_functions } from "./account_async_functions";

export const account_async_actions = {
  addFunctionCallAccessKey: createAsyncActionWithErrors(
    account_async_functions.addFunctionCallAccessKey,
  ),
  revokeFunctionCallAccessKey: createAsyncActionWithErrors(
    account_async_functions.revokeFunctionCallAccessKey,
  ),
  getAccessKey: createAsyncActionWithErrors(account_async_functions.getAccessKey),
  getAccessKeys: createAsyncActionWithErrors(account_async_functions.getAccessKeys),
  addFullAccessKeyToAccount: createAsyncActionWithErrors(
    account_async_functions.addFullAccessKeyToAccount,
  ),
  hydrateSignAndSendTransactionsWithAccount: createAsyncActionWithErrors(
    account_async_functions.hydrateSignAndSendTransactionsWithAccount,
  ),
  getAccountState: createAsyncActionWithErrors(account_async_functions.getAccountState),
  checkAndDepositStorage: createAsyncActionWithErrors(
    account_async_functions.checkAndDepositStorage,
  ),
  getAvailableNearBalance: createAsyncActionWithErrors(
    account_async_functions.getAvailableNearBalance,
  ),
  findAccountsWithPublicKey: createAsyncActionWithErrors(
    account_async_functions.findAccountsWithPublicKey,
  ),
  acceptEnrollmentStatus: createAsyncActionWithErrors(
    account_async_functions.acceptEnrollmentStatus,
    {
      postActionHook: (action) => {
        if (!action.result.error) {
          AppStore.update((s) => {
            s.meteorFeatureEnrollment[action.args.account.id] = {
              status: EFeatureEnrollmentRecord_ConsentStatus.accepted,
              publicKey: action.args.enrollmentPublicKey!,
            };
          });
        } else {
          AppStore.update((s) => {
            s.meteorFeatureEnrollment[action.args.account.id] = {
              status: EEnrollmentDataStatusExtras.failed_acceptance,
              publicKey: action.args.enrollmentPublicKey!,
              errorMessage: `${action.result.message}`,
            };
          });
        }
      },
    },
  ),
  rejectEnrollmentStatus: createAsyncActionWithErrors(
    account_async_functions.rejectEnrollmentStatus,
    {
      postActionHook: (action) => {
        if (!action.result.error) {
          AppStore.update((s) => {
            s.meteorFeatureEnrollment[action.args.account.id] = {
              status: EFeatureEnrollmentRecord_ConsentStatus.denied,
              publicKey: action.args.enrollmentPublicKey!,
            };
          });
        } else {
          AppStore.update((s) => {
            s.meteorFeatureEnrollment[action.args.account.id] = {
              status: EEnrollmentDataStatusExtras.failed_rejection,
              publicKey: action.args.enrollmentPublicKey!,
              errorMessage: `${action.result.message}`,
            };
          });
        }
      },
    },
  ),
};
