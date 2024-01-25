import { NearBasicAccount } from "../NearBasicAccount.ts";
import { ListManager } from "../../../../core/utility/managers/list_manager/ListManager.ts";
import { NearTokenAmount } from "../../assets/NearTokenAmount.ts";
import { EAccountFeature } from "../../../../core/account/features/account_feature.enums.ts";
import { IWithBasicAccount } from "../../../../core/account/account.interfaces.ts";
import { IBasicAccountTokenFeature } from "../../../../core/account/features/account_feature.token.interfaces.ts";
import { MeteorError } from "../../../../core/errors/MeteorError.ts";
import { EErrorId_Account, EErrorId_Token } from "../../../../core/errors/MeteorErrorIds.ts";
import { NearBlockchain } from "../../NearBlockchain.ts";
import { getKitWalletApi } from "../../external_apis/kitwallet/KitWalletApi.ts";
import { NearToken } from "../../assets/NearToken.ts";
import { IWithToken } from "../../../../core/assets/token/Token.interfaces.ts";
import { INearFungibleTokenMetadata } from "../../near_native/standards/fungible_token_standard.types.ts";
import { getRefFinanceApi } from "../../external_apis/ref_finance/RefFinanceApi.ts";

export class NearBasicAccountTokenFeature implements IBasicAccountTokenFeature {
  accountTokenAmounts: ListManager<NearTokenAmount, IWithToken> = new ListManager<
    NearTokenAmount,
    IWithToken
  >();
  account: IWithBasicAccount<NearBasicAccount>;
  blockchain: NearBlockchain;
  basicAccount: NearBasicAccount;
  id: EAccountFeature.token = EAccountFeature.token;

  constructor(account: IWithBasicAccount<NearBasicAccount>) {
    this.account = account;
    this.basicAccount = account.basic;
    this.blockchain = account.basic.blockchain;
  }

  async getAvailableNativeTokenAmount(): Promise<NearTokenAmount> {
    const rpcProvider = this.account.basic.getRpcProvider();
    const state = await rpcProvider.viewAccount({ account_id: this.basicAccount.id });

    if (state.error) {
      throw MeteorError.fromId(EErrorId_Account.account_not_found_on_chain);
    }

    const token = this.blockchain.getNativeToken(this.basicAccount.getNetworkId());

    console.log(state);

    if (this.accountTokenAmounts.includes({ token })) {
      const amount = this.accountTokenAmounts.get({ token });
      amount.cryptoInteger = state.result.amount;
      return amount;
    }

    const newTokenAmount = new NearTokenAmount({
      cryptoInteger: state.result.amount,
      token: this.blockchain.getNativeToken(this.basicAccount.getNetworkId()),
    });

    this.accountTokenAmounts.add(newTokenAmount);

    return newTokenAmount;
  }

  async getAvailableTokenAmount(tokenOrId: string | NearToken): Promise<NearTokenAmount> {
    if (!(tokenOrId instanceof NearToken)) {
      tokenOrId = await this.blockchain.token().getToken({
        id: tokenOrId,
        networkId: this.basicAccount.getNetworkId(),
      });
    }

    if (tokenOrId.isNative) {
      return this.getAvailableNativeTokenAmount();
    }

    if (this.accountTokenAmounts.includes({ token: tokenOrId })) {
      const { result } = await this.basicAccount.getRpcProvider().callFunctionObjectArgs<string>({
        account_id: tokenOrId.id,
        method_name: "ft_balance_of",
        args: {
          account_id: this.basicAccount.id,
        },
      });
      const amount = this.accountTokenAmounts.get({ token: tokenOrId });
      amount.cryptoInteger = result;
      return amount;
    }

    const tokenAmount = tokenOrId.toTokenAmount({
      isCryptoInteger: false,
      value: "0",
    });

    this.accountTokenAmounts.add(tokenAmount);

    return tokenAmount;
  }

  async getAvailableTokens(): Promise<NearToken[]> {
    const kitwalletApi = getKitWalletApi(this.basicAccount.getNetworkId());

    // it can be empty array if user don't have any ft tokens
    const userFtTokenIds = await kitwalletApi.getUserTokenList(this.basicAccount.id);

    const refFinanceApi = getRefFinanceApi(this.basicAccount.getNetworkId());
    const allTokenPrice = await refFinanceApi.getAllTokenPriceList();

    const ftTokens = (
      await Promise.all(
        userFtTokenIds.map(async (tokenId) => {
          try {
            return await this.blockchain.token().getToken({
              id: tokenId,
              networkId: this.basicAccount.getNetworkId(),
              dollarPrice: allTokenPrice[tokenId]?.price,
            });
          } catch (e) {
            if (e instanceof MeteorError && e.has(EErrorId_Token.invalid_token_contract)) {
              console.warn(`Token "${tokenId}" is invalid, skipping...`);
              return null;
            }

            throw e;
          }
        }),
      )
    ).filter((token) => token != null) as NearToken[];

    const allTokens = [
      this.blockchain.getNativeToken(this.basicAccount.getNetworkId()),
      ...ftTokens,
    ];

    for (const token of allTokens) {
      if (!this.accountTokenAmounts.includes({ token })) {
        const tokenAmount = new NearTokenAmount({
          cryptoInteger: "0",
          token,
        });

        this.accountTokenAmounts.add(tokenAmount);
      }
    }

    return allTokens;
  }

  async getAvailableTokenAmounts(): Promise<NearTokenAmount[]> {
    const accountTokens = await this.getAvailableTokens();

    const tokenPromises = accountTokens.map(async (token) => {
      return this.getAvailableTokenAmount(token);
    });

    return Promise.all(tokenPromises);
  }
}
