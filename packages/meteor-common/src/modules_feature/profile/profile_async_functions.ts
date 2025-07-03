import { actionCreators } from "@near-js/transactions";
import { getNearApi } from "../../modules_external/near/clients/near_api_js/NearApiJsClient";
import {
  NEARSOCIAL_CONTRACT_ID,
  NEARSOCIAL_DEPOSIT,
  NEARSOCIAL_GAS,
  NEARSOCIAL_UPDATE_PROFILE_DEPOSIT,
} from "../../modules_external/near_social/near_social_constants";
import { NEARSOCIAL_TESTNET_CONTRACT_ID } from "../../modules_external/near_social/near_social_constants";
import { MeteorActionError } from "../../modules_utility/api_utilities/async_action_utils";
import { IpfsCacheApi } from "../../modules_utility/ipfs/IpfsCacheApi";
import { EOldMeteorErrorId } from "../../modules_utility/old_errors/old_error_ids";
import { NearAccountSignerExecutor } from "../accounts/near_signer_executor/NearAccountSignerExecutor";
import { near_action_creators } from "../accounts/transactions/near_action_creators";
import {
  EAccountSocialProfileType,
  IAccountSocialProfile,
  TIOGrantPermission_Input,
  TIOReadProfile_Input,
  TIOReadProfile_Output,
  TIOUpdatePfp_Input,
  TIOUpdateProfile_Input,
} from "./profile_types";

export const profile_async_function = {
  readProfile,
  checkPermission,
  grantPermission,
  updateProfile,
  updatePFP,
};

async function readProfile({
  accountId,
  network,
}: TIOReadProfile_Input): Promise<TIOReadProfile_Output> {
  if (network === "mainnet" || network === "testnet") {
    // Get data from near social smart contract
    const contractId =
      network === "mainnet" ? NEARSOCIAL_CONTRACT_ID : NEARSOCIAL_TESTNET_CONTRACT_ID;
    const account = await getNearApi(network).nativeApi.account(accountId);
    const result = await account.viewFunction({
      contractId,
      methodName: "get",
      args: { keys: [`${accountId}/**`] },
    });

    // Check if have data at near social
    if (result[accountId]?.profile) {
      const profile = result[accountId]?.profile;
      return {
        name: profile.name,
        desc: profile.description,
        twitter: profile.linktree?.twitter,
        telegram: profile.linktree?.telegram,
        // follower: numOfFollower,
        pfp:
          profile.image?.url ||
          (profile.image?.ipfs_cid &&
            `https://i.near.social/magic/thumbnail/https://near.social/magic/img/account/${accountId}`) ||
          (profile.image?.nft &&
            IpfsCacheApi.getNftTokenImgUrl(
              network,
              profile.image.nft?.contractId,
              profile.image.nft?.tokenId,
            )),
        type: EAccountSocialProfileType.NEAR_SOCIAL,
      };
    }
  }

  // Get profile data from local storage
  const profileData = window.localStorage.getItem("profile_data");
  if (profileData && JSON.parse(profileData)[accountId] !== undefined) {
    let profileJSON = JSON.parse(profileData)[accountId];
    return {
      name: profileJSON.name,
      telegram: profileJSON.telegram,
      twitter: profileJSON.twitter,
      desc: profileJSON.desc,
      pfp: profileJSON?.image,
      type: EAccountSocialProfileType.LOCAL,
    };
  }

  return { type: EAccountSocialProfileType.LOCAL };
}

async function checkPermission({
  accountId,
  network,
  publicKey,
}: TIOGrantPermission_Input): Promise<TIOReadProfile_Output> {
  const account = await getNearApi(network).nativeApi.account(accountId);
  const result = await account.viewFunction({
    contractId: NEARSOCIAL_CONTRACT_ID,
    methodName: "is_write_permission_granted",
    args: { key: accountId, account_id: accountId },
  });

  return result;
}

async function updateProfile({
  accountId,
  network,
  type,
  name,
  desc,
  twitter,
  telegram,
  pfp,
}: TIOUpdateProfile_Input) {
  // Update to local storage
  if (type === "local") {
    // Get profile data & update to local storage
    const profileData = window.localStorage.getItem("profile_data");
    let profileJSON: IAccountSocialProfile[] = profileData ? JSON.parse(profileData) : [];
    if (profileJSON[accountId]) {
      profileJSON[accountId] = {
        ...profileJSON[accountId],
        desc,
        twitter,
        telegram,
      };
      window.localStorage.setItem("profile_data", JSON.stringify(profileJSON));
    } else {
      profileJSON[accountId] = {
        desc: desc,
        twitter: twitter,
        telegram: telegram,
      };
      window.localStorage.setItem("profile_data", JSON.stringify(profileJSON));
    }

    return profileJSON[accountId];
  }
  // Update to near social
  else {
    try {
      const [resp] = await NearAccountSignerExecutor.getInstance(
        accountId,
        network,
      ).startTransactionsAwait([
        {
          receiverId: NEARSOCIAL_CONTRACT_ID,
          actions: [
            actionCreators.functionCall(
              "set",
              {
                data: {
                  [accountId]: {
                    profile: {
                      name: name,
                      description: desc,
                      image: {
                        url: pfp,
                      },
                      linktree: {
                        telegram: telegram,
                        twitter: twitter,
                      },
                    },
                  },
                },
              },
              BigInt(NEARSOCIAL_GAS),
              BigInt(NEARSOCIAL_UPDATE_PROFILE_DEPOSIT),
            ),
          ],
        },
      ]);

      return resp;
    } catch (error) {
      console.error(error);
      console.log({ ...(error as any) });

      throw new MeteorActionError([EOldMeteorErrorId.merr_profile_update_failed]);
    }
  }
}

async function updatePFP({ accountId, network, pfp, type }: TIOUpdatePfp_Input) {
  // Update to local storage
  if (type === "local") {
    // Get profile data & update to local storage
    const profileData = window.localStorage.getItem("profile_data");
    if (profileData && JSON.parse(profileData)[accountId] !== undefined) {
      let profileJSON = JSON.parse(profileData);
      profileJSON[accountId].image = pfp;
      window.localStorage.setItem("profile_data", JSON.stringify(profileJSON));
    } else if (profileData) {
      let profileJSON = JSON.parse(profileData);
      profileJSON[accountId] = {
        image: pfp,
      };
      window.localStorage.setItem("profile_data", JSON.stringify(profileJSON));
    } else {
      let profileJSON = {};
      profileJSON[accountId] = {
        image: pfp,
      };
      window.localStorage.setItem("profile_data", JSON.stringify(profileJSON));
    }

    return "Updated to local storage";
  }

  // Update to near social
  else {
    try {
      const [resp] = await NearAccountSignerExecutor.getInstance(
        accountId,
        network,
      ).startTransactionsAwait([
        {
          receiverId: NEARSOCIAL_CONTRACT_ID,
          actions: [
            actionCreators.functionCall(
              "set",
              {
                data: {
                  [accountId]: {
                    profile: {
                      image: {
                        ipfs_cid: null,
                        nft: {
                          contractId: null,
                          tokenId: null,
                        },
                        url: pfp,
                      },
                    },
                  },
                },
              },
              BigInt(NEARSOCIAL_GAS),
              BigInt(NEARSOCIAL_UPDATE_PROFILE_DEPOSIT),
            ),
          ],
        },
      ]);

      return resp;
    } catch (error) {
      console.error(error);
      console.log({ ...(error as any) });

      throw new MeteorActionError([EOldMeteorErrorId.merr_profile_update_pfp_failed]);
    }
  }
}

async function grantPermission({ accountId, network, publicKey, pfp }: TIOGrantPermission_Input) {
  const [res] = await NearAccountSignerExecutor.getInstance(
    accountId,
    network,
  ).startTransactionsAwait([
    {
      receiverId: NEARSOCIAL_CONTRACT_ID,
      actions: [
        near_action_creators.functionCall({
          contractId: NEARSOCIAL_CONTRACT_ID,
          methodName: "grant_write_permission",
          args: {
            public_key: publicKey,
            keys: [accountId],
          },
          gas: BigInt(NEARSOCIAL_GAS),
          attachedDeposit: BigInt(NEARSOCIAL_DEPOSIT),
        }),
      ],
    },
    {
      receiverId: NEARSOCIAL_CONTRACT_ID,
      actions: [
        actionCreators.functionCall(
          "set",
          {
            data: {
              [accountId]: {
                profile: {
                  image: {
                    ipfs_cid: null,
                    nft: {
                      contractId: null,
                      tokenId: null,
                    },
                    url: pfp,
                  },
                },
              },
            },
          },
          BigInt(NEARSOCIAL_GAS),
          BigInt(NEARSOCIAL_UPDATE_PROFILE_DEPOSIT),
        ),
      ],
    },
  ]);
  return res;
}
