import { z } from "zod";
import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";
import { EMeteorCardError, EMeteorCardSignUpRequestStatus } from "./defi_card_constants";

export interface IOGetSignUpRequest_Input {
  programId: string;
}

export type IOGetSignUpRequest_Output = {
  blockchain_id: "near";
  created_at: string;
  id: number;
  network_id: ENearNetwork;
  program_id: "meteor_defi_card";
  sign_up_request_status: EMeteorCardSignUpRequestStatus;
  time_opted_out: null;
  time_registered_request: null;
  time_started_opt_out: null;
  time_started_request: string;
  request_failed_error: string;
  updated_at: string;
  wallet_id: string;
  wallet_program_sign_up_data: {
    country_code: string;
    deposit_trx_hashes: string[];
    email: string;
    estimated_usage: "from_250_to_1000";
    estimated_usage_min_usd: number;
    refund_trx_hashes: string[];
    version: string;
    wallet_program_id: "meteor_defi_card";
  } | null;
};

export interface IOSignUpPayment_Input {
  signUpData: {
    country_code: string;
    email: string;
    estimated_usage: string;
  };
}

export type IOSignUpPayment_Output =
  | {
      ok: true;
    }
  | {
      ok: false;
      errorStatus?: EMeteorCardError;
      signUpRequestStatus?: EMeteorCardSignUpRequestStatus;
    };

export const zSignUpPayment = z.object({
  signUpData: z.object({
    email: z.string().email(),
    country_code: z.string(),
    estimated_usage: z.string(),
  }),
});
