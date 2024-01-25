import { IFullAccountTransactionFeature } from "../../../../core/account/features/account_feature.transactions.interfaces";
import { NearBasicAccountTransactionFeature } from "../basic_account_features/NearBasicAccountTransactionFeature";

export class NearFullAccountTransactionFeature
  extends NearBasicAccountTransactionFeature
  implements IFullAccountTransactionFeature {}
