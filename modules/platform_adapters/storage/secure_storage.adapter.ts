import { createPlatformAdapter } from "../platform_adapter_utils";
import { IStorageAdapter } from "./storage.adapter.types";

const { setAdapter, getAdapter } = createPlatformAdapter<IStorageAdapter>("SecureStorage");

export const setSecureStorageAdapter = setAdapter;
export const getSecureStorageAdapter = getAdapter;
