import { NearBasicAccountStateFeature } from "../basic_account_features/NearBasicAccountStateFeature.ts";
import { IFullAccountStateFeature } from "../../../../core/account/features/account_feature.state.interfaces.ts";
import { NearAccount } from "../NearAccount.ts";

export class NearFullAccountStateFeature
  extends NearBasicAccountStateFeature
  implements IFullAccountStateFeature
{
  account: NearAccount;

  constructor(account: NearAccount) {
    super({ account });
    this.account = account;
  }
}
