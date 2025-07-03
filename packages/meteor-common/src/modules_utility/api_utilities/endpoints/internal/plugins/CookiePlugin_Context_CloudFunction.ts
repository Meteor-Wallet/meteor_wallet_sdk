import Cookies from "cookies";
import * as express from "express";
import { ServerConfig } from "../../../../../configs/ServerConfig";
import { ICookiePlugin_ExecutionContextInputs } from "./CookiePlugin_Def";

function initialize({
  req,
  res,
}: {
  req: express.Request;
  res: express.Response;
}): ICookiePlugin_ExecutionContextInputs {
  const { appKeys, isProductionEnv } = ServerConfig.getConfig();
  const cookies = new Cookies(req, res, {
    keys: appKeys,
    secure: isProductionEnv,
  });

  return {
    set: ({ key, opt, value }) => {
      cookies.set(key, value, opt);
    },
    get: ({ opt, key }) => {
      return cookies.get(key, opt);
    },
    clear: ({ key, opt }) => {
      cookies.set(key);
    },
  };
}

export const CookiePlugin_Context_CloudFunction = {
  initialize,
};
