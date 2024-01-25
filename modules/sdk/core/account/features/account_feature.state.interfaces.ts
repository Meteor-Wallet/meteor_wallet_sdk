import { EAccountFeature } from "./account_feature.enums.ts";
import { IWatchableProps } from "../../utility/data_entity/watchable/watchable.interfaces.ts";
import { Account } from "../Account.ts";
import { IWithBasicAccount } from "../account.interfaces.ts";

export interface IBasicAccountStateFeatureWatchableProps {
  exists: boolean;
}

export interface IBasicAccountStateFeature
  extends IWatchableProps<IBasicAccountStateFeatureWatchableProps>,
    IBasicAccountStateFeatureWatchableProps {
  account: IWithBasicAccount;
  id: EAccountFeature.state;
  checkExistence: () => Promise<boolean>;
}

export interface IFullAccountStateFeature extends IBasicAccountStateFeature {
  account: Account;
}
