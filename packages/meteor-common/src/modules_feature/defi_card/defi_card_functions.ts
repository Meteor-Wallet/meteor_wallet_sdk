import { MeteorBackendV2Client } from "../../modules_external/meteor_v2_api/MeteorBackendV2Client";
import { getFungibleTokensService } from "../../modules_external/near/services/near_fungible_tokens_service";
import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";
import { IWithAccountIdAndNetwork } from "../../modules_external/near/types/near_input_helper_types";
import { hmutils_signPayload } from "../harvest_moon/harvest_moon_utils";
import {
  EMeteorCardError,
  EMeteorCardSignUpRequestStatus,
  USDC_TOKEN_ID,
  USDC_TOKEN_ID_TESTNET,
  USDC_TRANSFER_AMOUNT,
} from "./defi_card_constants";
import {
  IOGetSignUpRequest_Input,
  IOGetSignUpRequest_Output,
  IOSignUpPayment_Input,
  IOSignUpPayment_Output,
  zSignUpPayment,
} from "./defi_card_types";

export const defi_card_functions = {
  getSignUpRequest,
  signUpPayment,
  updateSignUpData,
  cancelApplication,
};

async function getSignUpRequest(
  payload: IOGetSignUpRequest_Input & IWithAccountIdAndNetwork,
): Promise<IOGetSignUpRequest_Output> {
  const walletSignedPayload = await hmutils_signPayload(payload);
  return MeteorBackendV2Client.getInstance().getSignUpRequest({
    walletSignedPayload,
    programId: payload.programId,
  });
}

async function signUpPayment(
  payload: IOSignUpPayment_Input & IWithAccountIdAndNetwork,
): Promise<IOSignUpPayment_Output> {
  /**
    step 0 check are there near transaction send to the account
      - on transaction exist > step 3
    step 1 check are account have enough USDC balance
    step 2 send USDC balance to account
      - on success
        step 3 on success send transaction hash to backend
      - on error back to signup page
   */
  zSignUpPayment.parse(payload);
  const isMainnet = payload.network === ENearNetwork.mainnet;

  const ftService = await getFungibleTokensService(payload.network);

  const rpcTransferPayload = isMainnet
    ? {
        accountId: payload.accountId,
        receiverId: "meteor-defi-card-deposit.near",
        contractId: USDC_TOKEN_ID,
        amount: USDC_TRANSFER_AMOUNT,
      }
    : {
        accountId: payload.accountId,
        receiverId: "meteor-defi-card-deposit.testnet",
        contractId: USDC_TOKEN_ID_TESTNET,
        amount: USDC_TRANSFER_AMOUNT,
      };

  const balance = await ftService.getBalanceOf({
    contractId: rpcTransferPayload.contractId,
    accountId: rpcTransferPayload.accountId,
  });
  if (Number(balance) < Number(USDC_TRANSFER_AMOUNT)) {
    return {
      ok: false,
      errorStatus: EMeteorCardError.not_enough_usdc_balance,
    };
  }

  const walletSignedPayload = await hmutils_signPayload(payload);

  const getSignUpRequestResponse = await MeteorBackendV2Client.getInstance().getSignUpRequest({
    programId: "meteor_defi_card",
    walletSignedPayload,
  });

  if (
    getSignUpRequestResponse &&
    getSignUpRequestResponse.sign_up_request_status !== EMeteorCardSignUpRequestStatus.opted_out
  ) {
    return {
      ok: false,
      errorStatus: EMeteorCardError.sign_up_request_status_not_ready,
      signUpRequestStatus: getSignUpRequestResponse.sign_up_request_status,
    };
  }

  const ftTokenResponse = await ftService.transfer(rpcTransferPayload);

  const signupMeteorDefiCardResponse =
    await MeteorBackendV2Client.getInstance().signupMeteorDefiCard({
      walletSignedPayload,
      signUpData: {
        ...payload.signUpData,
        deposit_trx_hash: ftTokenResponse.transaction_outcome.id,
      },
    });

  if (!signupMeteorDefiCardResponse) {
    return {
      ok: false,
    };
  }

  return {
    ok: true,
  };
}

async function updateSignUpData(
  payload: {
    updatedData: {
      email: string;
      country_code: string;
    };
  } & IWithAccountIdAndNetwork,
) {
  const walletSignedPayload = await hmutils_signPayload(payload);
  return MeteorBackendV2Client.getInstance().updateSignUpData({
    walletSignedPayload,
    updatedData: payload.updatedData,
  });
}

async function cancelApplication(payload: IWithAccountIdAndNetwork) {
  const walletSignedPayload = await hmutils_signPayload(payload);
  const getSignUpRequestResponse = await MeteorBackendV2Client.getInstance().getSignUpRequest({
    programId: "meteor_defi_card",
    walletSignedPayload,
  });

  if (
    getSignUpRequestResponse &&
    getSignUpRequestResponse.sign_up_request_status ===
      EMeteorCardSignUpRequestStatus.registered_request
  ) {
    return {
      ok: true,
      data: await MeteorBackendV2Client.getInstance().cancelMeteorCardApplication({
        walletSignedPayload,
      }),
    };
  }
  return {
    ok: false,
    errorStatus: EMeteorCardError.cancel_request_status_not_ready,
    signUpRequestStatus: getSignUpRequestResponse.sign_up_request_status,
  };
}
