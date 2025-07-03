import { ApiPlugin_SecureEndpoint } from "./ApiPlugin_SecureEndpoint";

ApiPlugin_SecureEndpoint.implementContextual(async ({ plugins: {} }) => {
  return {
    methods: {},
  };
});

export const ApiPlugin_SecureEndpoint_Impl = ApiPlugin_SecureEndpoint;
