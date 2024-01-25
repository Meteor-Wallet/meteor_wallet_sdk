import {
  EGenericBlockchainNetworkId,
  ERequestProtocol,
} from "../../../core/blockchain/network/blockchain_network.enums";
import { IRpcEndpointDefinition } from "../../../core/blockchain/network/blockchain_network.interfaces";
import { ENearNetworkNodeUrl } from "./near_network.enums";

export const near_mainnet_endpoint: IRpcEndpointDefinition = {
  isArchival: false,
  requestInstruction: {
    url: ENearNetworkNodeUrl[EGenericBlockchainNetworkId.mainnet],
    method: ERequestProtocol.JSON_RPC_2_0,
  },
  isEnabled: true,
  isUserCreated: false,
};

export const near_mainnet_archival_endpoint: IRpcEndpointDefinition = {
  isArchival: true,
  requestInstruction: {
    url: ENearNetworkNodeUrl["mainnet_archival"],
    method: ERequestProtocol.JSON_RPC_2_0,
  },
  isEnabled: true,
  isUserCreated: false,
};

export const near_testnet_endpoint: IRpcEndpointDefinition = {
  isArchival: false,
  requestInstruction: {
    url: ENearNetworkNodeUrl[EGenericBlockchainNetworkId.testnet],
    method: ERequestProtocol.JSON_RPC_2_0,
  },
  isEnabled: true,
  isUserCreated: false,
};

const near_pagoda_endpoint: IRpcEndpointDefinition = {
  isArchival: false,
  isEnabled: false,
  isUserCreated: false,
  requestInstruction: {
    url: "https://near-testnet.api.pagoda.co/rpc/<version>",
    method: ERequestProtocol.JSON_RPC_2_0,
    headers: {
      "x-api-key": "<api_key>",
      version: "<version>",
    },
  },
  properties: [
    {
      required: true,
      id: "api_key",
      label: "API Key",
    },
    {
      required: true,
      id: "version",
      label: "API Key 2",
    },
  ],
};

function createRequest(def: IRpcEndpointDefinition, userValues: Record<string, string>) {
  const headers: any = {};
  let url;

  for (const prop of def.properties ?? []) {
    url = def.requestInstruction.url.replace(
      `<${prop.id}>`,
      userValues[prop.id] ?? prop.default_value ?? "",
    );
  }
}
