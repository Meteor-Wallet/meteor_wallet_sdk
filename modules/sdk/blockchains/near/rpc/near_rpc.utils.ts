import { StringUtils } from "../../../core/utility/javascript_datatype_utils/string.utils";
import { ENearRpc_Finality, ENearRpc_ViewRequestType } from "./near_rpc.enums";
import { TNearRpc_Query_InputsWithExtras, TNearRpc_Query_MinimalInputs } from "./near_rpc.types";

export function parseObjectFromRawResponse(response: Uint8Array | number[]): any {
  return JSON.parse(Buffer.from(response).toString());
}

export function expandParams(
  inputs: TNearRpc_Query_MinimalInputs<any>,
  requestType?: ENearRpc_ViewRequestType,
): TNearRpc_Query_InputsWithExtras<any> {
  if (StringUtils.notNullEmpty(inputs.block_id) || StringUtils.notNullEmpty(inputs.finality)) {
    return {
      ...inputs,
      ...{ request_type: requestType },
    };
  }

  return {
    ...inputs,
    ...{ request_type: requestType },
    finality: ENearRpc_Finality.final,
  };
}
