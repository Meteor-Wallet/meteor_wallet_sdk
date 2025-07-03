export interface IJsonRpcConnectionInfo {
  url: string;
  headers?: { [key: string]: string | number };
}

export type TFailoverRpcConfig = {
  type: "FailoverRpcProvider";
  args: IJsonRpcConnectionInfo[];
};
