import { ENearNetwork } from "../../../modules_external/near/types/near_basic_types";
import { EAccountIdentifierType } from "../../../modules_feature/accounts/account_types";
import { ApiAction } from "../../../modules_utility/api_utilities/endpoints/ApiAction";
import { EMeteorEndpointIds } from "../endpoint_ids";

export interface IEndpoint_VerifyCaptcha_Input {
  captchaToken: string;
  network: ENearNetwork;
  accountIdType: EAccountIdentifierType;
  publicKey: string;
  accountId: string;
}

export interface IEndpoint_VerifyCaptcha_Output {
  success: boolean;
  trxHash?: string;
  failedReason?: "score-lower-than-threshold" | "service-failed" | "account-exists";
}

export const Endpoint_VerifyCaptcha = new ApiAction<
  IEndpoint_VerifyCaptcha_Input,
  IEndpoint_VerifyCaptcha_Output,
  []
>(EMeteorEndpointIds.ms_verify_captcha, []);
