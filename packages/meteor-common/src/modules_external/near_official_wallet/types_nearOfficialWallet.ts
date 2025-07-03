/*
export interface INearWalletAccountData {
  accountId: string;

}*/

export type TNearWalletBatchAccountTuple = [
  accountId: string,
  secretKey: string,
  ledgerPath: string,
];
