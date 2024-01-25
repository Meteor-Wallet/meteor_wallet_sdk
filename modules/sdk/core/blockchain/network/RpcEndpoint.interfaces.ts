import { RpcEndpoint } from "./RpcEndpoint.ts";

export interface IRpcEndpointEditableProps
  extends Pick<RpcEndpoint, "isEnabled" | "requestInstruction" | "properties"> {}
