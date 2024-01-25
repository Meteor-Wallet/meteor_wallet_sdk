import { NearBasicAccount } from "../NearBasicAccount.ts";
import { ListManager } from "../../../../core/utility/managers/list_manager/ListManager.ts";
import { NearTokenAmount } from "../../assets/NearTokenAmount.ts";
import { EAccountFeature } from "../../../../core/account/features/account_feature.enums.ts";
import { IWithBasicAccount } from "../../../../core/account/account.interfaces.ts";
import { IWithToken } from "../../../../core/assets/token/Token.interfaces.ts";
import { getIndexerXyzApi } from "../../external_apis/indexer_xyz/IndexerXyzApi.ts";
import { NearNft } from "../../assets/nft/NearNft.ts";
import { IBasicAccountNftFeature } from "../../../../core/account/features/account_feature.nft.interfaces.ts";

export class NearBasicAccountNftFeature implements IBasicAccountNftFeature {
  accountNfts: ListManager<NearTokenAmount, IWithToken> = new ListManager<
    NearTokenAmount,
    IWithToken
  >();
  account: IWithBasicAccount<NearBasicAccount>;
  id: EAccountFeature.nft = EAccountFeature.nft;

  constructor(account: IWithBasicAccount<NearBasicAccount>) {
    this.account = account;
  }

  async getNfts(): Promise<NearNft[]> {
    const nfts = await getIndexerXyzApi().getNfts(this.account.basic.id);

    const res = nfts.map((nft) => {
      return new NearNft({
        id: nft.id,
        basic: nft,
      });
    });
    return res;
  }
}
