import {
  BLACKDRAGON_TOKEN_ICON,
  JLU_TOKEN_ICON,
  WNEAR_TOKEN_ICON,
} from "./fungible_tokens_constants";
// NOTES:
// Use this function to ove
import { IMeteorFungibleTokenWithPrice } from "./fungible_tokens_types";

export const tokenDataOverrideMap: {
  [address: string]: Partial<
    IMeteorFungibleTokenWithPrice & {
      isTransferDisabled?: boolean;
      isBridge?: boolean;
      // DS Stands for DexScrener
      needDSPrice?: boolean;
      isStable?: boolean;
    }
  >;
} = {
  /***************************************/
  // 	Mainnet
  /***************************************/
  "wrap.near": {
    icon: WNEAR_TOKEN_ICON,
  },
  "dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near": {
    symbol: "USDT.e",
    isBridge: true,
    isStable: true,
  },
  "a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near": {
    symbol: "USDC.e",
    isBridge: true,
    isStable: true,
  },
  "usdt.tether-token.near": {
    symbol: "USDT",
    isStable: true,
  },
  "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1": {
    symbol: "USDC",
    isStable: true,
  },
  "853d955acef822db058eb8505911ed77f175b99e.factory.bridge.near": {
    isStable: true,
  },
  "blackdragon.tkn.near": {
    icon: BLACKDRAGON_TOKEN_ICON,
  },
  "jlu-1018.meme-cooking.near": {
    icon: JLU_TOKEN_ICON,
  },
  "aa-harvest-moon.near": {
    isTransferDisabled: true,
  },
  "harvest-moon.near": {
    isTransferDisabled: true,
  },
  "dev.harvest-moon.near": {
    isTransferDisabled: true,
  },
  "slush.tkn.near": {
    needDSPrice: true,
  },
  "intel.tkn.near": {
    needDSPrice: true,
  },
  "touched.tkn.near": {
    needDSPrice: true,
  },
  "nkok.tkn.near": {
    needDSPrice: true,
  },
  "wojak.tkn.near": {
    needDSPrice: true,
  },
  "babyblackdragon.tkn.near": {
    needDSPrice: true,
  },
  "chill-129.meme-cooking.near": {
    needDSPrice: true,
  },
  "nochill-176.meme-cooking.near": {
    needDSPrice: true,
  },
  "pre.meteor-token.near": {
    price_in_usd: "0",
  },

  /***************************************/
  // 	Testnet
  /***************************************/
  "usdcc.fakes.testnet": {
    symbol: "Native USDC",
  },
  "usdtt.fakes.testnet": {
    symbol: "Native USDT",
  },
  "usdt.fakes.testnet": {
    symbol: "Bridged USDT",
  },
  "usdc.fakes.testnet": {
    symbol: "Bridged USDC",
  },
};
