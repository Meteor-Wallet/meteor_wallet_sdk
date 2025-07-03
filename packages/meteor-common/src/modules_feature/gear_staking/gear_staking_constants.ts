import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";

export const gear_staking_constants = {
  [ENearNetwork.testnet]: {
    gearStakingContractId: "dev-1704967343113-11702383130607",
    gearTokenContractId: "dev-1704078337558-58907488372866",
    meteorPreTokenContractId: "dev-1706841846082-67944864785126",
  },
  [ENearNetwork.mainnet]: {
    gearStakingContractId: "gear-staking.enleap.near",
    gearTokenContractId: "gear.enleap.near",
    meteorPreTokenContractId: "pre.meteor-token.near",
  },
};

export enum EGearToken_SmartContractMethods {
  storage_deposit = "storage_deposit",
}
