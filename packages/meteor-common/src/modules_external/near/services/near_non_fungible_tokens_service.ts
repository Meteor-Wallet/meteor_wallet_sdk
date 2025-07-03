import { utils } from "near-api-js";
import { NearApiJsClient, getNearApi } from "../clients/near_api_js/NearApiJsClient";
import { ENearNetwork } from "../types/near_basic_types";
import {
  IWithAccountId,
  IWithContractName,
  IWithPagination,
  IWithReceiverId,
  IWithTokenId,
} from "../types/near_input_helper_types";
import {
  INearNftMetadata,
  INearNftTokenData_WithMetadata,
} from "../types/standards/nft_standard_types";

// doc: https://nomicon.io/Standards/Tokens/NonFungibleToken/

// set this to the same value as we use for creating an account and the remainder is refunded
export const NFT_TRANSFER_GAS = utils.format.parseNearAmount("0.00000000003")!;

// contract might require an attached depositof of at least 1 yoctoNear on transfer methods
// "This 1 yoctoNEAR is not enforced by this standard, but is encouraged to do. While ability to receive attached deposit is enforced by this token."
// from: https://github.com/near/NEPs/blob/master/neps/nep-0171.md
export const NFT_TRANSFER_DEPOSIT = "1";

interface ITransfer_Input extends IWithAccountId, IWithContractName, IWithTokenId, IWithReceiverId {
  approvalId?: number;
  memo?: any;
}

interface ITransferCall_Input extends ITransfer_Input {
  msg: string;
}

export class NonFungibleTokensService {
  // View functions are not signed, so do not require a real account!
  // static viewFunctionAccount = wallet.getAccountBasic('dontcare');
  private network: ENearNetwork;
  private nearApi: NearApiJsClient;

  constructor(network: ENearNetwork) {
    this.network = network;
    this.nearApi = getNearApi(network);
  }

  private transPagination({ offset, limit }: IWithPagination) {
    return {
      from_index: offset ? String(offset) : "0",
      limit,
    };
  }

  async getMetadata({ contractName }: IWithContractName): Promise<INearNftMetadata> {
    return await this.nearApi.viewFunction(contractName, "nft_metadata");
  }

  async getTotalCount({ contractName }: IWithContractName): Promise<number> {
    return parseInt(await this.nearApi.viewFunction(contractName, "nft_total_supply"));
  }

  async getAccountCount({
    contractName,
    accountId,
  }: IWithContractName & IWithAccountId): Promise<number> {
    return parseInt(
      await this.nearApi.viewFunction(contractName, "nft_supply_for_owner", {
        account_id: accountId,
      }),
    );
  }

  async getNftToken({
    contractName,
    tokenId,
  }: IWithContractName & IWithTokenId): Promise<INearNftTokenData_WithMetadata> {
    return this.nearApi.viewFunction(contractName, "nft_token", {
      token_id: tokenId,
    });
  }

  async getTotalNfts({
    contractName,
    ...rest
  }: IWithContractName & IWithPagination): Promise<INearNftTokenData_WithMetadata[]> {
    return await this.nearApi.viewFunction(contractName, "nft_tokens", {
      ...this.transPagination(rest),
    });
  }

  /**
   * This will return one page only
   */
  async getAccountNfts({
    contractName,
    accountId,
    ...rest
  }: IWithContractName & IWithAccountId & IWithPagination): Promise<
    INearNftTokenData_WithMetadata[]
  > {
    return await this.nearApi.viewFunction(contractName, "nft_tokens_for_owner", {
      account_id: accountId,
      ...this.transPagination(rest),
    });
  }

  async getAllAccountNfts({
    contractName,
    accountId,
  }: IWithContractName & IWithAccountId): Promise<INearNftTokenData_WithMetadata[]> {
    let allNfts: INearNftTokenData_WithMetadata[] = [];
    const limit = 20;
    const totalNft: string = await this.nearApi.viewFunction(contractName, "nft_supply_for_owner", {
      account_id: accountId,
    });

    const maxTryCount = Math.ceil(Number(totalNft) / limit) + 2;

    let currentTry = 0;

    while (allNfts.length !== Number(totalNft)) {
      currentTry++;
      try {
        const tmpNfts = await this.getAccountNfts({
          contractName,
          accountId,
          ...this.transPagination({
            offset: allNfts.length,
            limit: limit,
          }),
        });
        allNfts = [...allNfts, ...tmpNfts];
        if (currentTry > maxTryCount) {
          break;
        }
      } catch (err) {
        // wait for a bit and try again in next loop
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return allNfts;
  }
}

// export const fungibleTokensService = new FungibleTokens();

let nearNonFungibleTokensForNetwork: {
  [network in ENearNetwork]?: NonFungibleTokensService;
} = {};

export function getNonFungibleTokensApi(network: ENearNetwork): NonFungibleTokensService {
  if (nearNonFungibleTokensForNetwork[network] != null) {
    return nearNonFungibleTokensForNetwork[network]!;
  }

  nearNonFungibleTokensForNetwork[network] = new NonFungibleTokensService(network);
  return nearNonFungibleTokensForNetwork[network]!;
}
