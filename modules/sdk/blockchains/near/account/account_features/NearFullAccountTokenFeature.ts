import { NearAccount } from "../NearAccount.ts";
import { NearTransaction } from "../../transactions/NearTransaction.ts";
import { NearTokenAmount } from "../../assets/NearTokenAmount.ts";
import {
  IFullAccountTokenFeature,
  IOCreateTokenTransferTransaction_Inputs,
} from "../../../../core/account/features/account_feature.token.interfaces.ts";
import { NearBasicAccount } from "../NearBasicAccount.ts";
import { NearBasicAccountTokenFeature } from "../basic_account_features/NearBasicAccountTokenFeature.ts";
import { actionCreators } from "@near-js/transactions";

export class NearFullAccountTokenFeature
  extends NearBasicAccountTokenFeature
  implements IFullAccountTokenFeature
{
  account: NearAccount;

  constructor(account: NearAccount) {
    super(account);
    this.account = account;
  }

  createTokenTransferTransaction(inputs: IOCreateTokenTransferTransaction_Inputs): NearTransaction {
    const { receiver, tokenAmount } = inputs as IOCreateTokenTransferTransaction_Inputs<
      NearBasicAccount,
      NearTokenAmount
    >;
    return this.account.constructTransaction({
      actions: [actionCreators.transfer(tokenAmount.getNativeAmountInBN())],
      receiver,
    });
  }
}
