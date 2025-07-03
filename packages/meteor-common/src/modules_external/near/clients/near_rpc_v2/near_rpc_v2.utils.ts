import { StringUtils } from "../../../../modules_utility/data_type_utils/StringUtils";
import {
  ENearRpc_Finality,
  ENearRpc_ViewRequestType,
  TNearRpc_Query_InputsWithExtras,
  TNearRpc_Query_MinimalInputs,
} from "../../types/near_rpc_types";

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
