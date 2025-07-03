import { ENearNetwork } from "../types/near_basic_types";
import { NearBasicService } from "./near_basic_service";

import { getNearRpcClient } from "@meteorwallet/meteor-near-sdk";
import { KeyPairString } from "@near-js/crypto";
import { KeyPair, transactions } from "near-api-js";
import { DROP_TYPE } from "../../../modules_feature/linkdrop/keypom_types";
import {
  IKeypom_Drop,
  IKeypom_KeyInfo,
  IKeypom_NFTMetadata,
} from "../types/services/keypom_service_types";
import { near_keypom_util } from "../utils/near_keypom_utils";

const attachedGas = "100000000000000";

class KeypomService extends NearBasicService {
  async getDropInformation({
    contractId,
    privKey,
  }: {
    contractId: string;
    privKey: string;
  }): Promise<IKeypom_Drop | undefined> {
    try {
      const keyPair = await KeyPair.fromString(privKey as KeyPairString);
      const publicKey = keyPair.getPublicKey().toString();
      const { result } = await this.rpcClient.call_function_object_args<IKeypom_Drop>({
        account_id: contractId,
        method_name: "get_drop_information",
        args: {
          key: publicKey,
        },
      });

      return result;
    } catch (e) {
      console.log("error Catched");
      console.error(e);
      return undefined;
    }
  }

  async getKeyInformation({
    contractId,
    privKey,
  }: {
    contractId: string;
    privKey: string;
  }): Promise<IKeypom_KeyInfo | undefined> {
    try {
      const keyPair = await KeyPair.fromString(privKey as KeyPairString);
      const publicKey = keyPair.getPublicKey().toString();
      const { result } = await this.rpcClient.call_function_object_args<IKeypom_KeyInfo>({
        account_id: contractId,
        method_name: "get_key_information",
        args: {
          key: publicKey,
        },
      });

      return result;
    } catch (e) {
      console.log("error Catched");
      console.error(e);
      return undefined;
    }
  }

  async getKeyBalance({
    contractId,
    privKey,
  }: {
    contractId: string;
    privKey: string;
  }): Promise<string> {
    const keyPair = await KeyPair.fromString(privKey as KeyPairString);
    const publicKey = keyPair.getPublicKey().toString();
    console.log(publicKey);
    const { result } = await this.rpcClient.call_function_object_args<string>({
      account_id: contractId,
      method_name: "get_key_balance",
      args: {
        key: publicKey,
      },
    });

    return result;
  }

  async createAccountAndClaim({
    contractId,
    privKey,
    newAccountId,
    newPublicKey,
  }: {
    contractId: string;
    privKey: string;
    newAccountId: string;
    newPublicKey: string;
  }) {
    const keyPair = await KeyPair.fromString(privKey as KeyPairString);
    await this.nearApi.keystore.setKey(this.network, contractId, keyPair);
    const keypomAccount = await this.nearApi.nativeApi.account(contractId);

    const actions = [
      transactions.functionCall(
        "create_account_and_claim",
        {
          new_account_id: newAccountId,
          new_public_key: newPublicKey.replace("ed25519:", ""),
        },
        BigInt(attachedGas),
        BigInt(0),
      ),
    ];

    // @ts-ignore
    const [, signedTx] = await keypomAccount.signTransaction(contractId, [
      transactions.functionCall(
        "create_account_and_claim",
        {
          new_account_id: newAccountId,
          new_public_key: newPublicKey.replace("ed25519:", ""),
        },
        BigInt(attachedGas),
        BigInt(0),
      ),
    ]);

    console.log(signedTx);
    return await getNearRpcClient(this.network).custom_broadcast_tx_async_wait_all_receipts({
      signed_transaction_base64: Buffer.from(signedTx.encode()).toString("base64"),
      sender_account_id: keypomAccount.accountId,
    });
  }

  async claim({
    contractId,
    privKey,
    accountId,
  }: {
    contractId: string;
    privKey: string;
    accountId: string;
  }) {
    const keyPair = await KeyPair.fromString(privKey as KeyPairString);
    await this.nearApi.keystore.setKey(this.network, contractId, keyPair);
    const keypomAccount = await this.nearApi.nativeApi.account(contractId);

    // @ts-ignore
    const [, signedTx] = await keypomAccount.signTransaction(contractId, [
      transactions.functionCall(
        "claim",
        {
          account_id: accountId,
        },
        BigInt(attachedGas),
        BigInt(0),
      ),
    ]);

    return await getNearRpcClient(this.network).custom_broadcast_tx_async_wait_all_receipts({
      signed_transaction_base64: Buffer.from(signedTx.encode()).toString("base64"),
      sender_account_id: keypomAccount.accountId,
    });
  }

  async getDropNftMetadata(
    dropInfo: IKeypom_Drop | null | undefined,
  ): Promise<IKeypom_NFTMetadata | undefined> {
    if (!dropInfo) {
      return undefined;
    }

    const dropType = near_keypom_util.getDropType(dropInfo);

    if (dropType !== DROP_TYPE.NFT) {
      return undefined;
    }

    const nftContractId = near_keypom_util.getNftContractId(dropInfo);

    const { result } = await this.rpcClient.call_function_object_args<IKeypom_NFTMetadata>({
      account_id: nftContractId,
      method_name: "get_series_info",
      args: { mint_id: parseInt(dropInfo.drop_id) },
    });

    return result;
  }
}

let nearFungibleTokensForNetwork: {
  [network in ENearNetwork]?: KeypomService;
} = {};

export function getKeypomService(network: ENearNetwork): KeypomService {
  if (nearFungibleTokensForNetwork[network] != null) {
    return nearFungibleTokensForNetwork[network]!;
  }

  nearFungibleTokensForNetwork[network] = new KeypomService(network);
  return nearFungibleTokensForNetwork[network]!;
}
