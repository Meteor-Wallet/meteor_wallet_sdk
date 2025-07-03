import Big from "big.js";
import { uniqueId } from "lodash";
import { MeteorBackendV2Client } from "../../modules_external/meteor_v2_api/MeteorBackendV2Client";
import { OLD_MeteorV2ApiClient } from "../../modules_external/meteor_v2_api/OLD_MeteorV2ApiClient";
import { getFungibleTokensService } from "../../modules_external/near/services/near_fungible_tokens_service";
import { getMeteorRewardService } from "../../modules_external/near/services/near_meteor_reward_service";
import { getNonFungibleTokensApi } from "../../modules_external/near/services/near_non_fungible_tokens_service";
import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";
import { IWithAccountIdAndNetwork } from "../../modules_external/near/types/near_input_helper_types";
import {
  formatTokenAmount,
  removeTrailingZeros,
} from "../../modules_external/near/utils/near_formatting_utils";
import { IpfsCacheApi } from "../../modules_utility/ipfs/IpfsCacheApi";
import { NEAR_METADATA, WNEAR_METADATA } from "../fungible_tokens/fungible_tokens_constants";
import { getWrapNearTokenContractId } from "../fungible_tokens/fungible_tokens_utils";
import { hmutils_signPayload } from "../harvest_moon/harvest_moon_utils";
import { getMeteorPointsContractId } from "../missions/mission.utils";
import { IMeteorResponse } from "../relayer/Relayer.interfaces";
import { DBI_RewardRedemptionRecord } from "./reward_redemption_records/reward_redemption_records.dbi";
import { EBlockchain } from "./reward_redemption_records/reward_redemption_records.zod";
import {
  ERewardSourceType,
  ERewardStatus,
  ETokenType,
  IClaimableList,
  ICreateMeteorRewardRedemptionRecord,
  IPackPool,
  IRewardPackList,
  IRewardPacksPublishRecord,
} from "./rewards_types";

async function createMeteorRewardRedemptionRecord({
  data,
}: ICreateMeteorRewardRedemptionRecord): Promise<IMeteorResponse<DBI_RewardRedemptionRecord>> {
  return fetch(OLD_MeteorV2ApiClient.getBaseUrl() + "reward_redemption_records", {
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(data),
  }).then((res) => res.json());
}

const getRewardsList = async ({
  network,
}: {
  network: ENearNetwork;
}): Promise<{
  status: number;
  message: string;
  data: IRewardPacksPublishRecord;
}> => {
  return await fetch(
    OLD_MeteorV2ApiClient.getBaseUrl() + `reward_packs_publish_records?network_id=${network}`,
    {
      headers: {
        "content-type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
      },
      method: "GET",
    },
  ).then((res) => res.json());
};

const getUserPoint = async ({ network, accountId }: IWithAccountIdAndNetwork) => {
  const rewardService = await getMeteorRewardService(network);
  const ftService = await getFungibleTokensService(network);

  const metadata = await ftService.getMetadata({
    contractId: getMeteorPointsContractId(network),
  });

  const pointsAmount = await rewardService.viewUserRewardPoint({
    network,
    accountId,
  });
  const formatedPoint = formatTokenAmount(pointsAmount, metadata.decimals);

  return {
    metadata,
    formatedPoint,
  };
};

const getUserRewardsList = async ({ network }: { network: ENearNetwork }) => {
  const rewardListService = await getRewardsList({ network });
  const packlist = rewardListService.data.reward_packs;

  const ftService = getFungibleTokensService(network);
  const nftService = getNonFungibleTokensApi(network);

  let prizePool: IPackPool = {};

  // assign all pack Id
  packlist.map((pack) => {
    prizePool[pack.id] = [];
  });

  // push all massaged data
  packlist.map(async (pack) => {
    await Promise.all(
      pack.reward_pack_assets.map(async (packAssets) => {
        const winRateRatio: number = packAssets.weight;

        const tokenType = packAssets.asset_type.toUpperCase();

        if (tokenType === ETokenType.FT) {
          const metadata = await ftService.getMetadata({
            contractId: packAssets.asset_id,
          });

          prizePool[pack.id].push({
            name: metadata.name,
            imageUrl: metadata.icon ?? "",
            winRate: winRateRatio,
          });
        }

        if (tokenType === ETokenType.NFT) {
          const metadata = await nftService.getMetadata({
            contractName: packAssets.asset_id,
          });

          prizePool[pack.id].push({
            name: metadata.name,
            imageUrl: metadata.icon ?? "",
            winRate: winRateRatio,
          });
        }

        if (tokenType === ETokenType.CONTENT) {
          prizePool[pack.id].push({
            name: "Mystery Gift",
            imageUrl: "",
            winRate: winRateRatio,
          });
        }
      }),
    );
  });

  const rewardService = await getMeteorRewardService(network);
  const soldArr = await rewardService.viewPackSoldQty();

  // finalize data set
  const finalResult: IRewardPackList[] = await Promise.all(
    packlist.map(async (pack) => {
      let possibleRewardText: string[] = [];
      pack.reward_pack_assets.map((packAssets) => {
        let rewardObj = `${packAssets.weight}% - ${packAssets.display_name}`;
        possibleRewardText.push(rewardObj);
      });

      const findSoldQty = soldArr.find((element) => element[0] === pack.id);
      const soldQty = findSoldQty ? findSoldQty[1] : 0;
      const packSupplyLeft = pack.supply - soldQty;

      return {
        price: pack.price.toString(),
        packId: pack.id.toString(),
        packImageUrl: pack.display_image,
        packName: pack.display_name,
        packDescription: pack.description,
        prizePool: prizePool[pack.id],
        packPromote: possibleRewardText,
        requiredCode: "",
        // networkConfigMeteorRewards[network].pack_details[packId].requiredCode,
        redeemAndClaim: true,
        // networkConfigMeteorRewards[network].pack_details[packId]
        //   .redeemAndClaim,
        packTotalSupply: pack.supply,
        packLeft: packSupplyLeft,
      } satisfies IRewardPackList;
    }),
  );

  return finalResult;
};

const getUserClaimableList = async ({
  network,
  accountId,
}: IWithAccountIdAndNetwork): Promise<IClaimableList[] | null> => {
  const rewardService = await getMeteorRewardService(network);

  const ftService = await getFungibleTokensService(network);
  const nftService = await getNonFungibleTokensApi(network);

  const response = await rewardService.viewUserClaimableList({
    account_id: accountId,
  });

  let massageData: IClaimableList[] = [];
  // what rust contract look like:
  //  pub nft: Vec<(AccountId, Vec<String>)>,
  //  pub ft:  Vec<(AccountId, u128)>,
  // exmaple:
  // const response = {
  //   nft: [
  //     ["mnft1.testcandy.testnet", ["17", "18"]],
  //     ["mnft1.testcandy.testnet", ["19", "20"]],
  //   ],
  //   ft: [
  //     ["mt1.testcandy.testnet", 1200000000],
  //     ["mt2.testcandy.testnet", 180000],
  //   ],
  //   content: ["OPS!", "OPS!", "OPS!"],
  // };

  if (!response) {
    // set null, if user no claimable list, contract's response return null
    return response;
  } else {
    // massage data
    await Promise.all(
      Object.keys(response).map(async (type) => {
        if (type === "nft") {
          await Promise.all(
            response[type].map(async ([contractId, nftIds]) => {
              // console.log(contractId, nftIds, "hello");
              if (Array.isArray(nftIds)) {
                await Promise.all(
                  nftIds.map(async (nftId) => {
                    // get nft images:

                    const imageUrl = IpfsCacheApi.getNftTokenImgUrl(network, contractId, nftId);

                    // get nft info
                    const { metadata } = await nftService.getNftToken({
                      tokenId: nftId,
                      contractName: contractId as string,
                    });

                    // push
                    massageData.push({
                      id: uniqueId(),
                      assetType: "NFT",
                      name: metadata.title as string,
                      imageUrl,
                      nftId,
                      contractId: contractId as string,
                      nftDescription: metadata.description as string,
                    });
                  }),
                );
              }
            }),
          );
        }

        if (type == "ft") {
          await Promise.all(
            response[type].map(async ([contractId, tokenAmount]) => {
              const metadata = await ftService.getMetadata({
                contractId: contractId as string,
              });

              // const imageUrl = IpfsCacheApi.getFtContractImgUrl(
              //   network,
              //   contractId,
              // );

              // console.log(imageUrl);

              // console.log(metadata, "metadata");

              if (typeof tokenAmount == "number" && tokenAmount > 0) {
                massageData.push({
                  id: uniqueId(),
                  assetType: "FT",
                  name: metadata.name as string,
                  imageUrl: metadata.icon as string,
                  contractId: contractId as string,
                  tokenAmount: tokenAmount,
                  decimal: metadata.decimals,
                });
              }
            }),
          );
        }

        if (type == "content") {
          response[type].map((content) => {
            massageData.push({
              id: uniqueId(),
              assetType: "Mystery Gift",
              name: content,
              imageUrl: content.toLowerCase().includes("coffee")
                ? "https://coffee.alexflipnote.dev/6asrYJORGlo_coffee.png"
                : "https://i.ibb.co/jLyjRsQ/Whats-App-Image-2023-11-09-at-10-28-14.jpg", // host here..
            });
          });
        }
      }),
    );
  }

  return massageData;
};

const redeemReward = async ({
  network,
  accountId,
  packId,
  amount,
  withRelayer,
}: IWithAccountIdAndNetwork & {
  packId: string;
  amount: string;
  withRelayer: boolean;
}) => {
  const rewardService = await getMeteorRewardService(network);
  const ftService = await getFungibleTokensService(network);
  const nftService = await getNonFungibleTokensApi(network);

  const response = await rewardService.redeem({
    account_id: accountId,
    packId,
    amount,
    withRelayer,
  });

  // Notes: show user what their got after redeem by using `receipts_outcome`

  // Notes: relayer outcome index at 4, previously was 3
  // const result = response.receipts_outcome[4].outcome.logs[1];
  const result = response.receipts_outcome[withRelayer ? 4 : 3].outcome.logs.find((log) =>
    log.includes("Asset"),
  );
  const transactionHash = response.transaction_outcome.id;

  if (result) {
    const contractAddress = result.split(" ")[2];

    const rewardListService = await getRewardsList({ network });
    const packlist = rewardListService.data.reward_packs;

    const tokenType = packlist
      .find((pack) => pack.id.toString() === packId)
      ?.reward_pack_assets.find((asset) => asset.asset_id === contractAddress)
      ?.asset_type.toUpperCase();

    let toastMessage = "";

    if (tokenType === ETokenType.FT) {
      const { name, decimals, symbol } = await ftService.getMetadata({
        contractId: contractAddress,
      });

      // Notes: relayer outcome index at 4, previously was 3
      const rewardAmountLog = response.receipts_outcome[4].outcome.logs.find((log) =>
        log.includes("Reward Amount"),
      );
      let rewardAmount = rewardAmountLog ? rewardAmountLog.split(" ")[2] : "0";
      if (rewardAmount === undefined) {
        rewardAmount = "0";
      }

      toastMessage = `You got token: ${
        symbol === WNEAR_METADATA.symbol ? NEAR_METADATA.name : name
      }!, Amount: ${
        formatTokenAmount(rewardAmount.toString(), decimals, decimals)
          .split(".")[1]
          .split("")
          .every((char) => char === "0")
          ? removeTrailingZeros(formatTokenAmount(rewardAmount.toString(), decimals))
          : removeTrailingZeros(formatTokenAmount(rewardAmount.toString(), decimals, decimals))
      }`;

      await createMeteorRewardRedemptionRecord({
        data: {
          blockchain_id: EBlockchain.near,
          network_id: network,
          wallet_id: accountId,
          pack_id: packId,
          reward_item_id: contractAddress,
          reward_item_amount: rewardAmount.toString(),
          redeem_trx_hash: transactionHash,
        },
      });
    }

    if (tokenType === ETokenType.NFT) {
      const { name } = await nftService.getMetadata({
        contractName: contractAddress,
      });

      toastMessage = `You got a ${name} NFT!`;

      await createMeteorRewardRedemptionRecord({
        data: {
          blockchain_id: EBlockchain.near,
          network_id: network,
          wallet_id: accountId,
          pack_id: packId,
          reward_item_id: contractAddress,
          reward_item_amount: "1",
          redeem_trx_hash: transactionHash,
        },
      });
    }

    if (tokenType === ETokenType.CONTENT) {
      // toastMessage = `You got a mystery gift: "${networkConfigMeteorRewards[network].reward_text[contractAddress]}"`;
      toastMessage = `You got a mystery gift`;

      await createMeteorRewardRedemptionRecord({
        data: {
          blockchain_id: EBlockchain.near,
          network_id: network,
          wallet_id: accountId,
          pack_id: packId,
          reward_item_id: contractAddress,
          reward_item_amount: "1",
          redeem_trx_hash: transactionHash,
        },
      });
    }

    return { toastMessage };
  }
};

const claimNTFReward = async ({
  accountId,
  network,
  claim,
}: IWithAccountIdAndNetwork & { claim: IClaimableList }) => {
  const rewardService = await getMeteorRewardService(network);
  await rewardService.claimNFTReward({
    reward_token_contract: claim.contractId as string,
    account_id: accountId,
    token_id: claim.nftId as string,
  });
};

const claimFTReward = async ({
  accountId,
  network,
  claim,
}: IWithAccountIdAndNetwork & { claim: IClaimableList }) => {
  const rewardService = await getMeteorRewardService(network);
  await rewardService.claimFtReward({
    reward_token_contract: claim.contractId as string,
    account_id: accountId,
    amount: new Big(`${claim.tokenAmount}`).toFixed(),
  });

  const ftService = await getFungibleTokensService(network);
  if (claim.contractId === getWrapNearTokenContractId(network)) {
    await ftService.unwrapNear({
      network,
      accountId,
      unwrapAmount: claim.tokenAmount ?? 0,
    });
  }
};

async function claimReward({ network, walletId, code }) {
  return fetch(OLD_MeteorV2ApiClient.getBaseUrl() + "claim-content", {
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      blockchain_id: "near",
      network_id: network,
      wallet_id: walletId,
      code,
    }),
  }).then((res) => res.json());
}

async function getUnopenRewards({
  accountId,
  limit,
  network,
}: IWithAccountIdAndNetwork & { limit: number }) {
  const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
  const rewards = await meteorBackendV2Service.getUnopenRewards({
    limit,
    networkId: network,
    walletId: accountId,
  });

  return rewards;
}

async function openRewards({
  accountId,
  network,
  rewardIds,
}: IWithAccountIdAndNetwork & { rewardIds: number[] }) {
  const walletSignedPayload = await hmutils_signPayload({ accountId, network });

  const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
  return await meteorBackendV2Service.openRewards({
    walletSignedPayload,
    rewardIds,
  });
}

async function getRewardCount({
  accountId,
  network,
  rewardSourceType,
  campaignId,
  rewardStatus,
}: IWithAccountIdAndNetwork & {
  rewardSourceType: ERewardSourceType;
  rewardStatus: ERewardStatus;
  campaignId?: string;
}) {
  const walletSignedPayload = await hmutils_signPayload({ accountId, network });

  const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
  return await meteorBackendV2Service.getRewardCount({
    walletSignedPayload,
    rewardSourceType,
    campaignId,
    rewardStatus,
  });
}

export const rewards_async_functions = {
  getRewardsList,
  getUserPoint,
  getUserRewardsList,
  getUserClaimableList,
  redeemReward,
  claimNTFReward,
  claimFTReward,
  claimReward,
  getUnopenRewards,
  openRewards,
  getRewardCount,
};
