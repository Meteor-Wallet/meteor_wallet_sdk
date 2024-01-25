import { NearAccount } from "../NearAccount.ts";
import { IFullAccountSocialFeature } from "../../../../core/account/features/account_feature.social.interface.ts";
import { NearBasicAccountSocialFeature } from "../basic_account_features/NearBasicAccountSocialFeature.ts";
import { ENearSocialAccount } from "../social_features/near.social.interfaces.ts";
import { EGenericBlockchainNetworkId } from "../../../../core/blockchain/network/blockchain_network.enums.ts";

export class NearFullAccountSocialFeature
  extends NearBasicAccountSocialFeature
  implements IFullAccountSocialFeature
{
  account: NearAccount;
  socialUrl: string;

  constructor(account: NearAccount) {
    super(account);
    this.account = account;
    this.socialUrl =
      this.account.basic.genericNetworkId === EGenericBlockchainNetworkId.mainnet
        ? ENearSocialAccount.mainnet
        : ENearSocialAccount.testnet;
  }

  async updateProfile() {
    await this.account.basic.getRpcProvider().callFunctionObjectArgs({
      account_id: this.socialUrl,
      method_name: "broadcast_tx_commit",
      args: {},
    });
  }
}
