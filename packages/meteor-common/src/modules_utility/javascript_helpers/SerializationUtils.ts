import { TObjectRecord } from "../data_type_utils/ObjectUtils";

type TJsonReviver = (this: any, key: string, value: any) => any;

function reviveDateObjects(key: string | number, value: any) {
  if (isSerializedDate(value)) {
    return new Date(value);
  }

  return value;
}

// const datePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const datePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

function isSerializedDate(value: any): value is string {
  return isString(value) && value.length > 15 && value.length < 30 && datePattern.test(value);
}

function isString(value: any): value is string {
  return {}.toString.call(value) === "[object String]";
}

const urlEncodedToObject = (formData: string) => {
  let hash;

  const myJson: TObjectRecord = {};
  const hashes = formData.slice(formData.indexOf("?") + 1).split("&");

  for (let i = 0; i < hashes.length; i++) {
    hash = hashes[i].split("=");
    myJson[decodeURI(hash[0])] = decodeURI(hash[1]);
  }

  return myJson;
};

const objectToUrlEncoded = (json: TObjectRecord) => {
  let formHash: string = "";

  for (const key of Object.keys(json)) {
    formHash += `${encodeURI(key)}=${json[encodeURI(key)]}&`;
  }

  return formHash.slice(0, formHash.length - 1);
};

function serializeToNewLineDelimited(json: any[]): string {
  return json.map((j) => JSON.stringify(j)).join("\r\n");
}

function parseFromNewLineDelimited<T = any>(nlJson: string, reviver?: TJsonReviver): T[] {
  return nlJson.split("\r\n").map((line) => JSON.parse(line, reviver));
}

export const SerializationUtils = {
  JsonNewLineDelimited: {
    serialize: serializeToNewLineDelimited,
    parse: parseFromNewLineDelimited,
  },
  JsonRevivers: {
    reviveDateObjects,
  },
  Checks: {
    isSerializedDate,
  },
  UrlEncoded: {
    urlEncodedToObject,
    objectToUrlEncoded,
  },
};
