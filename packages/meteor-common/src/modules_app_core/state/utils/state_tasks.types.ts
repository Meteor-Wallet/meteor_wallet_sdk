export interface IStateTaskOutput_Success<T extends string = string, P = undefined> {
  success: true;
  result: P;
  tags: {
    [tag in T]?: true;
  };
}

export interface IStateTaskOutput_Failure<T extends string = string> {
  success: false;
  result?: undefined;
  tags: {
    [tag in T]?: true;
  };
}

export type TStateTaskOutput<T extends string = string, P = undefined> =
  | IStateTaskOutput_Success<T, P>
  | IStateTaskOutput_Failure<T>;

export type TStateTaskOutputPromise<T extends string = string, P = undefined> = Promise<
  TStateTaskOutput<T, P>
>;
