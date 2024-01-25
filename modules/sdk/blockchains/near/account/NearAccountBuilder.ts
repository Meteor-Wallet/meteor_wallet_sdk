import { AccountBuilder } from "../../../core/account/AccountBuilder.ts";
import { NearAccount } from "./NearAccount.ts";
import { NearBlockchain } from "../NearBlockchain.ts";
import { IAccountBuilder_Constructor } from "../../../core/account/AccountBuilder.interfaces.ts";
import { StringUtils } from "../../../core/utility/javascript_datatype_utils/string.utils.ts";
import { MeteorError } from "../../../core/errors/MeteorError.ts";
import { EErrorId_AccountBuilder } from "../../../core/errors/MeteorErrorIds.ts";
import { SeedPhraseSignerOrigin } from "../../../core/keys_and_signers/signer_origins/seed_phrase/SeedPhraseSignerOrigin.ts";
import { NEAR_ED25519_KEY_DERIVATION_PATH } from "../signers/near_signers.constants.ts";
import { ESignerOriginGenericType } from "../../../core/keys_and_signers/signer_origins/signer_origin.enums.ts";
import { IAccountSignerDefinition } from "../../../core/keys_and_signers/signer_origins/signer_origin.interfaces.ts";

// Builder Pattern
export class NearAccountBuilder extends AccountBuilder {
  blockchain: NearBlockchain;
  // signers: NearSigner[] = [];
  signerDefinitions: IAccountSignerDefinition[] = [];

  constructor(inputs: IAccountBuilder_Constructor<NearBlockchain>) {
    super();
    this.blockchain = inputs.blockchain;
    this.id = inputs.id;
    this.network = this.blockchain.networkManager.getNetworkById(inputs.networkId);
  }

  addSigner(signer: IAccountSignerDefinition): NearAccountBuilder {
    this.signerDefinitions.push(signer);
    return this;
  }

  async useGeneratedSeedPhraseSigner(): Promise<NearAccountBuilder> {
    const seedPhraseOrigin = await SeedPhraseSignerOrigin.generate();

    this.signerDefinitions.push({
      signerDerivation: {
        origin: seedPhraseOrigin,
        originType: ESignerOriginGenericType.seed_phrase,
        derivation: {
          path: NEAR_ED25519_KEY_DERIVATION_PATH,
        },
      },
    });
    return this;
  }

  async build(): Promise<NearAccount> {
    super.checkNetwork();

    if (this.signerDefinitions.length === 0) {
      throw MeteorError.fromId(EErrorId_AccountBuilder.account_builder_no_signers);
    }

    if (StringUtils.nullEmpty(this.id)) {
      // This is an implicit account, need to generate Near ID from public key
      const [primarySigner] = this.signerDefinitions;
      const publicKey = await this.blockchain.getPublicKeyForSignerDefinition(primarySigner);
      this.id = Buffer.from(publicKey.getKeyData().bytes()).toString("hex");
    }

    const account = new NearAccount({
      blockchain: this.blockchain,
      id: this.id!,
      customNetworkId: this.network!.customNetworkId,
      genericNetworkId: this.network!.genericNetworkId,
    });

    for (const singerDefinition of this.signerDefinitions) {
      await account.addSignerFromDefinition(singerDefinition);
    }

    return account;
  }
}
