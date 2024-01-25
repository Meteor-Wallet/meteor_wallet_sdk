import { NearAccount } from "../NearAccount.ts";
import { IFullAccountNftFeature } from "../../../../core/account/features/account_feature.nft.interfaces.ts";
import { NearBasicAccountNftFeature } from "../basic_account_features/NearBasicAccountNftFeature.ts";

export class NearFullAccountNftFeature
  extends NearBasicAccountNftFeature
  implements IFullAccountNftFeature
{
  account: NearAccount;

  constructor(account: NearAccount) {
    super(account);
    this.account = account;
  }
}
