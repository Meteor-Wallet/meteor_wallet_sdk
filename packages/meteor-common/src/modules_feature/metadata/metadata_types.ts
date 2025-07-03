export interface IGetBlacklistedTokens_Result {
  message: string;
  status: number;
  data: {
    contract_id: string;
  }[];
}

export interface IOGetBlacklistedTokens_Input {}

export type IOGetBlacklistedTokens_Output = string[];

export interface IGetWhitelistedRedirect_Result {
  message: string;
  status: number;
  data: {
    hostname: string;
  }[];
}

export interface IOGetWhitelistedRedirect_Input {}

export type IOGetWhitelistedRedirect_Output = string[];
