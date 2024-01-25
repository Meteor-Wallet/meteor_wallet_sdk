import { ISocialProfile } from "../../../../core/account/Social/Social.interfaces";

export interface INearSocial {
  id: string;
  socialProfile?: ISocialProfile;
  hasTosToAccept: boolean;
}

export interface IONearSocialConstructor_Input extends INearSocial {}

export enum ENearSocialAccount {
  mainnet = "social.near",
  testnet = "v1.social08.testnet",
}

export interface IViewSocialProfileRes {
  [key: string]: {
    index?: {
      tosAccept: string;
    };
    profile?: ISocialProfile;
  };
}
