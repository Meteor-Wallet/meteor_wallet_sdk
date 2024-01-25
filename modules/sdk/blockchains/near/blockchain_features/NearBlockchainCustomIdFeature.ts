import {
  IBlockchainFeatureCustomId,
  IOGenerateAvailableId_Output,
} from "../../../core/blockchain/features/blockchain_feature.custom_id.interfaces.ts";
import { BlockchainNetwork } from "../../../core/blockchain/network/BlockchainNetwork.ts";
import { TBooleanResultWithError } from "../../../core/errors/MeteorError.types.ts";
import {
  EErrorId_Account,
  EErrorId_BlockchainFeature_CustomId,
  EErrorId_BlockchainFeature_CustomId_Formatting,
} from "../../../core/errors/MeteorErrorIds.ts";
import { NearBlockchain } from "../NearBlockchain.ts";
import { MeteorError } from "../../../core/errors/MeteorError.ts";
import { EGenericBlockchainNetworkId } from "../../../core/blockchain/network/blockchain_network.enums.ts";
import { generateRandomAccountName } from "../../../core/utility/generators/name_generator.ts";
import { checkNearFullAccountId } from "../utility/id/near.id.utils.ts";

export class NearBlockchainCustomIdFeature implements IBlockchainFeatureCustomId {
  blockchain: NearBlockchain;

  constructor(blockchain: NearBlockchain) {
    this.blockchain = blockchain;
  }

  async checkIdAvailability({
    fullId,
    network,
  }: {
    fullId: string;
    network: BlockchainNetwork;
  }): Promise<boolean> {
    const checkId = this.isValidFullId({ fullId, network });

    if (!checkId.good) {
      throw checkId.error;
    }

    const basicAccount = this.blockchain.createBasicAccount({
      id: fullId,
      networkId: network.getNetworkId(),
    });

    return basicAccount.state().checkExistence();
  }

  async generateAvailableNamedId(
    network: BlockchainNetwork,
  ): Promise<IOGenerateAvailableId_Output> {
    let randomName: string;
    let isValid = false;
    let retryCount = 0;
    const postfix = this.getIdInfoForNetwork(network).postfix;

    while (!isValid && retryCount < 3) {
      randomName = generateRandomAccountName();

      isValid = await this.checkIdAvailability({
        fullId: randomName + postfix,
        network,
      });

      retryCount++;
    }

    if (!isValid) {
      throw MeteorError.fromId(EErrorId_Account.account_already_exists_on_chain);
    }

    return {
      fullId: randomName! + this.getIdInfoForNetwork(network).postfix,
      postfix,
      idPart: randomName!,
    };
  }

  getIdInfoForNetwork(network: BlockchainNetwork): {
    postfix?: string;
  } {
    if (network.genericNetworkId === EGenericBlockchainNetworkId.custom) {
      throw MeteorError.fromId(EErrorId_BlockchainFeature_CustomId.network_custom_id_info_unknown);
    }

    return {
      postfix: `.${network.genericNetworkId}`,
    };
  }

  isValidFullId({
    fullId,
    network,
  }: {
    fullId: string;
    network: BlockchainNetwork;
  }): TBooleanResultWithError<EErrorId_BlockchainFeature_CustomId_Formatting> {
    const response = checkNearFullAccountId({ fullId });

    if (!response.good) {
      return {
        good: false,
        error: response.error,
      };
    }

    if (
      response.knownNetworkId !== undefined &&
      network.getNetworkId() !== response.knownNetworkId
    ) {
      return {
        good: false,
        error: MeteorError.fromIds([
          EErrorId_BlockchainFeature_CustomId_Formatting.invalid_account_id_format,
          EErrorId_BlockchainFeature_CustomId_Formatting.invalid_account_id_format_network_mismatch,
        ]),
      };
    }

    return {
      good: true,
    };
  }
}
