// @ts-nocheck

import { AccountBuilder } from "../../core/account/AccountBuilder";
import { Signer } from "../../core/keys_and_signers/signers/Signer";
import { EthereumBlockchain } from "./EthereumBlockchain";
import { Account } from "../../core/account/Account";
import { EthereumAccount } from "./EthereumAccount";
import { NearBlockchain } from "../near/NearBlockchain";

export class EthereumAccountBuilder extends AccountBuilder {
  signerDefinitions: Signer[] = [];

  blockchain: EthereumBlockchain;

  constructor({ blockchain }: { blockchain: EthereumBlockchain }) {
    super();
    this.blockchain = blockchain;
  }

  useGeneratedSeedPhraseSigner(): Promise<AccountBuilder> {
    throw new Error("Method not implemented.");
  }

  addSigner(signer: Signer): AccountBuilder {
    return this;
  }

  build(): Account {
    this.checkNetwork();

    return new EthereumAccount({
      signers: this.signerDefinitions,
      blockchain: this.blockchain,
      id: this.id!,
      customNetworkId: this.network!.customNetworkId,
      genericNetworkId: this.network!.genericNetworkId,
    });
  }
}
