import { SignerOrigin } from "../SignerOrigin";
import { seed_phrase_utils } from "./seed_phrase.utils";
import { ESignerOriginGenericType } from "../signer_origin.enums.ts";
import { IStorable } from "../../../utility/data_entity/storable/storable.interfaces.ts";
import { hash_utils } from "../../../utility/hashing/hashing.utils.ts";
import { ISeedPhraseSignerOriginStorableData } from "../signer_origin.storable.interfaces.ts";

export class SeedPhraseSignerOrigin
  extends SignerOrigin
  implements IStorable<ISeedPhraseSignerOriginStorableData>
{
  readonly storableUniqueKey: Promise<string>;
  signerOriginType = ESignerOriginGenericType.seed_phrase;

  // Seed phrase signer properties
  seedPhrase: string;

  constructor({ seedPhrase }: { seedPhrase: string }) {
    super();
    this.seedPhrase = seed_phrase_utils.normalizeSeedPhrase(seedPhrase);
    this.storableUniqueKey = this.getStorableUniqueKey();
  }

  getStorableData(): ISeedPhraseSignerOriginStorableData {
    return {
      originType: ESignerOriginGenericType.seed_phrase,
      seedPhrase: this.seedPhrase,
    };
  }

  getStorableUniqueKey(): Promise<string> {
    return hash_utils.hashTextForStorageKey(this.seedPhrase);
  }

  static async generate() {
    return new SeedPhraseSignerOrigin({
      seedPhrase: await seed_phrase_utils.generateSeedPhrase(),
    });
  }

  isEqualToOwnType(signerOrigin: SeedPhraseSignerOrigin): boolean {
    return this.seedPhrase === signerOrigin.seedPhrase;
  }
}
