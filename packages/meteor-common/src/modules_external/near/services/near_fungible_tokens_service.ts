import { FinalExecutionOutcome } from "@near-js/types";
import { transactions, utils } from "near-api-js";
import { NearAccountSignerExecutor } from "../../../modules_feature/accounts/near_signer_executor/NearAccountSignerExecutor";
import { TTransactionSimpleNoSigner } from "../../../modules_feature/accounts/near_signer_executor/NearAccountSignerExecutor.types";
import {
  fungible_tokens_utils,
  getWrapNearTokenContractId,
} from "../../../modules_feature/fungible_tokens/fungible_tokens_utils";
import { MeteorActionError } from "../../../modules_utility/api_utilities/async_action_utils";
import { EOldMeteorErrorId } from "../../../modules_utility/old_errors/old_error_ids";
import { JSBI } from "../../perk/clients/dependencies/jsbi";
import { ENearNetwork } from "../types/near_basic_types";
import {
  IWithAccountId,
  IWithContractId,
  IWithStringAmount,
} from "../types/near_input_helper_types";
import { ENearRpc_Finality } from "../types/near_rpc_types";
import {
  IOGetBalanceOf_Input,
  IOGetMetadata_Input,
  IOGetStorageBalance_Input,
  IOGetStorageBalance_Output,
  IOTransferStorageDeposit_Input,
  IOTransfer_Input,
  IOUnwrapNear,
} from "../types/services/fungible_tokens_service_types";
import {
  EFunctionCallMethod_FungibleTokenStandard,
  EFunctionCallMethod_FungibleTokenStandard_Metadata,
  INearFungibleTokenMetadata,
} from "../types/standards/fungible_token_standard_types";
import { EWrapNearToken_ContractId } from "../types/wrap_near_types";
import { NearBasicService } from "./near_basic_service";

// account creation costs 0.00125 NEAR for storage, 0.00000000003 NEAR for gas
// https://docs.near.org/docs/api/naj-cookbook#wrap-and-unwrap-near
const FT_MINIMUM_STORAGE_BALANCE = utils.format.parseNearAmount("0.00125")!;
// FT_MINIMUM_STORAGE_BALANCE: nUSDC, nUSDT require minimum 0.0125 NEAR. Came to this conclusion using trial and error.
export const FT_MINIMUM_STORAGE_BALANCE_LARGE = utils.format.parseNearAmount("0.0125")!;
const FT_STORAGE_DEPOSIT_GAS = utils.format.parseNearAmount("0.00000000001")!;

// set this to the same value as we use for creating an account and the remainder is refunded
const FT_TRANSFER_GAS_YOCTO_STRING = utils.format.parseNearAmount("0.00000000003")!;
const FT_TRANSFER_GAS_YOCTO_BIGINT = BigInt(FT_TRANSFER_GAS_YOCTO_STRING);

// contract might require an attached depositof of at least 1 yoctoNear on transfer methods
// "This 1 yoctoNEAR is not enforced by this standard, but is encouraged to do. While ability to receive attached deposit is enforced by this token."
// from: https://github.com/near/NEPs/issues/141
export const FT_TRANSFER_DEPOSIT = "1";

const FT_REGISTRATION_DEPOSIT = utils.format.parseNearAmount("0.000365")!;
const FT_REGISTRATION_DEPOSIT_GAS = utils.format.parseNearAmount("0.0000000000365")!;

//{ accountId, wrapAmount, toWNear }

export class FungibleTokensService extends NearBasicService {
  // View functions are not signed, so do not require a real account!
  // static viewFunctionAccount = wallet.getAccountBasic('dontcare');
  private nearWrapTokenId: EWrapNearToken_ContractId;

  constructor(network: ENearNetwork) {
    super(network);
    this.nearWrapTokenId =
      network === ENearNetwork.mainnet
        ? EWrapNearToken_ContractId.WRAP_MAINNET
        : EWrapNearToken_ContractId.WRAP_TESTNET;
  }

  /*static getUniqueTokenIdentity(token) {
    return token.contractName || token.onChainFTMetadata?.symbol;
  }

  static async getLikelyTokenContracts({ accountId }) {
    return sendJson("GET", `${ACCOUNT_HELPER_URL}/account/${accountId}/likelyTokens`);
  }*/

  async checkRegistration({ contractId, accountId }) {
    try {
      const { result } = await this.rpcClient.call_function_object_args<boolean>({
        account_id: contractId,
        method_name: "check_registration",
        args: {
          account_id: accountId,
        },
      });

      return result;
    } catch {
      return null;
    }
  }

  async getStorageBalance({
    contractId,
    accountId,
  }: IOGetStorageBalance_Input): Promise<IOGetStorageBalance_Output> {
    /*return await this.nearApi.viewFunction(contractName, "storage_balance_of", {
      account_id: accountId,
    });*/
    const { result } = await this.rpcClient.call_function_object_args<IOGetStorageBalance_Output>({
      account_id: contractId,
      method_name: "storage_balance_of",
      args: {
        account_id: accountId,
      },
    });

    return result;
  }

  async getMetadata({ contractId }: IOGetMetadata_Input): Promise<INearFungibleTokenMetadata> {
    // return await this.nearApi.viewFunction(contractName, "ft_metadata");
    const { result } = await this.rpcClient.call_function_object_args<INearFungibleTokenMetadata>({
      account_id: contractId,
      method_name: EFunctionCallMethod_FungibleTokenStandard_Metadata.ft_metadata,
    });
    result.symbol = fungible_tokens_utils.renameTokenSymbol(contractId, result.symbol);

    return result;
  }

  async getBalanceOf({ contractId, accountId }: IOGetBalanceOf_Input): Promise<string> {
    /*return await this.nearApi.viewFunction(contractName, "ft_balance_of", {
      account_id: accountId,
    });*/
    const { result } = await this.rpcClient.call_function_object_args({
      account_id: contractId,
      method_name: EFunctionCallMethod_FungibleTokenStandard.ft_balance_of,
      args: {
        account_id: accountId,
      },
      finality: ENearRpc_Finality.final,
    });
    return result;
  }

  async getEstimatedTotalFees({
    accountId,
    contractId,
  }: Partial<IWithContractId & IWithAccountId> = {}): Promise<bigint> {
    if (
      contractId &&
      accountId &&
      !(await this.isStorageBalanceAvailable({ contractId, accountId }))
    ) {
      return (
        BigInt(FT_TRANSFER_GAS_YOCTO_STRING) +
        BigInt(FT_MINIMUM_STORAGE_BALANCE) +
        BigInt(FT_STORAGE_DEPOSIT_GAS)
      );
    } else {
      return FT_TRANSFER_GAS_YOCTO_BIGINT;
    }
  }

  async getEstimatedTotalNearAmount({ amount }: IWithStringAmount) {
    return BigInt(amount) + (await this.getEstimatedTotalFees());
  }

  async isStorageBalanceAvailable({
    contractId,
    accountId,
  }: IWithContractId & IWithAccountId): Promise<boolean> {
    const storageBalance = await this.getStorageBalance({
      contractId,
      accountId,
    });
    return storageBalance?.total !== undefined;
  }

  async isStorageDepositRequired({ accountId, contractId }): Promise<boolean> {
    try {
      const storageBalance = await this.getStorageBalance({
        contractId,
        accountId,
      });
      return storageBalance?.total === undefined;
    } catch {
      return false;
    }
  }

  async isAccountUnregistered({ contractId, accountId }) {
    return (await this.checkRegistration({ contractId, accountId })) === false;
  }

  async transfer({
    accountId,
    contractId,
    amount,
    receiverId,
    memo,
  }: IOTransfer_Input): Promise<FinalExecutionOutcome> {
    const isStorageTransferRequired = await this.isStorageDepositRequired({
      contractId,
      accountId: receiverId,
    });

    const isRegistrationRequired = await this.isAccountUnregistered({
      accountId: receiverId,
      contractId,
    });

    const transferTransaction = this.createTransferTransaction({
      contractId,
      receiverId,
      amount,
      isRegistrationRequired,
      memo,
    });

    if (isStorageTransferRequired) {
      const storageDepositTransaction = this.createStorageDepositTransaction({
        contractId,
        receiverId,
        storageDepositAmount: FT_MINIMUM_STORAGE_BALANCE,
      });

      try {
        const results = await NearAccountSignerExecutor.getInstance(
          accountId,
          this.network,
        ).startTransactionsAwait([storageDepositTransaction, transferTransaction]);

        return results[1];
      } catch (e) {
        const storageDepositTransactionLarger = this.createStorageDepositTransaction({
          contractId,
          receiverId,
          storageDepositAmount: FT_MINIMUM_STORAGE_BALANCE_LARGE,
        });

        const results = await NearAccountSignerExecutor.getInstance(
          accountId,
          this.network,
        ).startTransactionsAwait([storageDepositTransactionLarger, transferTransaction]);
        return results[1];
      }
    } else {
      const results = await NearAccountSignerExecutor.getInstance(
        accountId,
        this.network,
      ).startTransactionsAwait([transferTransaction], {});

      return results[0];
    }
  }

  createTransferTransaction({
    amount,
    receiverId,
    contractId,
    isRegistrationRequired,
    memo,
  }: {
    isRegistrationRequired: boolean;
    receiverId: string;
    contractId: string;
    amount: string;
    memo: string;
  }): TTransactionSimpleNoSigner {
    return {
      receiverId: contractId,
      actions: [
        ...(isRegistrationRequired
          ? [
              // @ts-ignore not accept param4 deposit
              functionCall(
                "register_account",
                { account_id: receiverId },
                BigInt(FT_REGISTRATION_DEPOSIT_GAS),
              ),
            ]
          : []),
        transactions.functionCall(
          EFunctionCallMethod_FungibleTokenStandard.ft_transfer,
          {
            amount,
            memo: memo,
            receiver_id: receiverId,
          },
          BigInt(FT_TRANSFER_GAS_YOCTO_STRING),
          BigInt(FT_TRANSFER_DEPOSIT),
        ),
      ],
    };
  }

  createStorageDepositTransaction({
    storageDepositAmount,
    receiverId,
    contractId,
  }: Omit<IOTransferStorageDeposit_Input, "account">): TTransactionSimpleNoSigner {
    return {
      receiverId: contractId,
      actions: [
        transactions.functionCall(
          "storage_deposit",
          {
            account_id: receiverId,
            registration_only: true,
          },
          BigInt(FT_STORAGE_DEPOSIT_GAS),
          BigInt(storageDepositAmount),
        ),
      ],
    };
  }

  async unwrapNear({ network, accountId, unwrapAmount }: IOUnwrapNear) {
    try {
      const [resp] = await NearAccountSignerExecutor.getInstance(
        accountId,
        network,
      ).startTransactionsAwait([
        {
          receiverId: getWrapNearTokenContractId(network),
          actions: [
            transactions.functionCall(
              "near_withdraw",
              { amount: JSBI.BigInt(unwrapAmount || "0").toString() },
              BigInt(FT_STORAGE_DEPOSIT_GAS),
              BigInt(FT_TRANSFER_DEPOSIT),
            ),
          ],
        },
      ]);

      return resp;
    } catch (error) {
      console.error(error);
      console.log({ ...(error as any) });

      throw new MeteorActionError([EOldMeteorErrorId.merr_unwrap_near_failed]);
    }
  }
}

let nearFungibleTokensForNetwork: {
  [network in ENearNetwork]?: FungibleTokensService;
} = {};

export function getFungibleTokensService(network: ENearNetwork): FungibleTokensService {
  if (nearFungibleTokensForNetwork[network] != null) {
    return nearFungibleTokensForNetwork[network]!;
  }

  nearFungibleTokensForNetwork[network] = new FungibleTokensService(network);
  return nearFungibleTokensForNetwork[network]!;
}
