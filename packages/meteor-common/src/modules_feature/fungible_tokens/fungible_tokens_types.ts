import Big from "big.js";
import {
  IWithAccountIdAndNetwork,
  IWithValidatorId,
} from "../../modules_external/near/types/near_input_helper_types";
import { INearFungibleTokenMetadata } from "../../modules_external/near/types/standards/fungible_token_standard_types";

/*******************************/
//
// 						TYPE
//
/*******************************/

export interface IRefSwapMsgAction {
  amount_in: string;
  min_amount_out: string;
  pool_id: number;
  token_in: string;
  token_out: string;
}

export type TTokenPrice = {
  decimal: number;
  price: string;
  symbol: string;
};

export type TTokenPriceWithAddress = {
  decimal: number;
  price: string;
  symbol: string;
  address: string;
};

export type TTokenPriceList = {
  [tokenId: string]: TTokenPrice;
};

export enum MeteorFungibleTokenType {
  bridged = "bridged",
  native = "native",
}

export interface IMeteorFungibleToken {
  address: string;
  symbol: string;
  type: MeteorFungibleTokenType;
}

export interface IMeteorFungibleTokenMetadata extends INearFungibleTokenMetadata {
  // Add in contract ID
  id: string;
  // In Meteor, we always have an icon defined (has fallback)
  icon: string;
}

export interface IMeteorFungibleTokenWithPrice extends IMeteorFungibleTokenMetadata {
  price_in_usd: string;
}

export interface IMeteorFungibleTokenWithPriceAndAmount extends IMeteorFungibleTokenWithPrice {
  amountFormatted: string;
  amountRaw?: Big;
}

export interface IMeteorFungibleTokenBalance extends IMeteorFungibleTokenMetadata {
  balance: string;
  price_in_usd?: string;
}

/*******************************/
//
// 				API IO Type
//
/*******************************/

export interface IClaimFarmRewards_Input extends IWithValidatorId, IWithAccountIdAndNetwork {
  tokenIds: string[];
}

export type IGetAccountFtsContract_Output = {
  regular: string[];
  blacklisted: string[];
};
