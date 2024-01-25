export interface INftCollection {
  id: string;
  title: string;
  cover_url: string;
  floor: number;
  contract: {
    key: string;
  };
  nfts: {
    attributes: { type: string; value: string }[];
    collection: { description: string };
    id: string;
    media_url: string;
    name: string;
  }[];
  totalCount: {
    aggregate: {
      count: number;
    };
  };
}
