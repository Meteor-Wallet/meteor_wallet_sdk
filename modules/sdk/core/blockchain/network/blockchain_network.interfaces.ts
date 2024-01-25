import { EGenericBlockchainNetworkId, ERequestProtocol } from "./blockchain_network.enums";
import { TBlockchainNetworkId } from "./blockchain_network.types";

export interface IRequestInstruction {
  url: string;
  headers?: Record<string, string>;
  method: ERequestProtocol;
}

export interface IRequestProperty {
  required: boolean;
  id: string;
  default_value?: string;
  label?: string;
}

export interface IUniqueNetworkProps {
  /**
   * "mainnet", "testnet" or "custom"
   */
  genericNetworkId: EGenericBlockchainNetworkId;
  /**
   *  This is a user-set custom network id (much like "mainnet" or "testnet"), example: `betanet`
   * that can be used to group network definitions together, for use in grouping
   * and network rotating strategies when making blockchain requests
   */
  customNetworkId?: string;
}

export interface INetworkDefinition extends IUniqueNetworkProps {
  isUserCreated: boolean;
  label: string;
}

export interface IRpcEndpointDefinition {
  label?: string;
  isEnabled: boolean;
  isUserCreated: boolean;
  isArchival: boolean;
  requestInstruction: IRequestInstruction;
  properties?: IRequestProperty[];
}

export interface IUniqueRpcEndpointProps {
  requestInstruction: Pick<IRequestInstruction, "url">;
}

export interface IUniqueRpcProviderProps {
  networkId: TBlockchainNetworkId;
  rpcEndpoint: IUniqueRpcEndpointProps;
}
