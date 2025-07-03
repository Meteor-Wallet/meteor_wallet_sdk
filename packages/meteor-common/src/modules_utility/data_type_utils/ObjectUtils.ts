import * as _ from "lodash";

export type TObjectRecord = Record<string | number, unknown>;

export function getNullMembersShallow(checkObject: TObjectRecord): string[] {
  const nullMembers: string[] = [];

  for (const key of Object.keys(checkObject)) {
    if (checkObject[key] == null) {
      nullMembers.push(key);
    }
  }

  return nullMembers;
}

export function deepAssign<T extends object>(mainObject: object, ...sourceObject: object[]): T {
  return _.merge(mainObject, ...sourceObject);
}

function updateFieldsOnObject<T extends TObjectRecord>(
  prevObject: T,
  fields: string[],
  newValues: any,
  originalMustHaveField: boolean = true,
): T {
  const response: TObjectRecord = Object.assign({}, prevObject);

  for (const field of fields) {
    if (newValues.hasOwnProperty(field)) {
      if (originalMustHaveField && !response.hasOwnProperty(field)) {
        throw new Error(
          `Trying to update field "${field}" onto an object - but the field does not exist on the original!\n Only found the following fields: ${Object.keys(
            prevObject,
          ).join(", ")}`,
        );
      }

      response[field] = newValues[field];
    } else {
      throw new Error(
        `Trying to update field "${field}" from an object of updated values - but the field was not found!\n Only found the following fields: ${Object.keys(
          newValues,
        ).join(", ")}`,
      );
    }
  }

  return response as T;
}

function isObject(a: any) {
  return !!a && a.constructor === Object;
}

interface ISpacerConfig {
  spacer?: string;
  useKeyValueSymbols?: boolean;
}

interface IOCreateStringTagFromObjectInput {
  input: any;
  spacerConfig?: ISpacerConfig;
  keySortFunction?: (a: string, b: string) => number;
  _isInner?: boolean;
}

function createFullStringTagFromObject({
  input,
  keySortFunction,
  spacerConfig: { spacer = "~", useKeyValueSymbols = true } = {},
  _isInner = false,
}: IOCreateStringTagFromObjectInput): string {
  let fullKey = ``;

  if (input == null) {
    throw new Error(`Can't create string tag from object that is null or undefined`);
  }

  const sortedKeys =
    keySortFunction != null ? Object.keys(input).sort(keySortFunction) : Object.keys(input).sort();

  for (const key of sortedKeys) {
    const firstSpacer = _isInner || fullKey.length > 0;

    if (_.isPlainObject(input[key]) && Object.keys(input[key]).length > 0) {
      fullKey = `${fullKey}${
        useKeyValueSymbols
          ? `${spacer}k${spacer}${key}${spacer}o`
          : `${firstSpacer ? `~` : ""}${key}`
      }${createFullStringTagFromObject({
        input: input[key],
        spacerConfig: { spacer, useKeyValueSymbols },
        keySortFunction,
        _isInner: true,
      })}`;
    } else if (
      input[key] !== undefined &&
      (typeof input[key] === "string" ||
        typeof input[key] === "number" ||
        typeof input[key] === "boolean")
    ) {
      fullKey = `${fullKey}${
        useKeyValueSymbols
          ? `${spacer}k${spacer}${key}${spacer}v${spacer}`
          : `${firstSpacer ? `~` : ""}${key}${spacer}`
      }${input[key]}`;
    }
  }

  return fullKey;
}

export interface IOCreateMultipleStringTagsFromObjectInput
  extends IOCreateStringTagFromObjectInput {
  depth?: number | null;
  separateKeys?: boolean;
  prefix?: string;
}

function createMultipleStringTagsFromObject({
  input,
  keySortFunction,
  spacerConfig: { spacer = `~`, useKeyValueSymbols = true } = {},
  depth = null,
  separateKeys = true,
  prefix = ``,
  _isInner = false,
}: IOCreateMultipleStringTagsFromObjectInput): string[] {
  const keys: string[] = [];

  if (input == null) {
    throw new Error(`Can't create string tag from object that is null or undefined`);
  }

  const sortedKeys =
    keySortFunction !== null ? Object.keys(input).sort(keySortFunction) : Object.keys(input).sort();

  for (const k of sortedKeys) {
    if (separateKeys) {
      keys.push(
        `${prefix}${useKeyValueSymbols ? `${spacer}k${spacer}` : _isInner ? spacer : ""}${k}`,
      );
    }

    if (_.isPlainObject(input[k]) && Object.keys(input[k]).length > 0) {
      keys.push(
        ...createMultipleStringTagsFromObject({
          input: input[k],
          prefix: `${prefix}${
            useKeyValueSymbols ? `${spacer}k${spacer}` : _isInner ? spacer : ""
          }${k}${spacer}${useKeyValueSymbols ? "o" : ""}`,
          spacerConfig: {
            spacer,
            useKeyValueSymbols,
          },
          keySortFunction,
          separateKeys,
        }),
      );
      // key = `${key}${spacer}k${spacer}${k}${spacer}o${createFullStringTagFromObject({ input: input[k], spacer, keySortFunction })}`;
    } else if (
      input[k] !== undefined &&
      (typeof input[k] === "string" ||
        typeof input[k] === "number" ||
        typeof input[k] === "boolean")
    ) {
      keys.push(
        `${prefix}${
          useKeyValueSymbols ? `${spacer}k${spacer}` : _isInner ? spacer : ""
        }${k}${useKeyValueSymbols ? `${spacer}v` : ""}${spacer}${input[k]}`,
      );
    }
  }

  return keys;
}

/**
 * (Undefined) Filter Map on Object Values
 * @param objectToMap {Object} The object to map over the key / values of
 * @param ufmapFunc {function} (Undefined) Filter map function. Return
 * 'undefined' to exclude the key / value in the resulting object
 */
function ufMap<O = any>(
  objectToMap: any,
  ufmapFunc: (value: any, key: string, index: number) => any,
): O {
  return Object.keys(objectToMap).reduce((newObj: any, key, ind) => {
    const value = ufmapFunc(objectToMap[key], key, ind);

    if (value !== undefined) {
      newObj[key] = value;
    }

    return newObj;
  }, {} as O);
}

function keyFromObject(obj: any) {
  if (obj === null) {
    return "(n)";
  }

  const typeOf = typeof obj;

  if (typeOf !== "object") {
    if (typeOf === "undefined") {
      return "(u)";
    } else if (typeOf === "string") {
      return ":" + obj + ";";
    } else if (typeOf === "boolean" || typeOf === "number") {
      return "(" + obj + ")";
    }
  }

  let prefix = "{";

  for (const key of Object.keys(obj).sort()) {
    prefix += key + keyFromObject(obj[key]);
  }

  return prefix + "}";
}

export const emptyObject: any = {};

function pickValueByStructure<T, S extends Partial<T> = Partial<T>>(
  obj: { [str: string]: T },
  structure: S,
): T | undefined {
  const matchFunc = _.matches(structure);

  for (const val of Object.values(obj)) {
    if (matchFunc(val)) {
      return val;
    }
  }
}

function pick<T extends object, K extends keyof T>(input: T, keys: K[]): Pick<T, K> {
  const resp: any = {};
  keys.forEach((key) => {
    resp[key] = input[key];
  });
  return resp;
}

export function notNullEmptyObject<T extends object = object>(
  input: T | null | undefined,
): input is T {
  return input != null && typeof input === "object" && Object.keys(input).length > 0;
}

const notExceptAnything = () => false;

const camelize = (
  obj: Record<string, unknown>,
  except: (
    acc: Record<string, unknown>,
    value: unknown,
    key: string,
    target,
  ) => boolean = notExceptAnything,
) =>
  _.transform(obj, (acc: Record<string, unknown>, value: unknown, key: string, target) => {
    if (except(acc, value, key, target)) {
      acc[key] = value;
      return;
    }
    const camelKey = _.isArray(target) ? key : _.camelCase(key);
    acc[camelKey] = _.isObject(value) ? camelize(value as Record<string, unknown>, except) : value;
  });

const isBeanEqual = (obj1, obj2) => {
  return _.isEqual(obj1, obj2);
};

function convertObjectPropertyNames(
  obj: object,
  convertMap: { [key: string]: string },
  throwOnMiss: boolean = true,
) {
  const newObject: any = {};

  for (const key in obj) {
    if (convertMap[key] != null) {
      newObject[convertMap[key]] = obj[key];
    } else if (throwOnMiss) {
      throw new Error(
        `Tried to convert object property name from "${key}" - but didn't find any new corresponding property name`,
      );
    }
  }

  return newObject;
}

export const ObjectUtils = {
  pick,
  convertObjectPropertyNames,
  updateFieldsOnObject,
  getNullMembersShallow,
  deepAssign,
  isObject,
  ufMap,
  createFullStringTagFromObject,
  createMultipleStringTagsFromObject,
  keyFromObject,
  pickValueByStructure,
  notNullEmptyObject,
  camelize,
  isBeanEqual,
};
