import { ENearNetwork } from "@meteorwallet/meteor-near-sdk/dist/packages/common/core/modules/blockchains/near/core/types/near_basic_types";
import { utils } from "near-api-js";

const parseNearAmount = utils.format.parseNearAmount;

export const FARMING_VALIDATOR_PREFIXES_MAINNET = [".pool.near"];
export const FARMING_VALIDATOR_PREFIXES_TESTNET = [
  ".factory01.littlefarm.testnet",
  ".factory.colorpalette.testnet",
];

export const NEAR_TOKEN_ID = "near";
export const TOKEN_ID_WNEAR = "wrap.near";
export const TOKEN_ID_STNEAR = "meta-pool.near";

export const FARMING_CLAIM_GAS: string = parseNearAmount("0.00000000015")!;
export const FARMING_CLAIM_YOCTO: string = "1";
export const METEOR_VALIDATOR_BY_NETWORK = {
  [ENearNetwork.mainnet]: "meteor.poolv1.near",
  [ENearNetwork.testnet]: "aurora.pool.f863973.m0",
};
export const STAKING_AUTO_CLAIM_TIME = "12 AM UTC";
