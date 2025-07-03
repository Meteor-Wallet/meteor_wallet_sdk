import { Context } from "koa";
import {
  ICookiePlugin_ExecutionContextInputs,
  TCookiePlugin_ExecutionContext,
} from "./CookiePlugin_Def";

function initialize(ctx: Context): ICookiePlugin_ExecutionContextInputs {
  return {
    set: ({ key, opt, value }) => {
      ctx.cookies.set(key, value, opt);
    },
    get: ({ opt, key }) => {
      return ctx.cookies.get(key, opt);
    },
    clear: ({ key, opt }) => {
      ctx.cookies.set(key);
    },
  };
}

export const CookiePlugin_Context_Koa: {
  initialize: TCookiePlugin_ExecutionContext["initializer"];
} = {
  initialize,
};
