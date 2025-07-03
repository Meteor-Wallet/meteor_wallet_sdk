import { nanoid } from "nanoid";
import {
  EProfileStatus,
  EWalletUserVersion,
  IAppUserProfile_Old,
  IAppWalletUser_New,
} from "../../../modules_feature/accounts/account_types";
import { NEAR_TOKEN_ID } from "../../../modules_feature/staking/staking_constants";
import { EStakingType, EStakingView } from "../../../modules_feature/staking/staking_types";
import { MeteorEncryptionUtils } from "../../../modules_utility/cryptography/MeteorEncryptionUtils";
import {
  IAccountSendFtState,
  IAccountSendNftState,
  IAccountStakeNearState,
  IAccountUnstakeState,
} from "./AppStore_types";

export const AppStateDefault_profile: () => IAppUserProfile_Old = () => {
  const profileId = nanoid();

  return {
    id: profileId,
    currentAccountNum: 0,
    status: EProfileStatus.FRESH,
    addresses: {
      recentlyUsed: [],
      saved: [],
    },
    knownExternalKeys: [],
    accounts: [],
  };
};

export const AppStateDefault_walletUser: () => IAppWalletUser_New = () => {
  const walletUserId = nanoid();

  return {
    id: walletUserId,
    userSalt: MeteorEncryptionUtils.getNewWalletUserSalt(),
    addresses: {
      recentlyUsed: [],
      saved: [],
    },
    accounts: [],
    currentAccountNum: 0,
    knownExternalKeys: [],
    walletUserVersion: EWalletUserVersion.V202301,
  };
};

export const AppStateDefault_sendFtState: () => IAccountSendFtState = () => {
  return {
    selectedContractName: NEAR_TOKEN_ID,
    selectedContractSymbol: NEAR_TOKEN_ID,
    amount: "",
    usdAmount: "",
    receiverId: "",
  };
};

export const AppStateDefault_stakeNearState: () => IAccountStakeNearState = () => {
  return {
    view: EStakingView.STAKE_VIEW_METHOD,
    receiveTokenAmount: undefined,
    nearAmount: undefined,
    validator: undefined,
    stakingType: EStakingType.normal,
    defaultInput: undefined,
  };
};

export const AppStateDefault_unstakeState: () => IAccountUnstakeState = () => {
  return {
    selectedUnstakedValidator: undefined,
    unstakeAmountInput: undefined,
    minimumAmountOutput: undefined,
  };
};

export const AppStateDefault_sendNftState: () => IAccountSendNftState = () => {
  return {
    selectedContractName: "",
    tokenId: "",
    receiverId: "",
  };
};
