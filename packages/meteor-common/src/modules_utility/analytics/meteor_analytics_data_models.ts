import { z } from "zod";
import { EAppPlatformType } from "../../modules_app_core/app_plaftorms/app_platform_types";
import { EThemeMode } from "../../modules_app_core/theme/ThemeStatic";
import { ELanguage } from "../../modules_app_core/translation/translation_types";
import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";
import { EAccountIdentifierType } from "../../modules_feature/accounts/account_types";
import { EMeteorWalletSignInType } from "../../modules_feature/dapp_connect/types_dappConnect";
import {
  EMeteorAnalytics_AppReleaseEnvironment,
  EMeteorAnalytics_EventType,
} from "./meteor_analytics_enums";

export const ZMeteorEventObject = z.object({
  eventType: z.nativeEnum(EMeteorAnalytics_EventType),
  eventSubTypeId: z.string().optional(),
  anonId: z.string(),
  appRelease: z.nativeEnum(EMeteorAnalytics_AppReleaseEnvironment),
  appVersion: z.string().min(1),
  appDriver: z.nativeEnum(EAppPlatformType),
  memSessionId: z.string(),
  longSessionId: z.string(),
  eventMeta: z.any().optional(),
});

export const ZMeteorEventMeta_Initialize = z.object({
  themeMode: z.string(),
  appLanguage: z.string().length(2),
});

export const ZMeteorEventMeta_PageView = z.object({
  path: z.string(),
  queryString: z.string(),
  wHash: z.string().optional(),
  wId: z.string().optional(),
  nearNetwork: z.nativeEnum(ENearNetwork).optional(),
});

export const ZMeteorEventMeta_WalletAction_Base = z.object({
  wHash: z.string(),
  wId: z.string(),
  nearNetwork: z.nativeEnum(ENearNetwork),
});

export const ZMeteorEventMeta_WalletAction_SendNearToken =
  ZMeteorEventMeta_WalletAction_Base.extend({
    ftSymbol: z.string(),
    nearAmount: z.number(),
    usdAmount: z.number(),
    rHash: z.string(),
    rId: z.string(),
    trxHash: z.string(),
  });

export const ZMeteorEventMeta_WalletAction_SendFtToken = ZMeteorEventMeta_WalletAction_Base.extend({
  ftContractId: z.string(),
  ftAmount: z.number(),
  ftSymbol: z.string(),
  usdAmount: z.number(),
  rHash: z.string(),
  rId: z.string(),
  trxHash: z.string(),
});

export const ZMeteorEventMeta_WalletAction_SendNft = ZMeteorEventMeta_WalletAction_Base.extend({
  nftContractId: z.string(),
  nftTokenId: z.string(),
  rHash: z.string(),
  rId: z.string(),
});

export const ZMeteorEventMeta_WalletAction_Swap = ZMeteorEventMeta_WalletAction_Base.extend({
  swapInTokenSymbol: z.string(),
  swapInTokenContractId: z.string(),
  swapInTokenAmount: z.number(),
  swapOutTokenContractId: z.string(),
  swapOutTokenAmount: z.number(),
  swapOutTokenSymbol: z.string(),
  swapDollarValue: z.number(),
  swapOutDollarValue: z.number(),
  trxHash: z.string(),
});

export const ZMeteorEventMeta_WalletAction_NormalStake = ZMeteorEventMeta_WalletAction_Base.extend({
  validatorId: z.string(),
  stakeTokenContractId: z.string(),
  stakeTokenAmount: z.number(),
  stakeTokenSymbol: z.string(),
  stakeTokenUsdAmount: z.number(),
  trxHash: z.string(),
});

export const ZMeteorEventMeta_WalletAction_NormalUnstake =
  ZMeteorEventMeta_WalletAction_Base.extend({
    validatorId: z.string(),
    stakeTokenContractId: z.string(),
    unstakeTokenAmount: z.number(),
  });

export const ZMeteorEventMeta_WalletAction_LiquidStake = ZMeteorEventMeta_WalletAction_Base.extend({
  stakeTokenSymbol: z.string(),
  liquidStakeProviderId: z.string(),
  stakeTokenContractId: z.string(),
  stakeTokenAmount: z.number(),
  stakeTokenUsdAmount: z.number(),
  trxHash: z.string(),
});

export const ZMeteorEventMeta_WalletAction_LiquidUnstake =
  ZMeteorEventMeta_WalletAction_Base.extend({
    liquidStakeProviderId: z.string(),
    stakeTokenContractId: z.string(),
    unstakeTokenAmount: z.number(),
  });

export const ZMeteorEventMeta_WalletAction_LiquidDelayedUnstake =
  ZMeteorEventMeta_WalletAction_Base.extend({
    liquidStakeProviderId: z.string(),
    stakeTokenContractId: z.string(),
    unstakeTokenAmount: z.number(),
    validatorId: z.string(),
  });

export const ZMeteorEventMeta_WalletAction_CreateWallet = ZMeteorEventMeta_WalletAction_Base.extend(
  {
    wType: z.nativeEnum(EAccountIdentifierType),
  },
);

export const ZMeteorEventMeta_WalletAction_ImportWallet = ZMeteorEventMeta_WalletAction_Base.extend(
  {
    wType: z.nativeEnum(EAccountIdentifierType),
    importMethod: z.string(),
  },
);

/*export const ZMeteorEventMeta_WalletAction_BatchImportWallet = ZMeteorEventMeta_WalletAction_Base.extend({
  wType: z.nativeEnum(ENearWalletType),
  importMethod: z.string(),
});*/

export const ZMeteorEventMeta_WalletAction_SignTransactionRequest =
  ZMeteorEventMeta_WalletAction_Base.extend({
    signContractId: z.string(),
    signContractMethod: z.string().optional(),
    requestId: z.string(),
    // trxId: z.string(),
    trxOrd: z.number(),
    actionOrd: z.number(),
    actionTotalOrd: z.number(),
    actionArgsJson: z.string().optional(),
    actionArgsJsonObject: z.record(z.string().min(1), z.any()).optional(),
    ftContractId: z.string().optional(),
    ftAmount: z.number().optional(),
    nftContractId: z.string().optional(),
    nftTokenId: z.string().optional(),
    nearAmount: z.number().optional(),
    externalHost: z.string(),
  });

export const ZMeteorEventMeta_WalletAction_SignTransactionOk =
  ZMeteorEventMeta_WalletAction_SignTransactionRequest.extend({
    trxHash: z.string(),
    tokenUsdAmount: z.number().optional(),
  });

export const ZMeteorEventMeta_WalletAction_SignTransactionFail =
  ZMeteorEventMeta_WalletAction_SignTransactionRequest.extend({
    trxHash: z.string().optional(),
    errorMessage: z.string(),
  });

export const ZMeteorEventMeta_WalletAction_SignInToDappRequest =
  ZMeteorEventMeta_WalletAction_Base.extend({
    signContractId: z.string(),
    requestId: z.string(),
    allowMethods: z.array(z.string()).optional(),
    allowType: z.nativeEnum(EMeteorWalletSignInType),
    externalHost: z.string(),
  });

export const ZMeteorEventMeta_WalletAction_SignInToDappOk =
  ZMeteorEventMeta_WalletAction_SignInToDappRequest.extend({});

export const ZMeteorEventMeta_WalletAction_SignInToDappFail =
  ZMeteorEventMeta_WalletAction_SignInToDappOk.extend({
    errorMessage: z.string(),
  });

export const ZMeteorEventMeta_WalletAction_SignOutOfDappRequest =
  ZMeteorEventMeta_WalletAction_Base.extend({
    signContractId: z.string(),
    requestId: z.string(),
    externalHost: z.string(),
  });

export const ZMeteorEventMeta_WalletAction_SignOutOfDappOk =
  ZMeteorEventMeta_WalletAction_SignOutOfDappRequest.extend({});

export const ZMeteorEventMeta_WalletAction_SignOutOfDappFail =
  ZMeteorEventMeta_WalletAction_SignOutOfDappOk.extend({
    errorMessage: z.string(),
  });

export const ZMeteorEventMeta_WalletAction_HmTimeTravel = ZMeteorEventMeta_WalletAction_Base.extend(
  {
    params: z.object({
      input: z.object({
        tinker_id: z.number(),
        count: z.number(),
      }),
      output: z.object({
        tinker_id: z.number(),
        success_count: z.number(),
        fail_count: z.number(),
      }),
    }),
    trx_hash: z.string(),
    wallet_id: z.string(),
  },
);

export const ZMeteorEventMeta_AppHidden = z.object({
  viewedSeconds: z.number(),
  themeMode: z.string().optional(),
});

// export const ZMeteorEventMeta_UserAction = z.object({});

export const ZMeteorEventMeta_UserAction_ChangeLanguage = z.object({
  appLanguage: z.nativeEnum(ELanguage),
});

export const ZMeteorEventMeta_UserAction_ChangeNetwork = z.object({
  nearNetwork: z.nativeEnum(ENearNetwork),
});

export const ZMeteorEventMeta_UserAction_ChangeTheme = z.object({
  themeMode: z.nativeEnum(EThemeMode),
});

export const ZMeteorEventMeta_UserAction_Voter_Registration_Attempt = z.object({
  accountIds: z.array(z.string()),
});

export const ZMeteorEventMeta_UserAction_Voter_Registration_Onboarded = z.object({
  accountId: z.string(),
});

export const ZMeteorEventMeta_UserAction_ButtonClick = z.object({
  buttonId: z.string(),
});
