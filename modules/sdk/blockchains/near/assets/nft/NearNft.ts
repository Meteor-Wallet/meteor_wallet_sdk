import { IONearNftConstructor_Input } from "./near.token.interfaces";
import { Nft } from "../../../../core/assets/nft/Nft";
import { INftCollection } from "../../external_apis/indexer_xyz/indexer_xyz.types";

export class NearNft extends Nft {
  id: string;
  basic: INftCollection;

  constructor({ id, basic }: IONearNftConstructor_Input) {
    super({
      id,
    });
    this.id = id;
    this.basic = basic;
  }

  getNft() {
    return {
      id: this.id,
      basic: this.basic,
    };
  }
}
