import { Nft } from "../../assets/nft/Nft.ts";

export interface IBasicAccountNftFeature {
  getNfts(): Promise<Nft[]>;
}

export interface IFullAccountNftFeature extends IBasicAccountNftFeature {}
