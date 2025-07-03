import { ApiAction } from "../../../ApiAction";

export interface IApiAction_Ping_Input {}

export interface IApiAction_Ping_Output {}

export const ApiAction_Ping = new ApiAction<IApiAction_Ping_Input, IApiAction_Ping_Output, []>(
  "_ping",
  [],
);
