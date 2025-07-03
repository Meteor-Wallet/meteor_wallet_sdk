import { actionCreators } from "@near-js/transactions";
import { FinalExecutionOutcome } from "@near-js/types";
import Big from "big.js";
import _ from "lodash";
import { AppStore } from "../../modules_app_core/state/app_store/AppStore";
import { account_transition_state_tasks } from "../../modules_app_core/state/app_store/state_tasks/account_transition.state_tasks";
import { getDecryptedAccountData } from "../../modules_app_core/state/app_store/state_tasks/old_account.state_tasks";
import { MeteorBackendV2Client } from "../../modules_external/meteor_v2_api/MeteorBackendV2Client";
import { TIO_AccessInfo } from "../../modules_external/meteor_v2_api/meteor_v2_api.io_types";
import {
  IBurnAsset_Input,
  IGetHarvestShareImage_Input,
  IGetRecruitShareImage_Input,
  IMeteorBackendV2SignatureInfo,
  IRemindFriend_Input,
} from "../../modules_external/meteor_v2_api/meteor_v2_api.types";
import { getNearApi } from "../../modules_external/near/clients/near_api_js/NearApiJsClient";
import { NFT_TRANSFER_DEPOSIT } from "../../modules_external/near/services/near_non_fungible_tokens_service";
import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";
import { IWithAccountIdAndNetwork } from "../../modules_external/near/types/near_input_helper_types";
import { IONearRpc_Query_ViewAccessKey_Output } from "../../modules_external/near/types/near_rpc_types";
import {
  INearNftMetadata,
  INearNftTokenData_WithMetadata,
} from "../../modules_external/near/types/standards/nft_standard_types";
import {
  INep0413_PayloadToSign,
  INep0413_SignedMessage,
} from "../../modules_external/near/types/standards/wallet_standard_types";
import { toYoctoNear } from "../../modules_external/near/utils/near_formatting_utils";
import { near_wallet_utils } from "../../modules_external/near/utils/near_wallet_utils";
import {
  ITelegramAccountSignedPayload,
  ITelegramData,
} from "../../modules_external/telegram/telegram.types";
import { MeteorEncryptionUtils } from "../../modules_utility/cryptography/MeteorEncryptionUtils";
import { MathUtil } from "../../modules_utility/math/MathUtil";
import { account_async_functions } from "../accounts/account_async_functions";
import { EAccountKeyType, EDecryptionKeyType, TAccountSecretData } from "../accounts/account_types";
import { NearAccountSignerExecutor } from "../accounts/near_signer_executor/NearAccountSignerExecutor";
import { TTransactionSimpleNoSigner } from "../accounts/near_signer_executor/NearAccountSignerExecutor.types";
import { near_action_creators } from "../accounts/transactions/near_action_creators";
import { NEAR_METADATA } from "../fungible_tokens/fungible_tokens_constants";
import { gear_staking_constants } from "../gear_staking/gear_staking_constants";
import { EMissionLeaderboardSubType } from "../missions/mission_types";
import { nft_utils } from "../nfts/nft_utils";
import { staking_async_function } from "../staking/staking_async_functions";
import { METEOR_VALIDATOR_BY_NETWORK } from "../staking/staking_constants";
import { telegram_async_functions } from "../telegram/telegram_async_function";
import { HARVEST_MOON_RELICS, attachedGas } from "./harvest_moon_constants";
import {
  EHM_UnionContractTypes,
  EHarvestMoon_PlayerTier,
  EHarvestMoon_SmartContractMethods,
} from "./harvest_moon_enums";
import { harvest_moon_internal_impl } from "./harvest_moon_internal_impl";
import {
  IHarvestMoonAccountData,
  IHarvestMoonGearLevel,
  IHarvestMoonHarvestResponse,
  IHarvestMoonOddBarDetails,
  IHarvestMoonRecruitTinker,
  IHarvestMoonReferralStats,
  IHarvestMoonRelic,
  IHarvestMoonRelicWithNftInfo,
  IHarvestMoonStakedRelics,
  IHarvestMoonTierCondition,
  IHarvestMoonUpgradeTinker,
  IHarvestMoon_ContractDropResponse,
  IHarvestMoon_LeaderBoardMissionResponse,
  IHarvestMoon_LeaderBoardResponse,
  IOHarvestMoonContract,
  IOHarvestMoonGetContractDropRate,
  IOHarvestMoonTelegramData,
  ITinkerFusionObject,
  ITokenDropCampaign,
  THarvestUnclaimedReward,
  TWeightedRandomResult,
} from "./harvest_moon_types";
import {
  getMoonProductionRate,
  hmutils_signPayload,
  hmutils_signPayloadTelegram,
} from "./harvest_moon_utils";

interface IOSignMessage extends IWithAccountIdAndNetwork {
  payload: INep0413_PayloadToSign;
}

async function signMessage({
  accountId,
  network,
  payload,
}: IOSignMessage): Promise<INep0413_SignedMessage> {
  const appStore = AppStore.getRawState();

  const fullAccount = appStore.allAccounts.find((e) => e.id === accountId);

  const keyType = fullAccount?.keyMeta.keyType;
  let privateKey = "";

  if (keyType === EAccountKeyType.HARDWARE) {
    if (fullAccount) {
      const inputs = {
        password: "",
      };

      account_transition_state_tasks.ensureCurrentWalletUserSetup(inputs);

      const passwordEncryptKeyHash = await MeteorEncryptionUtils.getOldPasswordCipherKeyHash(
        inputs.password,
      );

      let decrypted: TAccountSecretData;

      if (fullAccount.passwordEncryptKeyType === EDecryptionKeyType.HASHED_SHA256_SALTED) {
        decrypted = await getDecryptedAccountData(fullAccount, passwordEncryptKeyHash);
      } else {
        decrypted = await getDecryptedAccountData(fullAccount, inputs.password);
      }
      if (decrypted.type === EAccountKeyType.HARDWARE && decrypted.backendPrivateKey) {
        privateKey = decrypted.backendPrivateKey;
      }
    }
  }

  if (keyType === EAccountKeyType.LOCAL_PRIVATE_KEY) {
    const keyStore = getNearApi(network).keystore;
    const key = await keyStore.getKey(network, accountId);
    if (key) {
      privateKey = key.toString();
    }
  }

  if (privateKey) {
    const finalPayload = {
      privateKey: privateKey,
      accountId,
      ...payload,
    };

    const signedMessage =
      near_wallet_utils.nep0413_signMessageWithAccountAndPrivateKey(finalPayload);

    return signedMessage;
  }

  throw new Error("No key found for account");
}

async function isWalletWhitelisted(input: IWithAccountIdAndNetwork): Promise<boolean> {
  const walletSignedPayload = await hmutils_signPayload(input);
  const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
  const resp = await meteorBackendV2Service.isWalletWhitelisted({
    walletSignedPayload,
  });
  return resp;
}

async function remindFriendHarvest(
  input: IWithAccountIdAndNetwork & IRemindFriend_Input,
): Promise<{ remindedCount: number }> {
  const walletSignedPayload = await hmutils_signPayload(input);
  const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
  const resp = await meteorBackendV2Service.remindFriendHarvest({
    walletSignedPayload,
    responderNetworkId: input.responderNetworkId,
    responderWalletId: input.responderWalletId,
  });
  return resp;
}

async function getAccessInfoFromBackend({
  network,
  accountId,
  telegramData,
}: IWithAccountIdAndNetwork & {
  telegramData: ITelegramData;
}): Promise<TIO_AccessInfo> {
  const walletSignedPayload = await telegram_async_functions.signTelegramLinkMessage({
    network,
    accountId,
    telegramData,
  });
  const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
  const resp = await meteorBackendV2Service.harvestMoonGetAccessInfo(walletSignedPayload);
  return resp;
}

async function getHarvestMoonConfig({
  network,
  accountId,
  harvestMoonContractId,
}: IOHarvestMoonContract) {
  const account = await getNearApi(network).nativeApi.account(accountId);
  return await account.viewFunction({
    contractId: harvestMoonContractId,
    methodName: EHarvestMoon_SmartContractMethods.get_configs,
  });
}

async function getHarvestMoonAccountInfo({
  network,
  accountId,
  harvestMoonContractId,
}: IOHarvestMoonContract): Promise<IHarvestMoonAccountData | null> {
  const account = await getNearApi(network).nativeApi.account(accountId);
  return await account.viewFunction({
    contractId: harvestMoonContractId,
    methodName: EHarvestMoon_SmartContractMethods.view_account_info,
    args: {
      account_id: accountId,
    },
  });
}

async function getHarvestMoonTinkerFusionInfo({
  network,
  accountId,
  harvestMoonContractId,
}: IOHarvestMoonContract): Promise<ITinkerFusionObject[]> {
  const account = await getNearApi(network).nativeApi.account(accountId);
  let response = await account.viewFunction({
    contractId: harvestMoonContractId,
    methodName: EHarvestMoon_SmartContractMethods.get_space_tinkers_upgrade_cost_and_info,
    args: {
      account_id: accountId,
    },
  });
  const payload: {
    [key: string]: Omit<ITinkerFusionObject, "id">;
  } = response || {};
  const parsedPayload = Object.entries(payload || {}).map(([key, info]) => ({
    id: Number(key),
    ...info,
  }));
  return parsedPayload;
}

async function upgradeTinker(input: IOHarvestMoonTelegramData & IHarvestMoonUpgradeTinker) {
  try {
    const walletSignedPayload = await hmutils_signPayloadTelegram(input);
    const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
    const resp = await meteorBackendV2Service.harvestMoonUpgradeTinker({
      walletSignedPayload,
      tinkerId: input.tinkerId,
      quantity: input.quantity,
    });
    return resp;
  } catch (error) {
    console.log(error);
    console.log({ ...(error as any) });
    throw error;
  }
}

async function upgradeTinkerWithGear({
  accountId,
  network,
  harvestMoonContractId,
  gearTokenAmount,
  tinkerId,
  quantity,
}: IOHarvestMoonContract & IHarvestMoonUpgradeTinker & { gearTokenAmount: string }) {
  const accountInfo = await getHarvestMoonAccountInfo({
    network,
    accountId,
    harvestMoonContractId,
  });

  if (!accountInfo) {
    throw new Error("Unable to retrieve account info");
  }

  const [res] = await NearAccountSignerExecutor.getInstance(
    accountId,
    network,
  ).startTransactionsAwait(
    [
      {
        receiverId: gear_staking_constants[network].gearTokenContractId,
        actions: [
          actionCreators.functionCall(
            "ft_transfer_call",
            {
              receiver_id: harvestMoonContractId,
              amount: gearTokenAmount,
              msg: JSON.stringify({
                UpgradeTinker: {
                  space_tinker_id: tinkerId,
                  count: quantity,
                },
              }),
            },
            BigInt("300000000000000"),
            BigInt(NFT_TRANSFER_DEPOSIT),
          ),
        ],
      } satisfies TTransactionSimpleNoSigner,
    ],
    {
      noAutoModal: true,
    },
  );

  return res;
}

async function getHarvestMoonAccountInfoForWallets({
  wallets,
  harvestMoonContractId,
}: {
  wallets: {
    walletId: string;
    network: ENearNetwork;
  }[];
  harvestMoonContractId: string;
}): Promise<
  {
    walletId: string;
    network: ENearNetwork;
    hm_account_info: IHarvestMoonAccountData | null;
  }[]
> {
  const hmAccountsInfo: {
    walletId: string;
    network: ENearNetwork;
    hm_account_info: IHarvestMoonAccountData | null;
  }[] = [];
  await Promise.all(
    wallets.map(async (wallet) => {
      let hm_account_info: IHarvestMoonAccountData | null = null;
      try {
        const hmAccountInfo = await getHarvestMoonAccountInfo({
          network: wallet.network,
          accountId: wallet.walletId,
          harvestMoonContractId,
        });
        hm_account_info = hmAccountInfo;
      } catch (err) {
        // do nothing
      }

      hmAccountsInfo.push({
        walletId: wallet.walletId,
        network: wallet.network,
        hm_account_info: hm_account_info,
      });
    }),
  );
  return hmAccountsInfo;
}

async function addFunctionCallAccessKey(
  payload: IWithAccountIdAndNetwork & {
    contractId: string;
    publicKey: string;
    relayed?: boolean;
  },
): Promise<IONearRpc_Query_ViewAccessKey_Output | null> {
  return payload.relayed
    ? await harvest_moon_internal_impl.addAccessKey_relayed(payload)
    : await harvest_moon_internal_impl.addAccessKey_normal(payload);
}

async function initHarvestMoonAccount(
  payload: IWithAccountIdAndNetwork & {
    harvestMoonContractId: string;
    relayed: boolean;
  },
): Promise<IHarvestMoonAccountData | null> {
  if (!payload.relayed) {
    const [resp] = await NearAccountSignerExecutor.getInstance(
      payload.accountId,
      payload.network,
    ).startTransactionsAwait([
      {
        receiverId: payload.harvestMoonContractId,
        actions: [
          actionCreators.functionCall(
            EHarvestMoon_SmartContractMethods.initialize_account,
            {},
            BigInt(attachedGas),
            BigInt(toYoctoNear("0.003")),
          ),
        ],
      },
    ]);
  } else {
    const walletSignedPayload: IMeteorBackendV2SignatureInfo = await hmutils_signPayload(payload);
    const meteorBackendV2Service = MeteorBackendV2Client.getInstance();

    await meteorBackendV2Service.harvestMoonInitializeAccount({
      walletSignedPayload,
    });
  }
  return await getHarvestMoonAccountInfo(payload);
}

async function testDeleteHarvestMoonAccount({ accountId, network, harvestMoonContractId }) {
  try {
    const [resp] = await NearAccountSignerExecutor.getInstance(
      accountId,
      network,
    ).startTransactionsAwait([
      {
        receiverId: harvestMoonContractId,
        actions: [
          actionCreators.functionCall(
            EHarvestMoon_SmartContractMethods.test_delete_account,
            {},
            BigInt(attachedGas),
            BigInt(0),
          ),
        ],
      },
    ]);

    return resp;
  } catch (error) {
    console.error(error);
    console.log({ ...(error as any) });
  }
}

async function getUnclaimedRewards(
  input: IWithAccountIdAndNetwork,
): Promise<THarvestUnclaimedReward> {
  try {
    const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
    const resp = await meteorBackendV2Service.harvestMoonGetUnclaimedRewards({
      walletSignedPayload: {
        walletId: input.accountId,
        networkId: input.network,
      },
    });
    return resp;
  } catch (error) {
    console.error(error);
    console.log({ ...(error as any) });
    throw error;
  }
}

async function getReferralStats(
  input: IOHarvestMoonTelegramData,
): Promise<IHarvestMoonReferralStats> {
  try {
    const walletSignedPayload = await hmutils_signPayloadTelegram(input);
    const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
    const resp = await meteorBackendV2Service.harvestMoonGetReferralStats({
      walletSignedPayload,
    });
    return resp;
  } catch (error) {
    console.log(error);
    console.log({ ...(error as any) });
    throw error;
  }
}

const getOddsHeightDetailsByContractType = (
  randomResult: TWeightedRandomResult<EHM_UnionContractTypes>,
  contractType: EHM_UnionContractTypes,
) => {
  const target = randomResult.cumulativeWeights.find((e) => e.item === contractType);

  if (!target) {
    return {
      start: 0,
      end: 0,
    };
  }

  return {
    start: target.cumulativeWeight - target.weight,
    end: target.cumulativeWeight,
  };
};

async function harvest(payload: IWithAccountIdAndNetwork): Promise<
  IHarvestMoonHarvestResponse & {
    oddBarDetails: IHarvestMoonOddBarDetails;
  }
> {
  try {
    const walletSignedPayload: IMeteorBackendV2SignatureInfo = await hmutils_signPayload(payload);
    const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
    const appStore = AppStore.getRawState();

    const accountInfo = await getHarvestMoonAccountInfo({
      network: payload.network,
      accountId: payload.accountId,
      harvestMoonContractId: appStore.harvestMoonContractId,
    });

    if (!accountInfo) {
      throw new Error("Account not found");
    }

    const dropRate = await getContractDropRate({
      vault_level: accountInfo.vault_level,
    });
    const harvestResponse = await meteorBackendV2Service.harvestMoonHarvest({
      walletSignedPayload,
    });

    let noDropEndHeight = 0;

    let pointerPos = 0;

    if (harvestResponse.dropOdds) {
      const noDrop = harvestResponse.dropOdds.cumulativeWeights.find((v) => v.item === false);
      if (noDrop) {
        noDropEndHeight = noDrop.weight;
      }
    }

    let dropHeight = 1 - noDropEndHeight;

    let basicEndHeight = noDropEndHeight + dropRate.basic_rate * dropHeight;
    let advancedEndHeight = basicEndHeight + dropRate.advanced_rate * dropHeight;
    let expertEndHeight = advancedEndHeight + dropRate.expert_rate * dropHeight;

    if (harvestResponse.contractTypeOdds) {
      // dropped a contract
      const droppedContractType = harvestResponse.contractTypeOdds.item;
      const contractOriginalRange: {
        [key in EHM_UnionContractTypes]: {
          start: number;
          end: number;
        };
      } = {
        [EHM_UnionContractTypes.basic]: getOddsHeightDetailsByContractType(
          harvestResponse.contractTypeOdds,
          EHM_UnionContractTypes.basic,
        ),
        [EHM_UnionContractTypes.advanced]: getOddsHeightDetailsByContractType(
          harvestResponse.contractTypeOdds,
          EHM_UnionContractTypes.advanced,
        ),
        [EHM_UnionContractTypes.expert]: getOddsHeightDetailsByContractType(
          harvestResponse.contractTypeOdds,
          EHM_UnionContractTypes.expert,
        ),
      };

      const selectedRange = contractOriginalRange[droppedContractType];

      const zoneRelativePos =
        (harvestResponse.contractTypeOdds.randomNumber - selectedRange.start) /
        (selectedRange.end - selectedRange.start);

      const contractScaledRange: {
        [key in EHM_UnionContractTypes]: {
          start: number;
          end: number;
        };
      } = {
        [EHM_UnionContractTypes.basic]: {
          start: noDropEndHeight,
          end: basicEndHeight,
        },
        [EHM_UnionContractTypes.advanced]: {
          start: basicEndHeight,
          end: advancedEndHeight,
        },
        [EHM_UnionContractTypes.expert]: {
          start: advancedEndHeight,
          end: expertEndHeight,
        },
      };

      pointerPos =
        contractScaledRange[droppedContractType].start +
        (contractScaledRange[droppedContractType].end -
          contractScaledRange[droppedContractType].start) *
          zoneRelativePos;
    } else {
      // didn't drop a contract
      if (harvestResponse.dropOdds) {
        const noDrop = harvestResponse.dropOdds.cumulativeWeights.find((v) => v.item === false);
        if (noDrop) {
          const noDropOriginalRange = {
            start: noDrop.cumulativeWeight - noDrop.weight,
            end: noDrop.cumulativeWeight,
          };

          const zoneRelativePos =
            (harvestResponse.dropOdds.randomNumber - noDropOriginalRange.start) /
            (noDropOriginalRange.end - noDropOriginalRange.start);

          const noDropScaledRange = {
            start: 0,
            end: noDropEndHeight,
          };

          pointerPos =
            noDropScaledRange.start +
            (noDropScaledRange.end - noDropScaledRange.start) * zoneRelativePos;
        }
      }
    }

    console.log({
      noDropEndHeight,
      basicEndHeight,
      advancedEndHeight,
      expertEndHeight,
      pointerPos,
      dropped: harvestResponse.dropOdds?.item,
      contract: harvestResponse.contractTypeOdds?.item,
    });
    return {
      ...harvestResponse,
      oddBarDetails: {
        noDropEndHeight,
        basicEndHeight,
        advancedEndHeight,
        expertEndHeight,
        pointerPos,
      },
    };
  } catch (error) {
    console.error(error);
    console.log({ ...(error as any) });
    throw error;
  }
}

async function recruitTinkers(input: IOHarvestMoonTelegramData & IHarvestMoonRecruitTinker) {
  try {
    const walletSignedPayload = await hmutils_signPayloadTelegram(input);
    const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
    const resp = await meteorBackendV2Service.harvestMoonRecruitTinkers({
      walletSignedPayload,
      union_contract_type: input.union_contract_type,
      tinker_count: input.tinker_count,
    });
    return resp;
  } catch (error) {
    console.log(error);
    console.log({ ...(error as any) });
    throw error;
  }
}

async function getHarvestShareImage({
  network,
  accountId,
  telegramData,
  harvestResultProps,
}: {
  network: ENearNetwork;
  accountId: string;
  telegramData: ITelegramData;
  harvestResultProps: IGetHarvestShareImage_Input;
}) {
  // -1 means we are getting lab data, don't call actual endpoint first
  if (harvestResultProps.lab === "-1") {
    return "";
  }
  const signedPayload: ITelegramAccountSignedPayload =
    await telegram_async_functions.signTelegramLinkMessage({
      network,
      accountId,
      telegramData,
    });

  const walletSignedPayload: IMeteorBackendV2SignatureInfo = signedPayload.walletSignedPayload;

  const meteorBackendV2Service = MeteorBackendV2Client.getInstance();

  const resp = await meteorBackendV2Service.harvestMoonGetHarvestShareImage({
    walletSignedPayload,
    ...harvestResultProps,
  });

  return resp;
}

async function getRecruitShareImage({
  network,
  accountId,
  telegramData,
  recruitResultProps,
}: {
  network: ENearNetwork;
  accountId: string;
  telegramData: ITelegramData;
  recruitResultProps: IGetRecruitShareImage_Input;
}) {
  const signedPayload: ITelegramAccountSignedPayload =
    await telegram_async_functions.signTelegramLinkMessage({
      network,
      accountId,
      telegramData,
    });

  const walletSignedPayload: IMeteorBackendV2SignatureInfo = signedPayload.walletSignedPayload;

  const meteorBackendV2Service = MeteorBackendV2Client.getInstance();

  const resp = await meteorBackendV2Service.harvestMoonGetRecruitShareImage({
    walletSignedPayload,
    ...recruitResultProps,
  });

  return resp;
}

async function getLeaderBoard(
  payload: IWithAccountIdAndNetwork,
): Promise<IHarvestMoon_LeaderBoardResponse> {
  try {
    const walletSignedPayload: IMeteorBackendV2SignatureInfo = await hmutils_signPayload(payload);
    const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
    const resp = await meteorBackendV2Service.getHarvestMoonLeaderBoard({
      walletSignedPayload,
    });
    return resp;
  } catch (error) {
    console.log(error);
    console.log({ ...(error as any) });
    throw error;
  }
}

async function getLeaderBoardMission(
  payload: IWithAccountIdAndNetwork & {
    missionSubType: EMissionLeaderboardSubType;
    minimumStreak?: number;
  },
): Promise<IHarvestMoon_LeaderBoardMissionResponse> {
  try {
    const walletSignedPayload: IMeteorBackendV2SignatureInfo = await hmutils_signPayload(payload);
    const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
    const resp = await meteorBackendV2Service.getHarvestMoonLeaderBoardMission({
      walletSignedPayload,
      ...payload,
    });
    return resp;
  } catch (error) {
    console.log(error);
    console.log({ ...(error as any) });
    throw error;
  }
}

async function upgradeLab(payload: IWithAccountIdAndNetwork): Promise<void> {
  try {
    const walletSignedPayload: IMeteorBackendV2SignatureInfo = await hmutils_signPayload(payload);
    const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
    await meteorBackendV2Service.harvestMoonUpgradeLab({
      walletSignedPayload,
    });
  } catch (error) {
    console.error(error);
    console.log({ ...(error as any) });
    throw error;
  }
}

async function upgradeContainer(payload: IWithAccountIdAndNetwork): Promise<void> {
  try {
    const walletSignedPayload: IMeteorBackendV2SignatureInfo = await hmutils_signPayload(payload);
    const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
    await meteorBackendV2Service.harvestMoonUpgradeContainer({
      walletSignedPayload,
    });
  } catch (error) {
    console.error(error);
    console.log({ ...(error as any) });
    throw error;
  }
}

async function upgradeTier(payload: IWithAccountIdAndNetwork): Promise<void> {
  try {
    const walletSignedPayload: IMeteorBackendV2SignatureInfo = await hmutils_signPayload(payload);
    const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
    await meteorBackendV2Service.harvestMoonUpgradeTier({
      walletSignedPayload,
    });
  } catch (error) {
    console.error(error);
    console.log({ ...(error as any) });
    throw error;
  }
}

async function getTier(payload: IWithAccountIdAndNetwork): Promise<number> {
  try {
    const walletSignedPayload: IMeteorBackendV2SignatureInfo = await hmutils_signPayload(payload);
    const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
    return await meteorBackendV2Service.harvestMoonGetTier({
      walletSignedPayload,
    });
  } catch (error) {
    console.error(error);
    console.log({ ...(error as any) });
    throw error;
  }
}
async function getContractDropRate(
  payload: IOHarvestMoonGetContractDropRate,
): Promise<IHarvestMoon_ContractDropResponse> {
  try {
    const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
    return await meteorBackendV2Service.harvestMoonGetContractDropRate({
      vault_level: payload.vault_level,
    });
  } catch (error) {
    console.error(error);
    console.log({ ...(error as any) });
    throw error;
  }
}

async function getTierConditions(payload: IWithAccountIdAndNetwork): Promise<{
  [key in EHarvestMoon_PlayerTier]: IHarvestMoonTierCondition[];
}> {
  try {
    let holdMoreThan3Near = true;
    const accountState = await account_async_functions.getAccountState({
      accountId: payload.accountId,
      network: payload.network,
    });

    const nearDecimals = 24;

    const nearDecimalsInBig = Big(10).pow(nearDecimals);

    const accountBalance = Big(accountState.amount ?? 0).div(nearDecimalsInBig);

    const upgradeNearRequirement = 3;

    if (accountBalance.lt(Big(upgradeNearRequirement))) {
      holdMoreThan3Near = false;
    }

    return {
      [EHarvestMoon_PlayerTier.one]: [
        {
          icon_id: "thumbs_up",
          isPrimary: true,
          title: "Owns a wallet",
          description: "Create a wallet and initialize harvest moon now!",
          isSatisfied: true,
        },
      ],
      [EHarvestMoon_PlayerTier.two]: [
        {
          icon_id: "thumbs_up",
          isPrimary: true,
          title: "Hold 3 NEAR",
          description: "Hold at least 3 NEAR in your wallet to upgrade to tier 2.",
          isSatisfied: holdMoreThan3Near,
        },
      ],
      [EHarvestMoon_PlayerTier.three]: [
        {
          icon_id: "thumbs_up",
          isPrimary: true,
          title: "Coming soon!",
          description: "Coming soon!",
          isSatisfied: false,
        },
        // {
        //   icon_id: 'fire_fill',
        //   title: "Title",
        //   description: "Short description",
        // },
      ],
    };
  } catch (error) {
    console.error(error);
    console.log({ ...(error as any) });
    throw error;
  }
}

export interface IHarvestMoonTierBenefit {
  icon_url: string;
  description: string;
  type?: "remove" | "new";
}

export interface IHarvestMoonTierRequirement {
  onClick?: () => void;
  buttonTitle: string;
  description: string;
  progress: string;
  condition: string;
  completed: boolean;
}

export interface ITierUpgradable {
  current_tier: number;
  tier_name: string;
  tier_description: string;
  upgradable: boolean;
  current_benefits: IHarvestMoonTierBenefit[];
  upgrade_to_unlock: IHarvestMoonTierBenefit[];
  conditions_to_unlock: IHarvestMoonTierRequirement[];
}

async function getTierUpgradable(
  payload: IWithAccountIdAndNetwork & {
    tier?: number;
    isPasswordSet: boolean;
    isSeedPhraseBackup: boolean;
    onClickPasswordSet: () => void;
    onClickPhraseBackup: () => void;
    onClickDeposit: () => void;
    onClickStake: () => void;
  },
): Promise<ITierUpgradable> {
  try {
    let tier = payload.tier;
    if (!tier) {
      tier = await getTier(payload);
    }
    if (tier === 1) {
      let holdMoreThan3Near = true;
      const accountState = await account_async_functions.getAccountState({
        accountId: payload.accountId,
        network: payload.network,
      });

      const nearDecimals = NEAR_METADATA.decimals;

      const nearDecimalsInBig = Big(10).pow(nearDecimals);

      const accountBalance = Big(accountState.amount ?? 0).div(nearDecimalsInBig);

      const upgradeNearRequirement = 3;

      if (accountBalance.lt(Big(upgradeNearRequirement))) {
        holdMoreThan3Near = false;
      }

      return {
        current_tier: tier,
        tier_name: "tier_name_1",
        tier_description: "tier_description_1",
        upgradable: holdMoreThan3Near && payload.isPasswordSet && payload.isSeedPhraseBackup,
        current_benefits: [
          {
            icon_url:
              "https://storage.googleapis.com/meteor-static-data/harvest-moon/tier%20icons/gas.png",
            description: "one_gas_free_transaction_everyday",
          },
          {
            icon_url:
              "https://storage.googleapis.com/meteor-static-data/harvest-moon/tier%20icons/contract-basic.png",
            description: "eligible_for_basic_contracts_during_harvest_lotteries",
          },
        ],
        upgrade_to_unlock: [
          {
            icon_url:
              "https://storage.googleapis.com/meteor-static-data/harvest-moon/tier%20icons/gas.png",
            description: "one_gas_free_transaction_everyday",
            type: "remove",
          },
          {
            icon_url:
              "https://storage.googleapis.com/meteor-static-data/harvest-moon/tier%20icons/contract-advanced.png",
            description: "chance_to_get_advanced_contract_during_harvest",
            type: "new",
          },
          {
            icon_url:
              "https://storage.googleapis.com/meteor-static-data/harvest-moon/tier%20icons/clock.png",
            description: "harvest_anytime_without_waiting_period",
            type: "new",
          },
        ],
        conditions_to_unlock: [
          {
            onClick: payload.onClickDeposit,
            buttonTitle: "hold_3_near_in_your_wallet_button",
            description: "hold_3_near_in_your_wallet_description",
            progress: MathUtil.toFixedRoundDown(accountBalance.toFixed(), 2),
            condition: "3",
            completed: holdMoreThan3Near,
          },
          {
            onClick: payload.isPasswordSet ? undefined : payload.onClickPasswordSet,
            buttonTitle: "set_a_password_for_your_wallet_button",
            description: "set_a_password_for_your_wallet_description",
            progress: payload.isPasswordSet ? "1" : "0",
            condition: "1",
            completed: payload.isPasswordSet,
          },
          {
            onClick: payload.isSeedPhraseBackup ? undefined : payload.onClickPhraseBackup,
            buttonTitle: "backup_your_seedphrase_button",
            description: "backup_your_seedphrase_description",
            progress: payload.isSeedPhraseBackup ? "1" : "0",
            condition: "1",
            completed: payload.isSeedPhraseBackup,
          },
        ],
      };
    } else if (tier === 2) {
      let stakedMoreThan5Near = true;
      const stakedBalance = await staking_async_function.getStakedBalanceWithValidator({
        accountId: payload.accountId,
        network: payload.network,
        validatorId: METEOR_VALIDATOR_BY_NETWORK[payload.network],
      });
      const nearDecimals = NEAR_METADATA.decimals;

      const nearDecimalsInBig = Big(10).pow(nearDecimals);

      const accountBalance = Big(stakedBalance).div(nearDecimalsInBig);

      const upgradeNearRequirement = 5;

      if (accountBalance.lt(Big(upgradeNearRequirement))) {
        stakedMoreThan5Near = false;
      }
      return {
        current_tier: tier,
        tier_name: "tier_name_2",
        tier_description: "tier_description_2",
        upgradable: stakedMoreThan5Near,
        current_benefits: [
          {
            icon_url:
              "https://storage.googleapis.com/meteor-static-data/harvest-moon/tier%20icons/contract-advanced.png",
            description: "chance_to_get_advanced_contract_during_harvest",
          },
          {
            icon_url:
              "https://storage.googleapis.com/meteor-static-data/harvest-moon/tier%20icons/clock.png",
            description: "harvest_anytime_without_waiting_period",
          },
        ],
        upgrade_to_unlock: [
          {
            icon_url:
              "https://storage.googleapis.com/meteor-static-data/harvest-moon/tier%20icons/contract-expert.png",
            description: "chance_to_get_expert_contract_during_harvest",
            type: "new",
          },
          {
            icon_url:
              "https://storage.googleapis.com/meteor-static-data/harvest-moon/tier%20icons/mountain.png",
            description: "unlock_missions_feature",
            type: "new",
          },
        ],
        conditions_to_unlock: [
          {
            onClick: payload.onClickStake,
            buttonTitle: "stake_5_near_in_meteor_validator",
            description: "stake_5_near_in_meteor_validator_description",
            progress: accountBalance.round(2, Big.roundDown).toFixed(),
            condition: "5",
            completed: stakedMoreThan5Near,
          },
        ],
      };
    } else {
      return {
        current_tier: tier,
        tier_name: "tier_name_3",
        tier_description: "tier_description_3",
        upgradable: false,
        current_benefits: [
          {
            icon_url:
              "https://storage.googleapis.com/meteor-static-data/harvest-moon/tier%20icons/contract-advanced.png",
            description: "chance_to_get_advanced_contract_during_harvest",
          },
          {
            icon_url:
              "https://storage.googleapis.com/meteor-static-data/harvest-moon/tier%20icons/clock.png",
            description: "harvest_anytime_without_waiting_period",
          },
          {
            icon_url:
              "https://storage.googleapis.com/meteor-static-data/harvest-moon/tier%20icons/contract-expert.png",
            description: "chance_to_get_expert_contract_during_harvest",
          },
          {
            icon_url:
              "https://storage.googleapis.com/meteor-static-data/harvest-moon/tier%20icons/mountain.png",
            description: "unlock_missions_feature",
          },
        ],
        upgrade_to_unlock: [
          {
            icon_url:
              "https://storage.googleapis.com/meteor-static-data/harvest-moon/tier%20icons/contract-advanced.png",
            description: "chance_to_get_advanced_contract_during_harvest",
          },
          {
            icon_url:
              "https://storage.googleapis.com/meteor-static-data/harvest-moon/tier%20icons/clock.png",
            description: "harvest_anytime_without_waiting_period",
          },
          {
            icon_url:
              "https://storage.googleapis.com/meteor-static-data/harvest-moon/tier%20icons/contract-expert.png",
            description: "chance_to_get_expert_contract_during_harvest",
          },
          {
            icon_url:
              "https://storage.googleapis.com/meteor-static-data/harvest-moon/tier%20icons/mountain.png",
            description: "unlock_missions_feature",
          },
          {
            icon_url:
              "https://storage.googleapis.com/meteor-static-data/harvest-moon/tier%20icons/mining.png",
            description: "automated_harvest",
            type: "new",
          },
          {
            icon_url:
              "https://storage.googleapis.com/meteor-static-data/harvest-moon/tier%20icons/tinker.png",
            description: "automated_recruit_when_you_get_contract_from_harvesting",
            type: "new",
          },
        ],
        conditions_to_unlock: [],
      };
    }
  } catch (err) {
    console.error(err);
    console.log({ ...(err as any) });
    throw err;
  }
}

async function getAllRelics({ network, accountId, harvestMoonContractId }: IOHarvestMoonContract) {
  const account = await getNearApi(network).nativeApi.account(accountId);
  const relics: IHarvestMoonRelic[] = await account.viewFunction({
    contractId: harvestMoonContractId,
    methodName: EHarvestMoon_SmartContractMethods.get_relic_list,
  });

  return relics;
}

async function getAccountAvailableRelics({
  network,
  accountId,
  harvestMoonContractId,
}: IOHarvestMoonContract): Promise<IHarvestMoonRelicWithNftInfo[]> {
  const account = await getNearApi(network).nativeApi.account("dontcare");

  const relics = await getAllRelics({
    network,
    accountId,
    harvestMoonContractId,
  });

  const contractSeriesIdRelicMap = new Set<string>();
  relics.map((v) => {
    contractSeriesIdRelicMap.add(v.nft_contract_id);
  });

  const allContractIds = Array.from(contractSeriesIdRelicMap);

  const relicsNfts = await Promise.all(
    allContractIds.map(async (contract_id) => {
      try {
        let [nftMetadata, nfts]: [INearNftMetadata, INearNftTokenData_WithMetadata[]] =
          await Promise.all([
            account.viewFunction({
              contractId: contract_id,
              methodName: "nft_metadata",
              args: {},
            }),
            account.viewFunction({
              contractId: contract_id,
              methodName: "nft_tokens_for_owner",
              args: {
                account_id: accountId,
                // default limit is 50, docs is a lie
                // TODO: Paginate this properly
                limit: 300,
              },
            }),
          ]);

        const relicsWithImageUrls = await Promise.all(
          nfts.map(async (nft) => {
            const nft_image_url = await nft_utils.constructNftTokenImgUrl(
              nftMetadata,
              nft.metadata,
            );
            const token_id_split = nft.token_id.split(":");
            const nft_series_id = token_id_split.length === 2 ? token_id_split[0] : "-1";

            const relic = relics.find(
              (e) => e.nft_contract_id === contract_id && e.nft_series_id === nft_series_id,
            );

            if (relic) {
              return {
                ...relic,
                nft_token_id: nft.token_id,
                nft_image_url,
              };
            } else {
              return null;
            }
          }),
        );

        const filteredRelicsWithImageUrls = relicsWithImageUrls.filter(
          (n) => n !== null,
        ) as IHarvestMoonRelicWithNftInfo[];

        return filteredRelicsWithImageUrls;
      } catch (err) {
        return [];
      }
    }),
  );
  return relicsNfts.flat();
}

async function equipRelic({
  network,
  accountId,
  harvestMoonContractId,
  relicTokenId,
  relicContractName,
}: IOHarvestMoonContract & {
  relicTokenId: string;
  relicContractName: string;
}) {
  const accountInfo = await getHarvestMoonAccountInfo({
    network,
    accountId,
    harvestMoonContractId,
  });

  if (!accountInfo) {
    throw new Error("Unable to retrieve account info");
  }

  if (accountInfo.gear_level === accountInfo.staked_relics.length) {
    throw new Error("Max relics reached. Try removing one first.");
  }

  const [res] = await NearAccountSignerExecutor.getInstance(
    accountId,
    network,
  ).startTransactionsAwait([
    {
      actions: [
        actionCreators.functionCall(
          "nft_transfer_call",
          {
            token_id: relicTokenId,
            msg: "staking relic",
            receiver_id: harvestMoonContractId,
          },
          // this magic number is copied from HM smart contract sh sample
          BigInt("300000000000000"),
          BigInt(NFT_TRANSFER_DEPOSIT),
        ),
      ],
      receiverId: relicContractName,
    } satisfies TTransactionSimpleNoSigner,
  ]);

  const walletSignedPayload: IMeteorBackendV2SignatureInfo = await hmutils_signPayload({
    accountId,
    network,
  });

  const meteorBackendV2Service = MeteorBackendV2Client.getInstance();

  try {
    await meteorBackendV2Service.updateHarvestMoonAccountInfo({
      walletSignedPayload,
    });
  } catch (err) {
    console.log(err, "failed to update hm account info on server. leaderboard might be incorrect");
  }

  return res;
}

async function unequipRelic({
  accountId,
  network,
  token_id,
  contract_id,
}: IOHarvestMoonContract & {
  token_id: string;
  contract_id: string;
}) {
  const walletSignedPayload: IMeteorBackendV2SignatureInfo = await hmutils_signPayload({
    accountId,
    network,
  });

  const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
  const resp = await meteorBackendV2Service.unequipRelic({
    walletSignedPayload,
    contract_id,
    token_id,
  });

  try {
    await meteorBackendV2Service.updateHarvestMoonAccountInfo({
      walletSignedPayload,
    });
  } catch (err) {
    console.log(err, "failed to update hm account info on server. leaderboard might be incorrect");
  }

  return resp;
}

async function upgradeGear({ accountId, network, harvestMoonContractId }: IOHarvestMoonContract) {
  const accountInfo = await getHarvestMoonAccountInfo({
    network,
    accountId,
    harvestMoonContractId,
  });

  if (!accountInfo) {
    throw new Error("Unable to retrieve account info");
  }

  const gearLevels = await getGearLevels({
    accountId,
    network,
    harvestMoonContractId,
  });

  if (gearLevels.length === 0) {
    throw new Error("No gear levels");
  }

  const maxGearLevel = gearLevels[gearLevels.length - 1].level;

  if (accountInfo.gear_level === maxGearLevel) {
    throw new Error("Max gear level reached");
  }

  const currentLevelInfo = gearLevels.find((e) => e.level === accountInfo.gear_level);

  if (!currentLevelInfo) {
    throw new Error("Unable to locate current gear level info");
  }

  const moon_required_to_level_up = new Big(
    currentLevelInfo?.moon_required_to_level_up ?? 0,
  ).toFixed();

  const [res] = await NearAccountSignerExecutor.getInstance(
    accountId,
    network,
  ).startTransactionsAwait([
    {
      receiverId: gear_staking_constants[network].gearTokenContractId,
      actions: [
        actionCreators.functionCall(
          "ft_transfer_call",
          {
            receiver_id: harvestMoonContractId,
            amount: moon_required_to_level_up,
            msg: "upgrade gear level",
          },
          BigInt("300000000000000"),
          BigInt(NFT_TRANSFER_DEPOSIT),
        ),
      ],
    } satisfies TTransactionSimpleNoSigner,
  ]);

  return res;
}

async function getRelicCapacityByGearLevel({
  accountId,
  network,
  harvestMoonContractId,
  gearLevel,
}: IOHarvestMoonContract & {
  gearLevel: number;
}) {
  const account = await getNearApi(network).nativeApi.account(accountId);
  const capacity: number = await account.viewFunction({
    contractId: harvestMoonContractId,
    methodName: EHarvestMoon_SmartContractMethods.get_gear_level_relic_capacity,
    args: {
      level: gearLevel,
    },
  });
  return capacity;
}

async function getGearUpgradeCostByGearLevel({
  accountId,
  network,
  harvestMoonContractId,
  gearLevel,
}: IOHarvestMoonContract & {
  gearLevel: number;
}) {
  const account = await getNearApi(network).nativeApi.account(accountId);
  const cost: number = await account.viewFunction({
    contractId: harvestMoonContractId,
    methodName: EHarvestMoon_SmartContractMethods.get_gear_level_upgrade_cost,
    args: {
      level: gearLevel,
    },
  });
  return cost;
}

async function getGearLevels({ accountId, network, harvestMoonContractId }: IOHarvestMoonContract) {
  const account = await getNearApi(network).nativeApi.account(accountId);
  const capacity: IHarvestMoonGearLevel[] = await account.viewFunction({
    contractId: harvestMoonContractId,
    methodName: EHarvestMoon_SmartContractMethods.get_gear_levels,
  });
  return capacity;
}

async function forgeRelic({
  accountId,
  network,
  contractId,
}: IWithAccountIdAndNetwork & { contractId: string }) {
  const [res] = await NearAccountSignerExecutor.getInstance(
    accountId,
    network,
  ).startTransactionsAwait([
    {
      receiverId: gear_staking_constants[network].gearTokenContractId,
      actions: [
        actionCreators.functionCall(
          "ft_transfer_call",
          {
            receiver_id: contractId,
            amount: HARVEST_MOON_RELICS[network].relicForgePrice,
            msg: "forge gear",
          },
          BigInt("300000000000000"),
          BigInt(NFT_TRANSFER_DEPOSIT),
        ),
      ],
    } satisfies TTransactionSimpleNoSigner,
  ]);

  return res;
}

export enum ERelicSlotType {
  occupied = "occupied",
  locked = "locked",
  empty = "empty",
}

type TOccupiedSlot = {
  slot_variant: ERelicSlotType.occupied;
  nft_image: string;
} & IHarvestMoonStakedRelics;

type TEmptySlot = {
  slot_variant: ERelicSlotType.empty;
};

type TLockedSlot = {
  slot_variant: ERelicSlotType.locked;
  force_lock?: boolean;
};

export type TSlot = TOccupiedSlot | TEmptySlot | TLockedSlot;

async function getRelicSlotsWithNftImage({
  accountId,
  network,
  harvestMoonContractId,
  harvestMoonAccountData,
}: IOHarvestMoonContract & {
  harvestMoonAccountData: IHarvestMoonAccountData;
}): Promise<TSlot[]> {
  const gearLevels = await getGearLevels({
    accountId,
    network,
    harvestMoonContractId,
  });

  const maxCapacity = 5;

  const totalRelicSlot = gearLevels[gearLevels.length - 1].relic_capacity;
  let unlockedSlotCount =
    gearLevels.find((e) => e.level === harvestMoonAccountData.gear_level)?.relic_capacity || 0;
  const stakedRelics = _.cloneDeep(harvestMoonAccountData.staked_relics);
  const tokenIdsByContract = new Map<string, string[]>();

  stakedRelics.map((v) => {
    const tokenIds = tokenIdsByContract.get(v.relic_nft_contract_id) || [];
    tokenIdsByContract.set(v.relic_nft_contract_id, [...tokenIds, v.relic_nft_token_id]);
  });

  const account = await getNearApi(network).nativeApi.account("dontcare");

  const nftImage = new Map<string, string>();

  await Promise.all(
    Array.from(tokenIdsByContract.keys()).map(async (contractId) => {
      try {
        const contractMetadata: INearNftMetadata = await account.viewFunction({
          contractId: contractId,
          methodName: "nft_metadata",
          args: {},
        });

        const contractTokens = tokenIdsByContract.get(contractId);
        if (contractTokens) {
          await Promise.all(
            contractTokens.map(async (tokenId) => {
              const nft: INearNftTokenData_WithMetadata = await account.viewFunction({
                contractId,
                methodName: "nft_token",
                args: {
                  token_id: tokenId,
                },
              });
              const nftImageUrl = await nft_utils.constructNftTokenImgUrl(
                contractMetadata,
                nft.metadata,
              );
              nftImage.set(`${contractId}_${nft.token_id}`, nftImageUrl);
            }),
          );
        }
      } catch (err) {
        console.log("Failed to get relic nft image.", err);
      }
    }),
  );

  const relicSlots: TSlot[] = [];

  let totalBoostRate = 0;
  for (let i = 0; i < totalRelicSlot; i++) {
    let type: ERelicSlotType = ERelicSlotType.locked;
    if (unlockedSlotCount > 0) {
      unlockedSlotCount--;
      type = ERelicSlotType.empty;
    }
    if (stakedRelics.length > 0) {
      type = ERelicSlotType.occupied;
      const stakedRelic = stakedRelics.shift();
      if (stakedRelic) {
        totalBoostRate += stakedRelic.multiplier_in_percent;

        relicSlots.push({
          slot_variant: type,
          ...stakedRelic,
          nft_image:
            nftImage.get(
              `${stakedRelic.relic_nft_contract_id}_${stakedRelic.relic_nft_token_id}`,
            ) || "",
        });
      }
    } else {
      if (i + 1 > maxCapacity) {
        relicSlots.push({
          slot_variant: ERelicSlotType.locked,
          force_lock: true,
        });
      } else {
        relicSlots.push({
          slot_variant: type,
        });
      }
    }
  }

  return relicSlots;
}

async function exchangeAssetForMoon({
  network,
  accountId,
  harvestMoonContractId,
  burnContractId,
  burnAmount,
}: IWithAccountIdAndNetwork & {
  harvestMoonContractId: string;
  burnContractId: string;
  burnAmount: number;
}): Promise<FinalExecutionOutcome> {
  const [res] = await NearAccountSignerExecutor.getInstance(
    accountId,
    network,
  ).startTransactionsAwait([
    {
      receiverId: harvestMoonContractId,
      actions: [
        near_action_creators.functionCall({
          contractId: harvestMoonContractId,
          methodName: "exchange_for_moon",
          gas: BigInt(300000000000000),
          args: {
            burn_token_id: burnContractId,
            burn_amount: burnAmount,
          },
        }),
      ],
    },
  ]);
  return res;
}

async function exchangeAssetForContract({
  accountId,
  network,
  burn_token_id,
  union_contract_type,
  amount,
}: IWithAccountIdAndNetwork & IBurnAsset_Input) {
  const walletSignedPayload: IMeteorBackendV2SignatureInfo = await hmutils_signPayload({
    accountId,
    network,
  });

  const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
  const resp = await meteorBackendV2Service.exchangeAssetForContract({
    walletSignedPayload,
    burn_token_id,
    union_contract_type,
    amount,
  });

  try {
    await meteorBackendV2Service.updateHarvestMoonAccountInfo({
      walletSignedPayload,
    });
  } catch (err) {
    console.log(err, "failed to update hm account info on server. leaderboard might be incorrect");
  }

  return resp;
}

async function updateReferrer({
  accountId,
  network,
  newReferrerWalletId,
}: IWithAccountIdAndNetwork & { newReferrerWalletId: string }) {
  const walletSignedPayload: IMeteorBackendV2SignatureInfo = await hmutils_signPayload({
    accountId,
    network,
  });

  const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
  const resp = await meteorBackendV2Service.updateReferrer({
    walletSignedPayload,
    newReferrerWalletId,
  });

  return resp;
}

async function getTokenDropCampaigns({
  accountId,
  network,
  includeCriteriaResult,
}: IWithAccountIdAndNetwork & { includeCriteriaResult?: boolean }): Promise<ITokenDropCampaign[]> {
  const walletSignedPayload: IMeteorBackendV2SignatureInfo = await hmutils_signPayload({
    accountId,
    network,
  });

  const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
  const resp = await meteorBackendV2Service.getTokenDropCampaigns({
    walletSignedPayload,
    includeCriteriaResult,
  });

  return resp;
}

async function enrollTokenDropCampaign({
  accountId,
  network,
  tokenDropCampaignId,
  rewardTokenId,
}: IWithAccountIdAndNetwork & {
  tokenDropCampaignId: number;
  rewardTokenId: string;
}) {
  await account_async_functions.checkAndDepositStorage({
    network,
    accountId,
    contractId: rewardTokenId,
    storageDepositAmount: BigInt(toYoctoNear("0.0125")),
    gasAmount: BigInt(300000000000000),
  });

  const walletSignedPayload: IMeteorBackendV2SignatureInfo = await hmutils_signPayload({
    accountId,
    network,
  });

  const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
  const resp = await meteorBackendV2Service.enrollTokenDropCampaign({
    walletSignedPayload,
    tokenDropCampaignId,
  });

  return resp;
}

export const harvest_moon_async_functions = {
  signMessage,
  isWalletWhitelisted,
  getAccessInfoFromBackend,
  getHarvestMoonConfig,
  getHarvestMoonAccountInfo,
  addFunctionCallAccessKey,
  initHarvestMoonAccount,
  testDeleteHarvestMoonAccount,
  getUnclaimedRewards,
  getReferralStats,
  harvest,
  recruitTinkers,
  getHarvestShareImage,
  getRecruitShareImage,
  getLeaderBoard,
  getLeaderBoardMission,
  getHarvestMoonAccountInfoForWallets,
  upgradeLab,
  upgradeContainer,
  upgradeTier,
  getTier,
  getTierConditions,
  getTierUpgradable,
  remindFriendHarvest,
  getAccountAvailableRelics,
  equipRelic,
  unequipRelic,
  getAllRelics,
  upgradeGear,
  getRelicCapacityByGearLevel,
  getGearUpgradeCostByGearLevel,
  getGearLevels,
  forgeRelic,
  getRelicSlotsWithNftImage,
  getContractDropRate,
  exchangeAssetForMoon,
  exchangeAssetForContract,
  getMoonProductionRate,
  updateReferrer,
  getHarvestMoonTinkerFusionInfo,
  upgradeTinker,
  upgradeTinkerWithGear,
  getTokenDropCampaigns,
  enrollTokenDropCampaign,
};
