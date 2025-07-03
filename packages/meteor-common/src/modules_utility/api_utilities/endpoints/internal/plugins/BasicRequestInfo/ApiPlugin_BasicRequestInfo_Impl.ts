import {
  ApiPlugin_BasicRequestInfo,
  IApiPlugin_BasicRequestInfo_ContextualMethods,
} from "./ApiPlugin_BasicRequestInfo";

ApiPlugin_BasicRequestInfo.implementContextual(async ({ plugins: {}, context }) => {
  const getIp: IApiPlugin_BasicRequestInfo_ContextualMethods["getIp"] = context.getIp;

  return {
    methods: {
      getIp,
    },
  };
});

export const ApiPlugin_BasicRequestInfo_Impl = ApiPlugin_BasicRequestInfo;
