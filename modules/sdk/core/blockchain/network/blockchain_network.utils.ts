import { IUniqueNetworkProps } from "./blockchain_network.interfaces";
import { EGenericBlockchainNetworkId } from "./blockchain_network.enums";
import { TBlockchainNetworkId } from "./blockchain_network.types";
import { MeteorInternalError } from "../../errors/MeteorError.ts";
import { StringUtils } from "../../utility/javascript_datatype_utils/string.utils.ts";

export const convertNetworkIdToUniqueProps = (
  networkId: TBlockchainNetworkId,
): IUniqueNetworkProps => {
  return networkId === EGenericBlockchainNetworkId.mainnet ||
    networkId === EGenericBlockchainNetworkId.testnet
    ? {
        genericNetworkId: networkId,
      }
    : {
        genericNetworkId: EGenericBlockchainNetworkId.custom,
        customNetworkId: networkId,
      };
};

export const getNetworkIdFromProps = ({
  genericNetworkId,
  customNetworkId,
}: IUniqueNetworkProps): TBlockchainNetworkId => {
  if (
    genericNetworkId === EGenericBlockchainNetworkId.custom &&
    StringUtils.nullEmpty(customNetworkId)
  ) {
    throw new MeteorInternalError("Network ID not set correctly for custom network");
  }
  return customNetworkId ?? genericNetworkId;
};
