import { createPlatformAdapter } from "../platform_adapter_utils";
import { IStorageAdapter } from "./storage.adapter.types";

const { setAdapter, getAdapter } = createPlatformAdapter<IStorageAdapter>("InsecureStorage");

export const setInsecureStorageAdapter = setAdapter;
export const getInsecureStorageAdapter = getAdapter;
