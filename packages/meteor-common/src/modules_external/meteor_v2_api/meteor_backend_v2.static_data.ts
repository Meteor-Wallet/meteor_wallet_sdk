import { ENearNetwork } from "@meteorwallet/meteor-near-sdk/dist/packages/common/core/modules/blockchains/near/core/types/near_basic_types";

export const meteor_backend_v2_verifier = {
  [ENearNetwork.mainnet]: "meteor-account-verifier.near",
  [ENearNetwork.testnet]: "meteor-account-verifier.testnet",
};
