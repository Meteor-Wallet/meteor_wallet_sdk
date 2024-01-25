import { SocialProfile } from "../../../../core/account/Social/SocialProfile";
import { ISocialProfile } from "../../../../core/account/Social/Social.interfaces";
import { IONearSocialConstructor_Input } from "./near.social.interfaces";

export class NearSocial extends SocialProfile {
  id: string;
  socialProfile?: ISocialProfile;
  hasTosToAccept: boolean;

  constructor({ id, socialProfile, hasTosToAccept }: IONearSocialConstructor_Input) {
    super({
      id,
    });
    this.id = id;
    this.socialProfile = socialProfile;
    this.hasTosToAccept = hasTosToAccept;
  }

  getNft() {
    return {
      id: this.id,
      socialProfile: this.socialProfile,
      hasTosToAccept: this.hasTosToAccept,
    };
  }
}
