import { parseContract } from "near-contract-parser";
import { z } from "zod";
import { getNearApi } from "../../../modules_external/near/clients/near_api_js/NearApiJsClient";
import { ENearNetwork } from "../../../modules_external/near/types/near_basic_types";
import { TFRSuccessPayload } from "../../../modules_utility/api_utilities/task_function/TaskFunctionResponses";
import { Endpoint_GetContractInterface } from "./Endpoint_GetContractInterface";

Endpoint_GetContractInterface.setValidation(
  z.object({
    contractId: z.string(),
    network: z.nativeEnum(ENearNetwork),
  }),
);

Endpoint_GetContractInterface.implement(async ({ contractId, network }, { plugins: {} }) => {
  const response: any = await getNearApi(network).nativeApi.connection.provider.query({
    account_id: contractId,
    finality: "final",
    request_type: "view_code",
  });

  console.log(response);
  const parsed = parseContract(response.code_base64);
  console.log(parsed);

  return TFRSuccessPayload({
    interface: parsed,
  });
});

export const Endpoint_GetContractInterface_Impl = Endpoint_GetContractInterface;
