import { z } from "zod";
import { getNearRpcClient } from "../../modules_external/near/clients/near_rpc/NearRpcClient";
import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";
import { IAccountSignedRequestInputs } from "../../modules_feature/accounts/account_types";
import { account_utils } from "../../modules_feature/accounts/account_utils";
import {
  TFRFailure,
  TFRFailureDefaults,
} from "../../modules_utility/api_utilities/task_function/TaskFunctionResponses";
import { ETaskFunctionEndId } from "../../modules_utility/api_utilities/task_function/TaskFunctionTypes";
import { TaskFunctionError } from "../../modules_utility/api_utilities/task_function/TaskFunctionUtils";
import { EOldMeteorErrorId } from "../../modules_utility/old_errors/old_error_ids";
import { ZodUtils } from "../../modules_utility/validation/ZodUtils";
import { EndpointPlugin_WalletSignedRequest } from "./EndpointPlugin_WalletSignedRequest";

const validateAccountSignInputs = z.object({
  accountId: z.string(),
  network: z.nativeEnum(ENearNetwork),
  inputs: z.any(),
  signed: z.object({
    accountId: z.string(),
    publicKey: z.string(),
    signature: z.string(),
  }),
  nonce: z.array(z.number()),
  receiver: z.string(),
});

EndpointPlugin_WalletSignedRequest.implementContextual(async ({ store }) => {
  const validateCheck = validateAccountSignInputs.safeParse(store.current.signedInputs);

  if (validateCheck.success) {
    await verifyInputs(store.current.signedInputs);
  } else {
    throw new TaskFunctionError(
      TFRFailure(
        ETaskFunctionEndId.DATA_VALIDATION_FAILED,
        ZodUtils.niceErrorMessage(validateCheck.error),
      ),
    );
  }

  async function verifyInputs(inputs: IAccountSignedRequestInputs<any>) {
    if (!account_utils.verifyRequestInputs(inputs)) {
      throw new TaskFunctionError(
        TFRFailureDefaults({
          endId: ETaskFunctionEndId.DATA_VALIDATION_FAILED,
          endTags: [EOldMeteorErrorId.merr_account_signed_request_mismatch],
          endMessage: "Failed to verify request inputs: signature did not match the inputs",
        }),
      );
    }

    const key = await getNearRpcClient(inputs.network).view_access_key({
      public_key: inputs.signed.publicKey,
      account_id: inputs.accountId,
    });

    if (key.permission !== "FullAccess") {
      throw new TaskFunctionError(
        TFRFailureDefaults({
          endId: ETaskFunctionEndId.UNAUTHORIZED,
          endTags: [EOldMeteorErrorId.merr_account_signed_request_not_full_access_key],
          endMessage:
            "Failed to verify request inputs: public key does not exist on given account for inputs",
        }),
      );
    }

    // RUN nonce checks here
  }

  return {
    methods: {},
  };
});

export const EndpointPlugin_WalletSignedRequest_Impl = EndpointPlugin_WalletSignedRequest;
