import { SeedPhraseSignerOrigin } from "./seed_phrase/SeedPhraseSignerOrigin";
import { HardwareWalletSignerOrigin } from "./hardware/HardwareWalletSignerOrigin";
import { ESignerOriginGenericType } from "./signer_origin.enums.ts";
import { ESignerGenericType } from "../signers/signer.enums.ts";

export interface ISeedPhraseSignerDerivation {
  originType: ESignerOriginGenericType.seed_phrase;
  origin: SeedPhraseSignerOrigin;
  derivation: {
    path: string;
  };
}

export interface IHardwareSignerDerivation {
  originType: ESignerOriginGenericType.hardware;
  origin: HardwareWalletSignerOrigin;
  derivation: {
    path: string;
  };
}

export interface INoOriginPrivateKeySignerDerivation {
  originType: ESignerOriginGenericType.no_origin_private_key;
  origin?: undefined;
  derivation: {
    privateKey: string;
  };
}

export type TSignerDerivation_All =
  | ISeedPhraseSignerDerivation
  | IHardwareSignerDerivation
  | INoOriginPrivateKeySignerDerivation;

export interface IAccountSignerDefinition {
  signerDerivation: TSignerDerivation_All;
  signerType?: ESignerGenericType.key_pair;
}
