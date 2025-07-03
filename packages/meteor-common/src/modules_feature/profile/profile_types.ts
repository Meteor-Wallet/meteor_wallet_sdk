import { IWithAccountIdAndNetwork } from "../../modules_external/near/types/near_input_helper_types";

export enum EAccountSocialProfileType {
  LOCAL = "local",
  NEAR_SOCIAL = "near_social",
}

export interface IAccountSocialProfile {
  type: EAccountSocialProfileType;
  name?: string;
  desc?: string;
  telegram?: string;
  twitter?: string;
  pfp?: string;
}

export type TIOGrantPermission_Input = {
  publicKey: string;
  pfp?: string;
} & IWithAccountIdAndNetwork;

export type TIOUpdatePfp_Input = {
  type: string;
  pfp: string;
} & IWithAccountIdAndNetwork;

export type TIOUpdateProfile_Input = IAccountSocialProfile & IWithAccountIdAndNetwork;

export type TIOReadProfile_Input = IWithAccountIdAndNetwork;

export type TIOReadProfile_Output = IAccountSocialProfile;
