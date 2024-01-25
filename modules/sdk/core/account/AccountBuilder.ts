import { Account } from "./Account";
import { Blockchain } from "../blockchain/Blockchain";
import { BlockchainNetwork } from "../blockchain/network/BlockchainNetwork";
import { MeteorError } from "../errors/MeteorError";
import { EErrorId_AccountBuilder } from "../errors/MeteorErrorIds";
import { IAccountSignerDefinition } from "../keys_and_signers/signer_origins/signer_origin.interfaces.ts";

export abstract class AccountBuilder {
  abstract blockchain: Blockchain;
  protected id?: string;
  protected network?: BlockchainNetwork;
  abstract signerDefinitions: IAccountSignerDefinition[];

  abstract addSigner(signer: IAccountSignerDefinition): AccountBuilder;
  abstract useGeneratedSeedPhraseSigner(): Promise<AccountBuilder>;

  protected checkNetwork() {
    if (this.network == null) {
      throw MeteorError.fromId(EErrorId_AccountBuilder.account_builder_no_network);
    }
  }

  abstract build(): Promise<Account>;
}
