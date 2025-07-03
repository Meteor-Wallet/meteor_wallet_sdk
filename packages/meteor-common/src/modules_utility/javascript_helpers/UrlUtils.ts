const regex_isAbsoluteUrl = /^(?:[a-z+]+:)?\/\//i;

function isAbsoluteUrl(url: string): boolean {
  return regex_isAbsoluteUrl.test(url);
}

function addPathToUrlBase(urlBase: string, relativePathPart: string): string {
  if (relativePathPart.startsWith("./") || relativePathPart.startsWith(".\\")) {
    relativePathPart = relativePathPart.slice(2);
  } else if (relativePathPart.startsWith("/")) {
    relativePathPart = relativePathPart.slice(1);
  }

  if (urlBase.endsWith("/")) {
    urlBase = urlBase.slice(0, -1);
  }

  return `${urlBase}/${relativePathPart}`;
}

function absoluteOrAddToBaseUrl(baseUrl: string, absoluteOrRelativePath: string): string {
  if (isAbsoluteUrl(absoluteOrRelativePath)) {
    return absoluteOrRelativePath;
  }

  return addPathToUrlBase(baseUrl, absoluteOrRelativePath);
}

function filterSearchParams(searchParamsString, keysToRemove) {
  const urlSearchParams = new URLSearchParams(searchParamsString);

  const filteredParams = new URLSearchParams();
  for (const [key, value] of urlSearchParams.entries()) {
    if (!keysToRemove.includes(key)) {
      filteredParams.append(key, value);
    }
  }

  const paramsObject = {};
  for (const [key, value] of filteredParams.entries()) {
    paramsObject[key] = value;
  }

  if (Object.values(paramsObject).length) {
    return paramsObject;
  }

  return "";
}

export const UrlUtils = {
  isAbsoluteUrl,
  addPathToUrlBase,
  absoluteOrAddToBaseUrl,
  filterSearchParams,
};
