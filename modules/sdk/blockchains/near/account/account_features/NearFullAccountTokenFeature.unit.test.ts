import { token_utils } from "../../../../core/assets/token/token.utils.ts";
import { EGenericBlockchainNetworkId } from "../../../../core/blockchain/network/blockchain_network.enums.ts";
import { SeedPhraseSignerOrigin } from "../../../../core/keys_and_signers/signer_origins/seed_phrase/SeedPhraseSignerOrigin.ts";
import { NearBlockchain } from "../../NearBlockchain.ts";
import { NearTokenAmount } from "../../assets/NearTokenAmount.ts";
import { near_testnet_network } from "../../network/near_network.static.ts";
import { NearTransaction } from "../../transactions/NearTransaction.ts";
import { NearFullAccountTokenFeature } from "./NearFullAccountTokenFeature.ts";
import { EAccountFeature } from "../../../../core/account/features/account_feature.enums.ts";
import { ESignerOriginGenericType } from "../../../../core/keys_and_signers/signer_origins/signer_origin.enums.ts";
import { NearAccount } from "../NearAccount.ts";

const nearBlockchain = new NearBlockchain();

const createNearAccount = async (): Promise<NearAccount> => {
  const nearBlockchain = new NearBlockchain();
  const testnet = nearBlockchain.networkManager.createNetwork(near_testnet_network);
  nearBlockchain.networkManager.addNetwork(testnet);

  const seedPhraseOrigin = await SeedPhraseSignerOrigin.generate();

  const account = await nearBlockchain
    .getAccountBuilder({ networkId: EGenericBlockchainNetworkId.testnet })
    .addSigner({
      signerDerivation: {
        originType: ESignerOriginGenericType.seed_phrase,
        origin: seedPhraseOrigin,
        derivation: {
          path: nearBlockchain.getDefaultSeedphraseDerivationPath(),
        },
      },
    })
    .build();

  return account;
};

describe("NearAccountTokenFeature", () => {
  it("should able to getAvailableTokens", async () => {
    const account = await createNearAccount();

    const nearAccountTokenFeature = new NearFullAccountTokenFeature(account);

    const tokenAmountList = await nearAccountTokenFeature.getAvailableTokenAmounts();

    expect(tokenAmountList.every((e) => e instanceof NearTokenAmount)).toBeTruthy();

    const nearTokenAmount = tokenAmountList.find((ta) => ta.token.id === "near");

    expect(nearTokenAmount).not.toEqual("undefined");
  });

  it("should able to createTokenTransferTransaction", async () => {
    const account = await createNearAccount();
    const nearTokenFeature = account.getFeature(EAccountFeature.token);

    const tokenAmountList = await nearTokenFeature.getAvailableTokenAmounts();
    const nearTokenAmount = tokenAmountList.find((ta) => ta.token.id === "near");

    if (nearTokenAmount) {
      const transaction = nearTokenFeature.createTokenTransferTransaction({
        receiver: {
          basic: nearBlockchain.createBasicAccount({
            id: "zigang2.testnet",
            networkId: EGenericBlockchainNetworkId.testnet,
          }),
        },
        tokenAmount: new NearTokenAmount({
          cryptoInteger: token_utils.convertReadableAmountToCryptoInteger(
            "1.0",
            nearTokenAmount.token.decimals,
          ),
          token: nearTokenAmount.token,
        }),
      });

      console.log(transaction.senderAccount);

      expect(transaction instanceof NearTransaction).toBeTruthy();
      expect(transaction.receiverAccount.basic.id).toEqual("zigang2.testnet");
    }
  });
});
