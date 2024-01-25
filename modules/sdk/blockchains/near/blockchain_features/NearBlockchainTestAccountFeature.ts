import { IBlockchainTestAccountFeature } from "../../../core/blockchain/features/blockchain_feature.test_account.interfaces.ts";
import { NearBlockchain } from "../NearBlockchain.ts";
import { NearAccount } from "../account/NearAccount.ts";
import { EGenericBlockchainNetworkId } from "../../../core/blockchain/network/blockchain_network.enums.ts";
import { MeteorError, MeteorInternalError } from "../../../core/errors/MeteorError.ts";
import { StringUtils } from "../../../core/utility/javascript_datatype_utils/string.utils.ts";
import { EErrorId_Account } from "../../../core/errors/MeteorErrorIds.ts";

export class NearBlockchainTestAccountFeature implements IBlockchainTestAccountFeature {
  blockchain: NearBlockchain;

  constructor(blockchain: NearBlockchain) {
    this.blockchain = blockchain;
  }

  async generateTestAccount(incomingId?: string): Promise<NearAccount> {
    const randomNumber = Math.floor(
      Math.random() * (99999999999999 - 10000000000000) + 10000000000000,
    );
    const id = StringUtils.notNullEmpty(incomingId)
      ? incomingId
      : `dev-${Date.now()}-${randomNumber}`;

    const builder = this.blockchain.getAccountBuilder({
      id,
      networkId: EGenericBlockchainNetworkId.testnet,
    });
    await builder.useGeneratedSeedPhraseSigner();
    const account = await builder.build();

    if (await account.state().checkExistence()) {
      throw MeteorError.fromId(EErrorId_Account.account_already_exists_on_chain, account.basic);
    }

    const response = await fetch("https://helper.testnet.near.org/account", {
      method: "POST",
      body: JSON.stringify({
        newAccountId: account.basic.id,
        newAccountPublicKey: account.getPrimarySigner().getPrefixedPublicKeyString(),
      }),
    });

    if (!response.ok) {
      throw new MeteorInternalError(
        `Failed to create test account: account_id[${account.basic.id}] response_status[${
          response.status
        }] response_body[${await response.text()}]`,
      );
    }

    return account;
  }

  async generateTestAccounts(num: number): Promise<NearAccount[]> {
    const accountPromises: Promise<NearAccount>[] = [];

    for (let i = 0; i < num; i++) {
      accountPromises.push(this.generateTestAccount());
    }

    return Promise.all(accountPromises);
  }
}
