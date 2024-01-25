import { IBlockchainFeature } from "./blockchain_feature.interfaces.ts";
import { BlockchainNetwork } from "../network/BlockchainNetwork.ts";
import { EErrorId_BlockchainFeature_CustomId_Formatting } from "../../errors/MeteorErrorIds.ts";
import { TBooleanResultWithError } from "../../errors/MeteorError.types.ts";

export interface IOGetIdInfoForNetwork_Output {
  postfix?: string;
}

export interface IOGenerateAvailableId_Output extends IOGetIdInfoForNetwork_Output {
  idPart: string;
  fullId: string;
}

export interface IBlockchainFeatureCustomId extends IBlockchainFeature {
  generateAvailableNamedId: (network: BlockchainNetwork) => Promise<IOGenerateAvailableId_Output>;
  checkIdAvailability: (inputs: { fullId: string; network: BlockchainNetwork }) => Promise<boolean>;
  getIdInfoForNetwork: (network: BlockchainNetwork) => IOGetIdInfoForNetwork_Output;
  isValidFullId: (inputs: {
    fullId: string;
    network: BlockchainNetwork;
  }) => TBooleanResultWithError<EErrorId_BlockchainFeature_CustomId_Formatting>;
}
