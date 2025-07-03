import { Transaction } from "@near-wallet-selector/core";
import type { SwapStep } from "@perk.money/perk-swap-core";
import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";
import {
  IMeteorFungibleTokenWithPrice,
  IMeteorFungibleTokenWithPriceAndAmount,
} from "../fungible_tokens/fungible_tokens_types";

/*******************************/
//
// 						ENUM
//
/*******************************/
export enum ESwapView {
  inputs = 0,
  confirmation = 1,
  execute = 2,
  result = 3,
}

export enum ESwapMode {
  exact_in = "exact_in",
  exact_out = "exact_out",
}

/*******************************/
//
// 						TYPE
//
/*******************************/
export interface RouteInfo {
  steps: SwapStep[];
  simpleSteps: StepInfo[];
  inputMint: string;
  outputMint: string;
  minAmountOut: string;
  amountOut: string;
  amountIn: string;
  priceImpact: number;
  notEnoughLiquidity: boolean;
  depositAndNetworkFee: string;
  networkFee: string;
  swapFee: string;
  swapMode: "exact_in" | "exact_out";
  platformFee: {
    amount: string;
    token: string;
    pct: number;
  };
}

export interface StepInfo {
  //amm: Amm;
  provider: string;
  inputMint: string;
  outputMint: string;
  amountIn: string;
  minAmountOut: string;
  amountOut: string;
  feeAmount: string;
  feeMint: string;
  priceImpact: number;
  notEnoughLiquidity: boolean;
}

/*******************************/
//
// 				IO Type
//
/*******************************/
export interface IOGetRoutesForAccount_Input {
  network: ENearNetwork;
  accountId: string;
  inputMint: string;
  outputMint: string;
  amount: string;
  slippage: number;
  swapMode: ESwapMode;
  tokenPrices: IMeteorFungibleTokenWithPrice[];
}

export interface IOGetRoutesForAccount_Output {
  routes: RouteInfo[];
  //cached: boolean;
}

export interface IOBuildSwapForAccount_Input {
  network: ENearNetwork;
  accountId: string;
  route: RouteInfo;
  needUnwrapNear: boolean;
}

export interface IOBuildSwapForAccount_Output {
  transactions: Transaction[];
}

export interface IOGetSwapToken_Input {
  network: ENearNetwork;
  search?: string;
}

export interface IOMint {
  symbol: string;
  address: string;
  decimals: number;
  icon: string;
}
export interface IOSwapForm_Input {
  inputMint?: IMeteorFungibleTokenWithPriceAndAmount;
  outputMint?: IMeteorFungibleTokenWithPriceAndAmount;
}
