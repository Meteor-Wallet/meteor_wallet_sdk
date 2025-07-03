import { ContentfulClientApi, createClient } from "contentful";

const clientStore: {
  client?: ContentfulClientApi;
} = {};

export function getContentfulClient(): ContentfulClientApi {
  if (!clientStore.client) {
    clientStore.client = createClient({
      space: "gmz6skvp7cfa",
      accessToken: "sYJv5J6LPdkjKuoGa2iFIS3KrBJJgYRfamSbz9o3H38",
      host: "cdn.contentful.com",
    });
  }

  return clientStore.client;
}
