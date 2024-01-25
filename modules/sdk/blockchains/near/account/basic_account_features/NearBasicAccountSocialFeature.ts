import { NearBasicAccount } from "../NearBasicAccount.ts";
import { EAccountFeature } from "../../../../core/account/features/account_feature.enums.ts";
import { IWithBasicAccount } from "../../../../core/account/account.interfaces.ts";
import { IBasicAccountSocialFeature } from "../../../../core/account/features/account_feature.social.interface.ts";
import { SocialProfile } from "../../../../core/account/Social/SocialProfile.ts";
import { NearSocial } from "../social_features/NearSocial.ts";
import { EGenericBlockchainNetworkId } from "../../../../core/blockchain/network/blockchain_network.enums.ts";
import {
  ENearSocialAccount,
  IViewSocialProfileRes,
} from "../social_features/near.social.interfaces.ts";

export class NearBasicAccountSocialFeature implements IBasicAccountSocialFeature {
  account: IWithBasicAccount<NearBasicAccount>;
  id: EAccountFeature.social = EAccountFeature.social;
  socialUrl: string;

  constructor(account: IWithBasicAccount<NearBasicAccount>) {
    this.account = account;
    this.socialUrl =
      this.account.basic.genericNetworkId === EGenericBlockchainNetworkId.mainnet
        ? ENearSocialAccount.mainnet
        : ENearSocialAccount.testnet;
  }

  async viewSocialProfile(): Promise<SocialProfile> {
    const { result } = await this.account.basic
      .getRpcProvider()
      .callFunctionObjectArgs<IViewSocialProfileRes>({
        account_id: this.socialUrl,
        method_name: "get",
        args: {
          keys: [`${this.account.basic.id}/**`],
        },
      });

    const hasTosToAccept = !!result[this.account.basic.id]?.index?.tosAccept;

    return new NearSocial({
      id: this.account.basic.id,
      socialProfile: result[this.account.basic.id]?.profile,
      hasTosToAccept,
    });
  }
}
