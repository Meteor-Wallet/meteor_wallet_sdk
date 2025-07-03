import _ from "lodash";
import { notNullEmpty } from "../../../modules_utility/data_type_utils/StringUtils";
import { z } from "zod";
import { ENearNetwork } from "../../near/types/near_basic_types";
import { near_basic_utils } from "../../near/utils/near_basic_utils";
import { NEAR_BASE_CONFIG_FOR_NETWORK } from "../../near/near_static_data";
import { object_utils } from "@meteorwallet/utils/javascript_type_utils/index";

export function getRpcUrlPartForPayload(payload: any): { rpcUrl?: string } {
  if (payload == null || !object_utils.isObject(payload)) {
    return {};
  }

  const possibleRpcUrls: (string | undefined)[] = [
    payload["rpcUrl"],
    _.get(payload, ["walletSignedPayload", "rpcUrl"]),
    payload["rpc_url"],
  ];

  const rpcUrl: string | undefined = possibleRpcUrls.find((url) => {
    return notNullEmpty(url) && z.string().url().safeParse(url);
  });

  if (rpcUrl != null) {
    return {
      rpcUrl,
    };
  }

  const possibleNetworkIds: string[] = [
    payload["networkId"],
    _.get(payload, ["walletSignedPayload", "networkId"]),
    payload["network_id"],
  ];

  const networkId: ENearNetwork | undefined = possibleNetworkIds.find((id) => {
    return notNullEmpty(id) && near_basic_utils.isNearNetworkString(id);
  });

  if (networkId != null) {
    return {
      rpcUrl: NEAR_BASE_CONFIG_FOR_NETWORK[networkId].nodeUrl,
    };
  }

  return {};
}
