import { Entry } from "contentful";
import {
  IExploreBrandItem,
  IExploreCarouselItem,
  IExploreSection,
} from "../../../modules_feature/explore/explore_types";
import { contentful_utils } from "../contentful_utils";
import {
  IContentful_Carousel_Item,
  IContentful_Item_Brand,
  IContentful_Item_ExploreSection,
} from "./contentful_meteor_types";

const composeSectionBrandItem = (item: Entry<IContentful_Item_Brand>): IExploreBrandItem => {
  return {
    title: item.fields.brandName,
    icon: contentful_utils.formatContentfulFileUrl(item.fields.brandIcon.fields.file.url),
    url: item.fields.brandWebsiteUrl,
    description: item.fields.shortDescription ?? "",
  };
};

const composeCarouselItem = (item: Entry<IContentful_Carousel_Item>): IExploreCarouselItem => {
  return {
    url: item.fields.url,
    image: contentful_utils.formatContentfulFileUrl(item.fields.image.fields.file.url),
  };
};

const composeSection = (item: Entry<IContentful_Item_ExploreSection>): IExploreSection => {
  return {
    heading: item.fields.sectionHeading,
    icon: contentful_utils.formatContentfulFileUrl(item.fields.sectionIcon.fields.file.url),
    brands: item.fields.brands.map(composeSectionBrandItem),
    showDescription: item.fields.showBrandDescription,
  };
};

export const contentful_meteor_dataAdapter = {
  composeSectionBrandItem,
  composeCarouselItem,
  composeSection,
};
