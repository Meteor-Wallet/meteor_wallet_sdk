import { initializeBlockchains } from "../../blockchains/initializeBlockchains.ts";
import { Account } from "../account/Account.ts";
import { Blockchain } from "../blockchain/Blockchain.ts";
import { EGenericBlockchainNetworkId } from "../blockchain/network/blockchain_network.enums.ts";
import { ESignerGenericType } from "../keys_and_signers/signers/signer.enums.ts";
import { ESignerOriginGenericType } from "../keys_and_signers/signer_origins/signer_origin.enums.ts";
import { SeedPhraseSignerOrigin } from "../keys_and_signers/signer_origins/seed_phrase/SeedPhraseSignerOrigin.ts";
import { BlockchainTransaction } from "./BlockchainTransaction.ts";
import { NearTransaction } from "../../blockchains/near/transactions/NearTransaction.ts";
import { actionCreators } from "@near-js/transactions";
import BN from "bn.js";
import { token_utils } from "../assets/token/token.utils.ts";
import util from "util";

Object.assign(global, { TextDecoder: util.TextDecoder, TextEncoder: util.TextEncoder });

async function createAccount(blockchain: Blockchain): Promise<Account> {
  const builder = blockchain.getAccountBuilder({
    id: "pebbledev.testnet",
    networkId: EGenericBlockchainNetworkId.testnet,
  });

  builder.addSigner({
    signerType: ESignerGenericType.key_pair,
    signerDerivation: {
      originType: ESignerOriginGenericType.seed_phrase,
      origin: new SeedPhraseSignerOrigin({
        seedPhrase: "leaf term saddle seven moment yellow arrest excuse enough scheme dove expect",
      }),
      derivation: {
        path: blockchain.getDefaultSeedphraseDerivationPath(),
      },
    },
  });

  return await builder.build();
}

function createNativeTransferTransaction(
  blockchain: Blockchain,
  account: Account,
): BlockchainTransaction {
  return account.tokens().createTokenTransferTransaction({
    tokenAmount: blockchain.getNativeToken(EGenericBlockchainNetworkId.testnet).toTokenAmount({
      value: "0.001",
      isCryptoInteger: false,
    }),
    receiver: {
      basic: blockchain.createBasicAccount({
        id: "pebbletest.testnet",
        networkId: EGenericBlockchainNetworkId.testnet,
      }),
    },
  });
}

describe("Transactions", () => {
  it("Should be able to create a native token transaction", async () => {
    const [blockchain] = initializeBlockchains();
    const account = await createAccount(blockchain);

    const transaction = createNativeTransferTransaction(blockchain, account);

    const nearTransaction: NearTransaction = transaction as NearTransaction;

    expect(nearTransaction.actions).toEqual([
      actionCreators.transfer(
        new BN(token_utils.convertReadableAmountToCryptoInteger("0.001", 24)),
      ),
    ]);
  });
});
