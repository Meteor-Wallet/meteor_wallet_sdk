import { ENearAccountIdentifierType } from "./near.id.enums.ts";
import { EGenericBlockchainNetworkId } from "../../../../core/blockchain/network/blockchain_network.enums.ts";
import { MeteorError } from "../../../../core/errors/MeteorError.ts";
import { EErrorId_BlockchainFeature_CustomId_Formatting } from "../../../../core/errors/MeteorErrorIds.ts";

export type TIOCheckNearAccountId_Output =
  | {
      good: true;
      namedPart: string;
      type: ENearAccountIdentifierType;
      knownNetworkId?: EGenericBlockchainNetworkId | string;
      error?: undefined;
    }
  | {
      good: false;
      type?: undefined;
      namedPart?: undefined;
      knownNetwork?: undefined;
      error: MeteorError<EErrorId_BlockchainFeature_CustomId_Formatting>;
    };
