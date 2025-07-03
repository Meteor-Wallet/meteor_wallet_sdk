export enum EMeteorCardError {
  not_enough_usdc_balance = "not_enough_usdc_balance",
  sign_up_request_status_not_ready = "sign_up_request_status_not_ready",
  cancel_request_status_not_ready = "cancel_request_status_not_ready",
}

export enum EMeteorCardEstimateUsage {
  below_250 = "below_250",
  from_250_to_1000 = "from_250_to_1000",
  above_1000 = "above_1000",
}

export enum EMeteorCardSignUpRequestStatus {
  started_request = "started_request",
  opted_out = "opted_out",
  started_opt_out = "started_opt_out",
  registered_request = "registered_request",
}

export const USDC_TOKEN_ID = "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1";
export const USDC_TOKEN_ID_TESTNET = "usdc.fakes.testnet";
export const USDC_TRANSFER_AMOUNT = "5000000";
