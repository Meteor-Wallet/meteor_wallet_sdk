import { ENearNetwork } from "@prisma/client";

export const attachedGas = "300000000000000";

export const networkConfigMeteorRewardsContractId: {
  [network in ENearNetwork]: string;
} = {
  // TOUPDATE:production
  mainnet: "meteor-rewards.near",
  testnet: "dev-1698546609502-56719754268650",
  betanet: "dev-1698546609502-56719754268650",
  localnet: "dev-1698546609502-56719754268650",
};
