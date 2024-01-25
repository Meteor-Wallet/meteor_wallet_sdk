import { createPlatformAdapter } from "../platform_adapter_utils";

interface IBip39Adapter {
  generateMnemonic: (wordList: string[]) => Promise<string>;
  mnemonicToSeed: (seedPhrase: string) => Promise<Uint8Array>;
}

const { setAdapter, getAdapter } = createPlatformAdapter<IBip39Adapter>("Bip39");

export const setBip39Adapter = setAdapter;
export const getBip39Adapter = getAdapter;
