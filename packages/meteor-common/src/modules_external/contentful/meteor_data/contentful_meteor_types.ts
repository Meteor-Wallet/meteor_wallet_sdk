import { Asset, Entry } from "contentful";

export interface IContentful_Carousel_Item {
  url?: string;
  itemTitle: string;
  image: Asset;
}

export interface IContentful_Item_Brand {
  brandName: string;
  brandIcon: Asset;
  shortDescription?: string;
  brandWebsiteUrl: string;
}

export interface IContentful_Item_ExploreSection {
  sectionHeading: string;
  sectionIcon: Asset;
  brands: Array<Entry<IContentful_Item_Brand>>;
  showBrandDescription: boolean;
}

export interface IContentful_Item_ExploreData_V1 {
  exploreId: string;
  carouselItems: Array<Entry<IContentful_Carousel_Item>>;
  trending: Array<Entry<IContentful_Item_Brand>>;
  defi: Array<Entry<IContentful_Item_Brand>>;
  nfts: Array<Entry<IContentful_Item_Brand>>;
  ecosystem: Array<Entry<IContentful_Item_Brand>>;
}

export interface IContentful_Item_ExploreData_V2 {
  exploreId: string;
  carouselItems: Array<Entry<IContentful_Carousel_Item>>;
  sections: Array<Entry<IContentful_Item_ExploreSection>>;
}
