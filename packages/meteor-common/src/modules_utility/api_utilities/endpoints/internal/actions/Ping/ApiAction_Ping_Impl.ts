import { TFRSuccess } from "../../../../task_function/TaskFunctionResponses";
import { ApiAction_Ping } from "./ApiAction_Ping";

ApiAction_Ping.implement(async ({}) => {
  return TFRSuccess({});
});

export const ApiAction_Ping_Impl = ApiAction_Ping;
