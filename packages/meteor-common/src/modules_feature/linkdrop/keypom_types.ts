import { EExternalActionType, IExternalAction_Base } from "../dapp_connect/types_dappConnect";

export interface IKeypomAction_Claim extends IExternalAction_Base {
  actionType: EExternalActionType.keypom_claim;
  inputs: TKeypomAction_Claim_Data;
}

export type TKeypomAction_Claim_Data = {
  contractId: string;
  privKey: string;
  redirectUrl?: string;
};

export enum DROP_TYPE {
  TOKEN = "TOKEN",
  TICKET = "TICKET",
  TRIAL = "TRIAL",
  NFT = "NFT",
  SIMPLE = "SIMPLE",
}
