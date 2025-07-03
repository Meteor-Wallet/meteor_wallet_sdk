import { IMeteorErrorObject } from "@meteorwallet/errors";

interface IResponseOk<T> {
  ok: true;
  value: T;
  requestId: string;
}

interface IResponseErrorApiJson {
  ok: false;
  error: IMeteorErrorObject;
  requestId: string;
}

export type TMeteorApiResponse<T> = IResponseOk<T> | IResponseErrorApiJson;
