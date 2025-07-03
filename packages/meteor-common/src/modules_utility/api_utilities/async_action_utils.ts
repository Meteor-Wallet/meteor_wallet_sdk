import {
  ICreateAsyncActionOptions,
  IOCreateAsyncActionOutput,
  IPullstateAllStores,
  TUseResponse,
  createAsyncAction,
  errorResult,
  successResult,
} from "pullstate";
import { EOldMeteorErrorId } from "../old_errors/old_error_ids";

export class MeteorActionError extends Error {
  public endTags: (string | EOldMeteorErrorId)[];

  constructor(endTags: string[], previousError?: Error) {
    super(previousError?.message, { cause: previousError });
    this.endTags = endTags;
  }

  setMessage(msg: string): MeteorActionError {
    this.message = msg;
    return this;
  }
}

export function createAsyncActionWithErrors<I, O, T extends string = string>(
  asyncMethod: (inputs: I, store: IPullstateAllStores) => Promise<O>,
  options?: ICreateAsyncActionOptions<I, O, T, any, any>,
): IOCreateAsyncActionOutput<I, O, T, any, any> {
  return createAsyncAction<I, O, T>(async (inputs, store) => {
    try {
      const resp = await asyncMethod(inputs, store);
      return successResult(resp);
    } catch (e: any) {
      if (e instanceof MeteorActionError) {
        return errorResult(e.endTags as T[], e.message, e.cause);
      }
      return errorResult([], e.message, e);
    }
  }, options);
}

export function extractErrorMessageFromAsyncAction(
  asyncActions: TUseResponse[],
): { requestId?: string; message: string }[] {
  return asyncActions
    .filter((e) => e.error && e.message)
    .map((res) => {
      let finalMessage = res.message;
      if (res.message.includes("node does not track the shard ID")) {
        finalMessage = `RPC Error: ${res.message}`;
      }

      return {
        requestId: res.errorPayload?.context?.requestId,
        message: finalMessage,
      };
    });
}
