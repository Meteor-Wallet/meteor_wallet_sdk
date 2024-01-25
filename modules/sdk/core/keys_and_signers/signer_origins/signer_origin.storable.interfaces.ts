import { ESignerOriginGenericType } from "./signer_origin.enums.ts";

export interface ISignerOriginStorableData {
  originType: ESignerOriginGenericType;
}

export interface IHardwareSignerOriginStorableData extends ISignerOriginStorableData {
  originType: ESignerOriginGenericType.hardware;
  publicKeyBase64: string;
}

export interface ISeedPhraseSignerOriginStorableData extends ISignerOriginStorableData {
  originType: ESignerOriginGenericType.seed_phrase;
  seedPhrase: string;
}

export interface INoOriginPrivateKeyDerivationStorableData extends ISignerOriginStorableData {
  originType: ESignerOriginGenericType.no_origin_private_key;
  derivation: {
    privateKey: string;
  };
}

export interface IHardwareSignerDerivationStorableData extends IHardwareSignerOriginStorableData {
  derivation: {
    path: string;
  };
}

export interface ISeedPhraseSignerDerivationStorableData
  extends ISeedPhraseSignerOriginStorableData {
  derivation: {
    path: string;
  };
}

export type TSignerDerivation_All_StorableData =
  | IHardwareSignerDerivationStorableData
  | ISeedPhraseSignerDerivationStorableData
  | INoOriginPrivateKeyDerivationStorableData;
