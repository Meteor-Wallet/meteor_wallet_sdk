import { KeyPair, KeyPairString } from "@near-js/crypto";
import { FinalExecutionOutcome } from "@near-js/types";
import { GoogleRecaptcha_HttpClient } from "../../../modules_external/google_recaptcha/GoogleRecaptcha_HttpClient";
import { getNearApi } from "../../../modules_external/near/clients/near_api_js/NearApiJsClient";
import { getNearAccountService } from "../../../modules_external/near/services/near_account_service";
import { ENearNetwork } from "../../../modules_external/near/types/near_basic_types";
import { toYoctoNear } from "../../../modules_external/near/utils/near_formatting_utils";
import { EAccountIdentifierType } from "../../../modules_feature/accounts/account_types";
import { TFRSuccessPayload } from "../../../modules_utility/api_utilities/task_function/TaskFunctionResponses";
import { TFRPromise } from "../../../modules_utility/api_utilities/task_function/TaskFunctionTypes";
import { TaskFunctionError } from "../../../modules_utility/api_utilities/task_function/TaskFunctionUtils";
import {
  Endpoint_VerifyCaptcha,
  IEndpoint_VerifyCaptcha_Input,
  IEndpoint_VerifyCaptcha_Output,
} from "./Endpoint_VerifyCaptcha";

const fundingAccounts: {
  [network: string]: {
    accountId: string;
    privKey: string;
  };
} = {
  [ENearNetwork.testnet]: {
    accountId: "rektdegen.testnet",
    privKey:
      "ed25519:2Fr6EV1pnUPw7xfchLEx1eaUycevXFMm1oKwu4yPA4NaoMQVoqEJezWJMawfTod9KTCtZsrNk94Srr1dtfUJbDBf",
  },
  [ENearNetwork.mainnet]: {
    accountId: "meteorbot.near",
    privKey:
      "ed25519:2Eb1Jw7PKzzGj5pnw96Ea3C3zBdVSopsd3MhZRCZe4DLyk7EqdRiYpnBRtQNZecA1r4U8m4wxgG12pXCKBgLbrTN",
  },
};

Endpoint_VerifyCaptcha.implement(
  async ({
    captchaToken,
    network,
    accountIdType,
    publicKey,
    accountId,
  }: IEndpoint_VerifyCaptcha_Input): TFRPromise<IEndpoint_VerifyCaptcha_Output> => {
    const googleClient = GoogleRecaptcha_HttpClient.getInstance();
    const verificationResult = await googleClient.verifyToken({ captchaToken });

    if (!verificationResult.success || !verificationResult.score) {
      console.error(verificationResult);
      return TFRSuccessPayload({
        success: false,
        failedReason: "service-failed",
      });
    }

    if (verificationResult.score < 0.9) {
      console.warn(verificationResult);
      return TFRSuccessPayload({
        success: false,
        failedReason: "score-lower-than-threshold",
      });
    }

    const nearApi = getNearApi(network);
    const fundingAccount = await nearApi.nativeApi.account(fundingAccounts[network].accountId);
    const fundingAccountKeyPair = KeyPair.fromString(
      fundingAccounts[network].privKey as KeyPairString,
    );
    await nearApi.keystore.setKey(network, fundingAccount.accountId, fundingAccountKeyPair);
    const contractId = network === ENearNetwork.mainnet ? "near" : network;

    let trx: FinalExecutionOutcome;

    // Scenario 1: Creating named account
    if (accountIdType === EAccountIdentifierType.NAMED) {
      trx = await fundingAccount.functionCall({
        contractId,
        methodName: "create_account",
        args: {
          new_account_id: accountId,
          new_public_key: publicKey,
        },
        gas: BigInt("300000000000000"),
        // attachedDeposit: BigInt(toYoctoNear(0.006)),
      });

      return TFRSuccessPayload({
        success: true,
        trxHash: trx?.transaction?.hash,
      });
    }
    // Scenario 2: Creating implicit account
    else {
      try {
        const accountState = await getNearAccountService(network).getAccountState({ accountId });

        // Account already exists, we should not fund it
        return TFRSuccessPayload({
          success: false,
          failedReason: "account-exists",
        });
      } catch (e: unknown) {
        if (
          e instanceof TaskFunctionError &&
          e.taskFunctionResponse.endTags.includes("AccountDoesNotExist")
        ) {
          trx = await fundingAccount.sendMoney(accountId, BigInt(toYoctoNear(0.003)));
          return TFRSuccessPayload({
            success: true,
            trxHash: trx?.transaction?.hash,
          });
        } else {
          // Unknown error, account exists
          return TFRSuccessPayload({
            success: false,
            failedReason: "account-exists",
          });
        }
      }
    }
  },
);

export const Endpoint_VerifyCaptcha_Impl = Endpoint_VerifyCaptcha;
