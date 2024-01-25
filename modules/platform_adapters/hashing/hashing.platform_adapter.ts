import { createPlatformAdapter } from "../platform_adapter_utils.ts";

interface IHashingAdapter {
  hashDataSha256: (data: Uint8Array) => Promise<Uint8Array>;
  hashDataSha256Hex: (data: Uint8Array) => Promise<string>;
}

const { setAdapter, getAdapter } = createPlatformAdapter<IHashingAdapter>("hashing");

export const setHashingAdapter = setAdapter;
export const getHashingAdapter = getAdapter;
