// NOTE: this file is used to abstract out codes in other files so they can be a lot more readable.

import { EErrorId_Near_AccessKey } from "@meteorwallet/core-sdk/errors/ids/MeteorErrorIds.near";
import { MeteorError } from "@meteorwallet/errors";
import { PublicKey } from "@near-js/crypto";
import { actionCreators } from "@near-js/transactions";
import { MeteorBackendV2Client } from "../../modules_external/meteor_v2_api/MeteorBackendV2Client";
import { INearAccessKeyPermission_FunctionCall } from "../../modules_external/near/types/near_blockchain_data_types";
import { IWithAccountIdAndNetwork } from "../../modules_external/near/types/near_input_helper_types";
import { IONearRpc_Query_ViewAccessKey_Output } from "../../modules_external/near/types/near_rpc_types";
import { AsyncUtils } from "../../modules_utility/javascript_helpers/AsyncUtils";
import { account_async_functions } from "../accounts/account_async_functions";
import {
  hmutils_signDelegateAction,
  hmutils_signPayload,
  hmutils_validateAccessKey,
} from "./harvest_moon_utils";

// Not meant to be exported
type THM_AddAccessKey = IWithAccountIdAndNetwork & {
  publicKey: string;
  contractId: string;
};
const addAccessKey_relayed = async ({
  accountId,
  network,
  publicKey,
  contractId,
}: THM_AddAccessKey): Promise<IONearRpc_Query_ViewAccessKey_Output | null> => {
  // Step 1: Prepare the payload
  const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
  const signedDelegateBase64 = await hmutils_signDelegateAction({
    accountId,
    network,
    actions: [
      actionCreators.addKey(
        PublicKey.from(publicKey),
        actionCreators.functionCallAccessKey(contractId, []),
      ),
    ],
  });
  const walletSignedPayload = await hmutils_signPayload({
    accountId,
    network,
  });

  // Step 2: Try to add the access key through relayer
  try {
    await meteorBackendV2Service.addHarvestMoonAccessKey({
      walletSignedPayload,
      signedDelegateBase64,
    });
  } catch (e) {
    if (
      e instanceof MeteorError &&
      e.hasId(EErrorId_Near_AccessKey.near_key_contract_data_invalid)
    ) {
      await account_async_functions.revokeFunctionCallAccessKey({
        accountId,
        network,
        publicKey,
      });
      await AsyncUtils.waitSeconds(0.5);
      await meteorBackendV2Service.addHarvestMoonAccessKey({
        walletSignedPayload,
        signedDelegateBase64,
      });
    } else {
      // rethrow the error
      throw e;
    }
  }
  const key = await account_async_functions.getAccessKey({
    accountId,
    network,
    publicKey,
  });
  const isValid = hmutils_validateAccessKey(key, contractId);
  return isValid ? key : null;
};

const addAccessKey_normal = async ({
  accountId,
  network,
  publicKey,
  contractId,
}: THM_AddAccessKey): Promise<IONearRpc_Query_ViewAccessKey_Output | null> => {
  const key = await account_async_functions.getAccessKey({
    network,
    accountId,
    publicKey,
  });

  // check if key is found
  if (key) {
    let isAccessKeyValid = hmutils_validateAccessKey(key, contractId);

    // check if key is valid
    if (
      !isAccessKeyValid &&
      (key.permission as INearAccessKeyPermission_FunctionCall).FunctionCall &&
      (key.permission as INearAccessKeyPermission_FunctionCall).FunctionCall.receiver_id !==
        contractId
    ) {
      console.log(`Access key is not valid. Revoking and trying again. Curr`);

      await account_async_functions.revokeFunctionCallAccessKey({
        accountId,
        network,
        publicKey,
      });

      const newKey = await account_async_functions.addFunctionCallAccessKey({
        accountId,
        network,
        publicKey,
        contractId,
        methods: [],
      });

      isAccessKeyValid = hmutils_validateAccessKey(newKey, contractId);

      return isAccessKeyValid ? newKey : null;
    } else {
      // key is valid so return it
      return key;
    }
  } else {
    //key not found so add it
    const key = await account_async_functions.addFunctionCallAccessKey({
      accountId,
      network,
      publicKey,
      contractId,
      methods: [],
    });

    const isAccessKeyValid = hmutils_validateAccessKey(key, contractId);

    return isAccessKeyValid ? key : null;
  }
};

export const harvest_moon_internal_impl = {
  addAccessKey_relayed: addAccessKey_relayed,
  addAccessKey_normal: addAccessKey_normal,
};
