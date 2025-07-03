import * as express from "express";
import { IApiPlugin_BasicRequestInfo_ExecutionContextInputs } from "./ApiPlugin_BasicRequestInfo";

function initialize({
  req,
  res,
}: {
  req: express.Request;
  res: express.Response;
}): IApiPlugin_BasicRequestInfo_ExecutionContextInputs {
  return {
    getIp() {
      return req.ip;
    },
  };
}

export const ApiPlugin_BasicRequestInfo_Context_CloudFunction = {
  initialize,
};
