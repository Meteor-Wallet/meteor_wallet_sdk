import { METEOR_GLOBAL_HASH_END, METEOR_GLOBAL_HASH_START } from "./hashing.constants.ts";
import { getHashingAdapter } from "../../../../platform_adapters/hashing/hashing.platform_adapter.ts";

const hashAdapter = getHashingAdapter();

async function hashText(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  return hashAdapter.hashDataSha256Hex(data);
}

async function hashTextWithMeteorPadding(
  text: string,
  options: { maxOutputLength?: number } = {},
): Promise<string> {
  const data = new TextEncoder().encode(
    `${METEOR_GLOBAL_HASH_START}${text}${METEOR_GLOBAL_HASH_END}`,
  );
  const output = await hashAdapter.hashDataSha256Hex(data);
  return options.maxOutputLength ? output.slice(0, options.maxOutputLength) : output;
}

async function hashTextForStorageKey(text: string): Promise<string> {
  return await hashTextWithMeteorPadding(text, { maxOutputLength: 32 });
}

async function hashObjectForStorageKey<
  O extends { [key: string]: string | number | boolean | undefined },
>(obj: O): Promise<string> {
  let str = "";

  const keys: (keyof O)[] = Object.keys(obj) as (keyof O)[];
  keys.sort();

  for (const key of keys) {
    str += `${key as string}:${obj[key]};`;
  }

  return hashTextForStorageKey(str);
}

export const hash_utils = {
  hashText,
  hashTextWithMeteorPadding,
  hashTextForStorageKey,
  hashObjectForStorageKey,
};
