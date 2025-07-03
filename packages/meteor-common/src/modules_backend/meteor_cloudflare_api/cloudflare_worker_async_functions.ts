import { fetchHelper } from "../../modules_utility/http_utilities/FetchHelper";
import { ISiteMetadataFromUrl } from "./cloudflare_worker_types";

interface IOGetSiteMetadata_Input {
  url: string;
}

interface IOGetSiteMetadata_Output {
  metadata: ISiteMetadataFromUrl;
}

async function getSiteMetadata(inputs: IOGetSiteMetadata_Input): Promise<IOGetSiteMetadata_Output> {
  const metadata: ISiteMetadataFromUrl = await fetchHelper.getJson(
    `https://sitemeta.meteorwallet.app?siteUrl=${inputs.url}`,
  );

  return {
    metadata,
  };
}

export const cloudflare_worker_async_functions = {
  getSiteMetadata,
};
