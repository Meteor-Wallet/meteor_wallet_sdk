import { Account } from "@near-js/accounts";
import { PublicKey } from "@near-js/crypto";
import { getAppEnvHelper } from "../../modules_app_core/env/app_env_helper";
import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";
import { FetchHelper } from "../../modules_utility/http_utilities/FetchHelper";
import { THelperLikelyNftsResult } from "./near_helper_api_types";

export class NearHelper extends FetchHelper {
  private readonly current_network: ENearNetwork;

  constructor(network: ENearNetwork) {
    super();
    this.current_network = network;
  }

  get networkId() {
    return this.current_network;
  }

  getHelperUrl() {
    return `${getAppEnvHelper().getBackendApiBaseUrl()}/api/${this.current_network}/helper`;
  }

  getBaseUrl() {
    return this.getHelperUrl() ?? "";
  }

  private async signatureFor(account: Account) {
    const { accountId, connection } = account;
    const block = await account.connection.provider.block({
      finality: "final",
    });
    const blockNumber = block.header.height.toString();
    const signer = account.connection.signer;
    const signed = await signer.signMessage(
      Buffer.from(blockNumber),
      accountId,
      connection.networkId,
    );
    const blockNumberSignature = Buffer.from(signed.signature).toString("base64");
    return { blockNumber, blockNumberSignature };
  }

  /**
   * Some of the api (especially under /account ) need a signature to ensure privilege
   * @param path
   * @param data
   * @param account
   * @returns
   */
  async postSignedJson(path: string, data: any, account: Account) {
    return await this.postJson(path, {
      ...data,
      ...(await this.signatureFor(account)),
    });
  }

  async createAccountOnTestnet(newAccountId: string, newAccountPublicKey: PublicKey | string) {
    if (this.current_network !== ENearNetwork.testnet) {
      throw new Error(
        "Can't use helper method createAccount() when not on testnet- need to fund new account directly or via an existing account",
      );
    }

    newAccountPublicKey = newAccountPublicKey.toString();
    return await this.postJson(`/account`, {
      newAccountId,
      newAccountPublicKey,
    });
  }

  async getAccountIds(publicKey: PublicKey | string): Promise<string[]> {
    publicKey = publicKey.toString();
    return await this.getJson(`/publicKey/${publicKey}/accounts`);
  }

  async getMoonPayUrl(widgetUrl: string) {
    return await this.getJson(`/moonpay/signURL?url=${encodeURIComponent(widgetUrl)}`);
  }

  async getAllStaking() {
    return await this.getJson(`/stakingPools`);
  }

  // async getLikelyTokenContracts(
  //   accountId: string,
  // ): Promise<THelperLikelyTokensResult> {
  //   return await this.getJson(`/account/${accountId}/likelyTokens`);
  // }

  async getLikelyNftContracts(accountId: string): Promise<THelperLikelyNftsResult> {
    return await this.getJson(`/account/${accountId}/likelyNFTs`);
  }

  async getStakingDeposits(accountId: string) {
    return await this.getJson(`/account/staking-deposits/${accountId}`);
  }

  async getTxsActivity(accountId: string) {
    return await this.getJson(`/account/${accountId}/activity`);
  }

  async seedPhraseAdded(account: Account, publicKey: PublicKey | string) {
    const { accountId } = account;
    publicKey = publicKey.toString();
    return await this.postSignedJson("/account/seedPhraseAdded", { accountId, publicKey }, account);
  }

  async ledgerKeyAdded(account: Account, publicKey: PublicKey | string) {
    const { accountId } = account;
    publicKey = publicKey.toString();
    return await this.postSignedJson("/account/ledgerKeyAdded", { accountId, publicKey }, account);
  }

  async initRecoveryMethod(account: Account, method: string, seedPhrase: string) {
    const { accountId } = account;
    return await this.postSignedJson(
      "/account/initializeRecoveryMethod",
      { accountId, method, seedPhrase },
      account,
    );
  }

  async initRecoveryMethodNewImplicitAccount(
    implicitAccountPublicKey: PublicKey,
    method: string,
    seedPhrase: string,
  ) {
    const accountId = Buffer.from(implicitAccountPublicKey.data).toString("hex");
    return await this.postJson("/account/initializeRecoveryMethodForTempAccount", {
      accountId,
      method,
      seedPhrase,
    });
  }

  async validateSecurityCode(
    account: Account,
    method: string,
    securityCode: string,
    publicKey: PublicKey | string,
  ) {
    const { accountId } = account;
    publicKey = publicKey.toString();
    return await this.postSignedJson(
      "/account/validateSecurityCode",
      {
        accountId,
        method,
        securityCode,
        publicKey,
      },
      account,
    );
  }

  async validateSecurityCodeForTempAccount(
    accountId: Account,
    method: string,
    securityCode: string,
    publicKey: PublicKey | string,
    enterpriseRecaptchaToken?: any,
    recaptchaAction?: any,
    recaptchaSiteKey?: string,
  ) {
    publicKey = publicKey.toString();
    return await this.postJson("/account/validateSecurityCode", {
      accountId,
      method,
      securityCode,
      publicKey,
      enterpriseRecaptchaToken,
      recaptchaAction,
      recaptchaSiteKey,
    });
  }

  async getRecoveryMethods(account: Account) {
    const { accountId } = account;
    return await this.postSignedJson("/account/recoveryMethods", { accountId }, account);
  }

  async deleteRecoveryMethod(account: Account, kind: string, publicKey: PublicKey | string) {
    const { accountId } = account;
    return await this.postSignedJson(
      "/account/deleteRecoveryMethod",
      { accountId, kind, publicKey },
      account,
    );
  }

  async initTwoFactor(account: Account, method: string) {
    const { accountId } = account;
    return await this.postSignedJson("/2fa/init", { accountId, method }, account);
  }
}

let nearHelperForNetwork: { [network in ENearNetwork]?: NearHelper } = {};

export function getNearHelper(network: ENearNetwork): NearHelper {
  if (nearHelperForNetwork[network] != null) {
    return nearHelperForNetwork[network]!;
  }

  nearHelperForNetwork[network] = new NearHelper(network);
  return nearHelperForNetwork[network]!;
}

/*
export const nearHelper = new NearHelper();
export default nearHelper;
*/
