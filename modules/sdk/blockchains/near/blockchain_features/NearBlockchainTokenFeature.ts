import { IBlockchainTokenFeature } from "../../../core/blockchain/features/blockchain_feature.token.interfaces.ts";
import { NearToken } from "../assets/NearToken.ts";
import { NearBlockchain } from "../NearBlockchain.ts";
import { ListManager } from "../../../core/utility/managers/list_manager/ListManager.ts";
import { convertNetworkIdToUniqueProps } from "../../../core/blockchain/network/blockchain_network.utils.ts";
import { near_token_static } from "../assets/near.token.static.ts";
import { ENearFtSpec } from "../assets/near.token.enums.ts";
import { ENearRpc_Finality } from "../rpc/near_rpc.enums.ts";
import { INearFungibleTokenMetadata } from "../near_native/standards/fungible_token_standard.types.ts";
import { MeteorError } from "../../../core/errors/MeteorError.ts";
import { EErrorId_Near_Rpc } from "../../../core/errors/MeteorErrorIds.near.ts";
import { EErrorId_Contract, EErrorId_Token } from "../../../core/errors/MeteorErrorIds.ts";
import { IWithBasicAccountProps } from "../../../core/account/account.interfaces.ts";

export class NearBlockchainTokenFeature implements IBlockchainTokenFeature {
  blockchain: NearBlockchain;
  tokens: ListManager<NearToken, IWithBasicAccountProps> = new ListManager<
    NearToken,
    IWithBasicAccountProps
  >();

  constructor(blockchain: NearBlockchain) {
    this.blockchain = blockchain;
  }

  async getToken({
    id,
    networkId,
    dollarPrice,
  }: {
    id: string;
    networkId: string;
    dollarPrice?: string;
  }): Promise<NearToken> {
    const networkProps = convertNetworkIdToUniqueProps(networkId);
    const withBasicProps: IWithBasicAccountProps = {
      basic: {
        id,
        blockchainId: this.blockchain.id,
        ...networkProps,
      },
    };

    if (this.tokens.includes(withBasicProps)) {
      return this.tokens.get(withBasicProps);
    }

    const metadata = await this.getTokenMetadata({ id, networkId });

    const bridgedMetaOverride = near_token_static.near_token_bridged_overrides.find(
      (override) => override.id === id,
    );

    const newToken = new NearToken({
      blockchain: this.blockchain,
      id,
      blockchainId: this.blockchain.id,
      isBridged: bridgedMetaOverride?.isBridged ?? false,
      decimals: metadata.decimals,
      isNative: false,
      dollarPrice: dollarPrice,
      metadata: {
        ...metadata,
        spec: ENearFtSpec.ft_1_0_0,
        name: bridgedMetaOverride?.name ?? metadata.name,
        symbol: bridgedMetaOverride?.symbol ?? metadata.symbol,
      },
      ...convertNetworkIdToUniqueProps(networkId),
    });
    this.tokens.add(newToken);
    return newToken;
  }

  async getTokenMetadata({
    networkId,
    id,
  }: {
    id: string;
    networkId: string;
  }): Promise<INearFungibleTokenMetadata> {
    const rpc = this.blockchain.getRpcProvider(networkId);

    try {
      const response = await rpc.callFunctionObjectArgs<INearFungibleTokenMetadata>({
        account_id: id,
        finality: ENearRpc_Finality.final,
        method_name: "ft_metadata",
      });

      const bridgedMetaOverride = near_token_static.near_token_bridged_overrides.find(
        (override) => override.id === id,
      );

      return {
        ...response.result,
        name: bridgedMetaOverride?.name ?? response.result.name,
        symbol: bridgedMetaOverride?.symbol ?? response.result.symbol,
      };
    } catch (e) {
      if (
        e instanceof MeteorError &&
        e.has(EErrorId_Near_Rpc.near_call_function_method_not_found)
      ) {
        throw MeteorError.fromIds([
          EErrorId_Contract.contract_method_not_found,
          EErrorId_Token.invalid_token_contract,
        ]);
      }

      throw e;
    }
  }
}
