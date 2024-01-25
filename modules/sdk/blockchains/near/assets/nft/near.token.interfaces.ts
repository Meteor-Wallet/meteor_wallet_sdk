import { INftCollection } from "../../external_apis/indexer_xyz/indexer_xyz.types";

export interface INearNft {
  id: string;
  basic: INftCollection;
}

export interface IONearNftConstructor_Input extends INearNft {}
