import { SignedDelegate, SignedTransaction } from "@near-js/transactions";

export interface IRelayTransaction {
  delegated: SignedDelegate;
  regular: SignedTransaction;
}

export enum EHttpStatusCode {
  SUCCESS = 200,
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
  ERROR = 500,
}

export interface IMeteorResponse<T = any> {
  status: EHttpStatusCode;
  message: string;
  data?: T;
}
