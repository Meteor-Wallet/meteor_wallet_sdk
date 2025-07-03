import { ENearIndexer_ActionKind } from "../../modules_external/near_public_indexer/types/near_indexer_transaction_types";
import { ETransactionType } from "../transactions/transaction_utils";

export type TInterpretedTransaction = {
  type: ETransactionType;
  actionType: ENearIndexer_ActionKind;
  title: string;
  subtitle: string;
  sender: string;
  receiver: string;
  amountMain: string;
  amountSub: string;
  image: string;
  // fungibleToken?: TFungibleTokenWithPriceAndAmount;
  // nonFungibleToken?: IMeteorNftToken_Full;
};
