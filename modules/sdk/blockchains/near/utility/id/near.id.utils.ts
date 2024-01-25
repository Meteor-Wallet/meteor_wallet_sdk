import { ENearAccountIdentifierType } from "./near.id.enums.ts";
import { EGenericBlockchainNetworkId } from "../../../../core/blockchain/network/blockchain_network.enums.ts";
import { MeteorError } from "../../../../core/errors/MeteorError.ts";
import { EErrorId_BlockchainFeature_CustomId_Formatting } from "../../../../core/errors/MeteorErrorIds.ts";
import { TIOCheckNearAccountId_Output } from "./near.id.types.ts";
import { HEX_CHARACTERS_REGEX, NEAR_NAMED_ACCOUNT_ID_REGEX } from "./near.id.static.ts";

export const checkNearFullAccountId = ({
  fullId,
}: {
  fullId: string;
}): TIOCheckNearAccountId_Output => {
  let namedPart: string;
  let knownNetworkId: EGenericBlockchainNetworkId | string | undefined;
  let type: ENearAccountIdentifierType = ENearAccountIdentifierType.named;

  if (fullId.length < 2) {
    return {
      good: false,
      error: MeteorError.fromIds([
        EErrorId_BlockchainFeature_CustomId_Formatting.invalid_account_id_format,
        EErrorId_BlockchainFeature_CustomId_Formatting.invalid_account_id_format_too_short,
      ]),
    };
  }

  if (fullId.length > 64) {
    return {
      good: false,
      error: MeteorError.fromIds([
        EErrorId_BlockchainFeature_CustomId_Formatting.invalid_account_id_format,
        EErrorId_BlockchainFeature_CustomId_Formatting.invalid_account_id_format_too_long,
      ]),
    };
  }

  if (fullId.endsWith(".near")) {
    namedPart = fullId.slice(0, -5);
    knownNetworkId = EGenericBlockchainNetworkId.mainnet;
  } else if (fullId.endsWith(".testnet")) {
    namedPart = fullId.slice(0, -8);
    knownNetworkId = EGenericBlockchainNetworkId.testnet;
  } else if (fullId.length === 64) {
    if (HEX_CHARACTERS_REGEX.test(fullId)) {
      namedPart = fullId;
      type = ENearAccountIdentifierType.implicit;
    }
  } else {
    return {
      good: false,
      error: MeteorError.fromIds([
        EErrorId_BlockchainFeature_CustomId_Formatting.invalid_account_id_format,
        EErrorId_BlockchainFeature_CustomId_Formatting.invalid_account_id_format_unknown_network_format,
      ]),
    };
  }

  if (type !== ENearAccountIdentifierType.implicit) {
    if (!NEAR_NAMED_ACCOUNT_ID_REGEX.test(fullId)) {
      return {
        good: false,
        error: MeteorError.fromIds([
          EErrorId_BlockchainFeature_CustomId_Formatting.invalid_account_id_format,
          EErrorId_BlockchainFeature_CustomId_Formatting.invalid_account_id_format_bad_characters,
        ]),
      };
    }
  }

  return {
    good: true,
    type,
    namedPart: namedPart!,
    knownNetworkId,
  };
};
