import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";
import { INearIndexer_Transaction_WithActions } from "../../modules_external/near_public_indexer/types/near_indexer_transaction_types";

import { useLang } from "../../modules_app_core/translation/useLang";
import { getTrxType } from "../transactions/transaction_utils";

interface IGetTrxTitle_Params {
  network: ENearNetwork;
  trx: INearIndexer_Transaction_WithActions;
  accountId?: string;
}

// interface IGetTrxActionTitle_Params {
//   network: ENearNetwork;
//   action: INearIndexer_TransactionAction_Any;
//   trx: INearIndexer_Transaction_WithActions;
//   accountId?: string;
// }

const getTrxTitle = ({ trx, accountId, network }: IGetTrxTitle_Params): string => {
  // if (isSingleActionTrx(trx)) {
  //   const action = trx.actions[0];
  //   const title = getTrxActionTitle({ trx, accountId, action, network });
  //   if (title) {
  //     return title;
  //   }
  // }
  const trxType = getTrxType(trx, accountId ?? "");
  return trxType;
};

// export interface ICPComponent_TrxTitle {
//   trx: INearIndexer_Transaction_WithActions;
//   accountId: string;
//   network: ENearNetwork;
// }

export function getTrxTitleText({ trx, accountId, network }): string {
  const { typeName } = useLang().pageContent.transactions;
  // console.log(typeName)
  const trxTitle = getTrxType(trx, accountId);
  // const inETransactionType = (
  //   Object.values(ETransactionType) as string[]
  // ).includes(trxTitle);
  return typeName[trxTitle];
  // return inETransactionType ? typeName[trxTitle] : trxTitle;
}
