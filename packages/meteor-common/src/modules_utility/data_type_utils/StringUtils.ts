export const StringRegex = {
  digitsRegex: /\b\d+\b/gi,
};

export const notNullEmpty = (str: string | null | undefined): str is string => {
  return str != null && str.length > 0;
};

export const nullEmpty = (str: string | null | undefined): str is null | undefined | "" => {
  return !notNullEmpty(str);
};

export const firstNotNullEmpty = (
  ...strItems: (string | null | undefined)[]
): string | undefined => {
  for (const item of strItems) {
    if (notNullEmpty(item)) {
      return item;
    }
  }

  return undefined;
};

const anyNullEmpty = (strs: Array<string | null | undefined>): boolean => {
  for (const str of strs) {
    if (nullEmpty(str)) {
      return true;
    }
  }

  return false;
};

export const safeAppend = (
  str: string | null | undefined,
  value: string,
  ifEmptyValue: string | null = null,
) => {
  return notNullEmpty(str) ? str + value : ifEmptyValue != null ? ifEmptyValue : value;
};

export class BetterStringArray extends Array<string> {
  public pushIfNotNullEmpty(str: string) {
    if (notNullEmpty(str)) {
      this.push(str);
    }
  }
}

export function createPadder(
  padCharacter: string,
  desiredTotalLength: number,
  padFromRight: boolean = false,
) {
  return (input: string | number) => {
    return pad(input, padCharacter, desiredTotalLength, padFromRight);
  };
}

export function pad(
  input: string | number,
  padCharacter: string,
  desiredTotalLength: number,
  padFromRight: boolean = false,
): string {
  const difference = desiredTotalLength - `${input}`.length;

  if (difference > 0) {
    const padding = new Array(difference).fill(padCharacter);
    if (padFromRight) {
      return `${input}${padding.join("")}`;
    }

    return `${padding.join("")}${input}`;
  }

  return `${input}`;
}

export interface IConvertToSlugOptions {
  slugDivider?: string;
  normalize?: boolean;
  letterCase?: "UPPER" | "LOWER" | "UNAFFECTED";
  excludeCharacters?: string[];
}

const regexAllSpaces = /\s+/g;
const regexDoubleDashes = /--+/g;
const regexFirstDash = /^-+/g;
const regexLastDash = /-+$/g;
const regexSingleDash = /-/g;
const regexRemoveNonWord = /[^\w\-]+/g;
const regexAllUnderscores = /_/g;

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const convertToSlug = (
  text: string,
  {
    slugDivider = "-",
    letterCase = "LOWER",
    normalize = true,
    excludeCharacters = [],
  }: IConvertToSlugOptions = {},
): string => {
  if (!text || text.length === 0) {
    return "";
  }

  let resp = text.toString();

  if (normalize) {
    resp = resp.normalize("NFD");
  }

  if (letterCase === "LOWER") {
    resp = resp.toLowerCase();
  } else if (letterCase === "UPPER") {
    resp = resp.toUpperCase();
  }

  return resp
    .replace(regexAllSpaces, "-") // Replace spaces with -
    .replace(
      excludeCharacters.length > 0
        ? new RegExp(`[^\\w\\-${excludeCharacters.map((c) => escapeRegExp(c)).join("")}]+`, "g")
        : regexRemoveNonWord,
      "",
    ) // Remove all non-word chars
    .replace(excludeCharacters.includes("_") ? regexAllSpaces : regexAllUnderscores, "-") // replace underscores with dashes
    .replace(regexDoubleDashes, "-") // Replace multiple - with single -
    .replace(regexFirstDash, "") // Trim - from start of text
    .replace(regexLastDash, "") // Trim - from end of text
    .replace(regexSingleDash, slugDivider); // Replace all - with whatever the slug divider is

  /*return resp
    .replace(/\s+/g, "-") // Replace spaces with -
    // .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/_/g, "-") // replace underscores with dashes
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, "") // Trim - from end of text
    .replace(/-/g, slugDivider); // Replace all - with whatever the slug divider is*/
};

// Replace spaces with underscores and make letters UPPERCASE:
// eg. "Some thing's" -> "SOME_THINGS"
export const stringToConstantStyledString = (input: string): string => {
  return convertToSlug(input, {
    normalize: true,
    slugDivider: "_",
    letterCase: "UPPER",
  });
  // return input.replace(/[^\w\s]/g, "").replace("/\s+/g", "_").toUpperCase();
};

const reverse = (input: string): string => {
  let r = ``;
  for (const char of input) {
    r = `${char}${r}`;
  }

  return r;
};

function isUriEncoded(uri: string) {
  uri = uri || "";
  return uri !== decodeURIComponent(uri);
}

const decodeUriFully = (uri: string): string => {
  let failSafe = 0;

  while (isUriEncoded(uri)) {
    failSafe += 1;
    uri = decodeURIComponent(uri);

    if (failSafe > 20) {
      throw new Error(
        `String Utils: Decode URI Fully: Enacted while loop too many times with attempt to decode fully.`,
      );
    }
  }

  return uri;
};

interface IRemoveAndTrimInput {
  spaceAware?: boolean;
  insideWords?: boolean;
}

const removeAndTrim = (
  input: string,
  removeText: string[],
  { spaceAware = true, insideWords = false }: IRemoveAndTrimInput = {},
): string => {
  let text = `${input}`;

  for (const rem of removeText) {
    if (spaceAware) {
      if (!insideWords) {
        if (text.indexOf(` ${rem} `) >= 0) {
          text = text.replace(` ${rem} `, " ");
        } else {
          if (text.startsWith(`${rem} `)) {
            text = text.substring(rem.length + 1);
          }

          if (text.endsWith(` ${rem}`)) {
            text = text.substring(0, text.length - (rem.length + 1));
          }
        }
      } else {
        const checkNew = [
          new RegExp(`\\s${rem}\\s`, "g"),
          new RegExp(`\\s${rem}`, "g"),
          new RegExp(`${rem}\\s`, "g"),
        ];

        for (const remNew of checkNew) {
          if (remNew.test(text)) {
            console.log(`Replacing "${remNew}" in "${text}"`);
            text = text.replace(remNew, " ");
            console.log(`Text after: "${text}"`);
          }
        }
      }
    } else {
      if (text.indexOf(rem) >= 0) {
        text = text.replace(rem, "");
      }
    }
  }

  return text.trim();
};

function sortCompareStrings(a: string, b: string): number {
  const aa = a.toLowerCase();
  const bb = b.toLowerCase();
  if (aa < bb)
    //sort string ascending
    return -1;
  if (aa > bb) return 1;
  return 0; //default return value (no sorting)
}

function comparePure(a: string, b: string) {
  if (a > b) {
    return 1;
  }

  if (a < b) {
    return -1;
  }

  return 0;
}

function onlyNotNullEmpty(strArray: (string | null | undefined)[]): string[] {
  let notNullEmptyArray: string[] = [];

  for (const str of strArray) {
    if (notNullEmpty(str)) {
      notNullEmptyArray.push(str);
    }
  }

  return notNullEmptyArray;
}

const joinIntoUrl = (...routes: (string | undefined)[]) => {
  return routes
    .filter((v) => v)
    .map((v, i, arr) => {
      const isNotFirst = i !== 0;
      const isNotLast = i !== arr.length - 1;
      if (isNotFirst) {
        v = v!.startsWith("/") ? v!.slice(1) : v;
      }
      if (isNotLast) {
        v = v!.endsWith("/") ? v!.slice(0, -1) : v;
      }
      return v;
    })
    .join("/");
};

const getUrlWithBaseUrl = (baseUrl: string, route: string) => {
  const isRouteCompleted = route.startsWith("http://") || route.startsWith("https://");
  if (isRouteCompleted) {
    return route;
  }
  return joinIntoUrl(baseUrl, route);
};
const isHashId = (accountId: string) => {
  const hash = accountId.match(/^[a-zA-Z0-9]+$/);
  return Boolean(hash);
  // accountId.match(/^[a-zA-Z0-9]{64}$/)
};

function addSpacesBetweenStrings(inputString: string): string {
  const stringWithSpaces = inputString.replace(/([A-Z])/g, " $1").trim();
  return stringWithSpaces;
}

function capitalizeFirstLetter(str: string): string {
  if (str.length === 0) {
    return str;
  }

  return `${str.slice(0, 1)}`.toUpperCase() + str.slice(1);
}

function replaceUnderscoresWithSpaces(input: string): string {
  return input.replace(/_/g, " ");
}

function withTemplate(text: string, vars: Record<string, string | number>) {
  return text.replace(/{([^}]+)}/g, (_, key) => `${vars[key]}`);
}

function wordLimiter(str?: string): string | undefined {
  if (str === undefined) {
    return undefined;
  }
  if (str === "") {
    return undefined;
  }

  if (str.length <= 20) {
    return str;
  }
  return str.slice(0, 5) + "..." + str.slice(-5);
}

export const StringUtils = {
  wordLimiter,
  isUriEncoded,
  decodeUriFully,
  StringRegex,
  reverse,
  notNullEmpty,
  nullEmpty,
  anyNullEmpty,
  safeAppend,
  createPadder,
  pad,
  convertToSlug,
  stringToConstantStyledString,
  removeAndTrim,
  sortCompareStrings,
  comparePure,
  onlyNotNullEmpty,
  firstNotNullEmpty,
  joinIntoUrl,
  getUrlWithBaseUrl,
  isHashId,
  addSpacesBetweenStrings,
  capitalizeFirstLetter,
  replaceUnderscoresWithSpaces,
  withTemplate,
};
