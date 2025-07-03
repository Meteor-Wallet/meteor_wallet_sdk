const regex_match_ipfs = /(Qm[1-9A-Za-z]+[^OIl])(\/|$)(.+)?/;

const CLOUDFLARE_IPFS_BASE_URL = "https://ipfs.io/ipfs";

function attemptConversionToCloudflareIpfsCacheUrl(url: string): string {
  const matches = url.match(regex_match_ipfs);

  if (matches != null) {
    let ipfsId = matches[1];
    let resource = matches[3];

    if (ipfsId[ipfsId.length - 1] === "/") {
      ipfsId = ipfsId.slice(0, -1);
    }

    if (resource != null) {
      return `${CLOUDFLARE_IPFS_BASE_URL}/${ipfsId}/${resource}`;
    } else {
      return `${CLOUDFLARE_IPFS_BASE_URL}/${ipfsId}`;
    }
  }

  return url;
}

/**
 * Will return empty string if media is empty
 * Else, return a valid cloudflare link
 */
function getCloudflareIpfsUrlFromMedia(media: string = ""): string {
  return `${CLOUDFLARE_IPFS_BASE_URL}/${media}`;
}

export const IpfsUtils = {
  attemptConversionToCloudflareIpfsCacheUrl,
  getCloudflareIpfsUrlFromMedia,
};
