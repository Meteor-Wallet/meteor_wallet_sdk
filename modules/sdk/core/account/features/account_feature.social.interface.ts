import { SocialProfile } from "../Social/SocialProfile.ts";

export interface IBasicAccountSocialFeature {
  viewSocialProfile(): Promise<SocialProfile>;
}

export interface IFullAccountSocialFeature extends IBasicAccountSocialFeature {}
