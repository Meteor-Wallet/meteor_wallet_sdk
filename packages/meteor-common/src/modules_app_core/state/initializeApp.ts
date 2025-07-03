import moment from "moment/moment";
import { parse } from "query-string";
import { matchPath } from "react-router-dom";
import { LOCAL_STORAGE_SESSION_EXPIRATION } from "../../configs/app_constants";
import { MeteorBackendV2Client } from "../../modules_external/meteor_v2_api/MeteorBackendV2Client";
import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";
import { telegram_utils } from "../../modules_external/telegram/telegram.utils";
import {
  EAccountKeyType,
  EProfileStatus,
  IAccountKeyMeta_LocalPrivate,
  IAccountSecretData_LocalPrivateKey,
} from "../../modules_feature/accounts/account_types";
import { NearAccountSignerExecutor } from "../../modules_feature/accounts/near_signer_executor/NearAccountSignerExecutor";
import { ESignerMethod } from "../../modules_feature/accounts/near_signer_executor/NearAccountSignerExecutor.types";
import { getPostMessageManager } from "../../modules_feature/dapp_connect/MeteorPostMessageManager";
import { initializeRedirectCallback } from "../../modules_feature/dapp_connect/MeteorRedirectCallback";
import {
  EDappActionSource,
  EExternalActionType,
} from "../../modules_feature/dapp_connect/types_dappConnect";
import { IHarvestMoonState } from "../../modules_feature/harvest_moon/harvest_moon_types";
import { anal } from "../../modules_utility/analytics/MeteorAnalytics";
import { MeteorAppAnalyticsActions } from "../../modules_utility/analytics/MeteorAppAnalyticsActions";
import { meteor_analytics_utils } from "../../modules_utility/analytics/meteor_analytics_utils";
import { EncryptionDecryptionUtils } from "../../modules_utility/cryptography/EncryptionDecryptionUtils";
import { MeteorEncryptionUtils } from "../../modules_utility/cryptography/MeteorEncryptionUtils";
import { SeedPhraseAndKeysUtil } from "../../modules_utility/cryptography/SeedPhraseAndKeysUtil";
import { EnumUtils } from "../../modules_utility/data_type_utils/EnumUtils";
import { notNullEmpty } from "../../modules_utility/data_type_utils/StringUtils";
import { getAdaptiveVariable } from "../app_plaftorms/app_adapter";
import { EAppPlatformType } from "../app_plaftorms/app_platform_types";
import {
  EMeteorExtensionComEvent,
  getMeteorExtensionCom,
} from "../app_plaftorms/extension_sync/MeteorExtensionCom";
import { app_env } from "../env/app_env";
import { ELanguage } from "../translation/translation_types";
import { translations } from "../translation/translations";
import { AppStateActions } from "./app_store/AppStateActions";
import { AppStore } from "./app_store/AppStore";
import {
  EBatchImportProgress,
  EExtensionStatus,
  ERecoveryType,
  EWalletAppMode,
  EWalletEncryptionType,
  TInitRedirect,
} from "./app_store/AppStore_types";
import { registerAccountTransitionStateListeners } from "./app_store/state_listeners/account_transition.state_listeners";
import { registerOldAccountStateListeners } from "./app_store/state_listeners/old_account.state_listeners";
import { registerWalletUserStateListeners } from "./app_store/state_listeners/wallet_user.state_listeners";
import { account_transition_state_tasks } from "./app_store/state_tasks/account_transition.state_tasks";
import { old_account_state_tasks } from "./app_store/state_tasks/old_account.state_tasks";
import { profile_state_tasks } from "./app_store/state_tasks/profile.state_tasks";
import { security_state_tasks } from "./app_store/state_tasks/security.state_tasks";
import { wallet_user_state_tasks } from "./app_store/state_tasks/wallet_user.state_tasks";
import { memory_state } from "./memory_state";
import { createReactionForForcingDarkMode } from "./temp/force_dark_mode";
import { createStateStorageLink } from "./utils/state_storage.utils";

const { ENV_IS_DEV } = app_env;

export async function initializeApp() {
  NearAccountSignerExecutor.setupHooks({
    getAccountSigner: async (accountId, networkId) => {
      const { sessionAccounts } = AppStore.getRawState();
      const account = sessionAccounts[accountId];

      if (account == null) {
        throw new Error(`Account with ID "${accountId}" not found in wallet`);
      }

      if (account.keyMeta.keyType === EAccountKeyType.LOCAL_PRIVATE_KEY) {
        const secretData: IAccountSecretData_LocalPrivateKey =
          account.decrypted as IAccountSecretData_LocalPrivateKey;
        return {
          method: ESignerMethod.local_key,
          publicKey: secretData.publicKey,
          privateKey: secretData.privateKey,
        };
      } else {
        return {
          method: ESignerMethod.ledger,
          publicKey: account.keyMeta.data.publicKey,
          path: account.keyMeta.data.path,
        };
      }
    },
    onStartTransactions: () => {
      AppStore.update((s) => {
        s.externalActionState = {
          currentState: "processing",
        };
      });
    },
    onCompleteTransactions: (outcome) => {
      AppStore.update((s) => {
        s.externalActionState = {
          currentState: "finished",
          outcome,
        };
      });
    },
  });
  // NearAccountSignerExecutor.setAccountSignerGetter();

  if (notNullEmpty(window.location.hash)) {
    const hashValue = window.location.hash.slice(1);

    // Do extension redirects here
    if (hashValue.startsWith("/_ext")) {
      let initRedirect: TInitRedirect | undefined = undefined;

      if (hashValue.endsWith("ledger/import")) {
        initRedirect = {
          route_id: "ledger_import",
        };
      }

      if (hashValue.includes("ledger/create")) {
        initRedirect = {
          route_id: "ledger_create",
          name: hashValue.split("/").pop()!,
        };
      }

      AppStore.update((s) => {
        s.initRedirect = initRedirect;
        s.extensionOpenedTab = true;
      });
    }
  }

  const queryObject = parse(window.location.search);

  let pathToMatch: string = window.location.pathname;

  if (queryObject.route != null) {
    pathToMatch = queryObject.route as string;
  }

  const matchConnect = matchPath("/connect/:network/:action", pathToMatch);

  // Check for external actions
  if (matchConnect != null) {
    console.log("Matched connect URL", queryObject);
    console.log(matchConnect.params);

    if (queryObject.source === EDappActionSource.website_post_message) {
      console.log("Incoming Action Request from Website Post Message action");
      getPostMessageManager({
        referrerUri: document.referrer,
        source: EDappActionSource.website_post_message,
      }).initialize(EDappActionSource.website_post_message, queryObject.connectionUid as string);
    } else if (queryObject.source === EDappActionSource.extension_injected) {
      console.log("Incoming Action Request from Extension Communication action");
      getPostMessageManager({
        referrerUri: queryObject.pageUri as string,
        source: EDappActionSource.extension_injected,
      }).initialize(EDappActionSource.extension_injected, queryObject.connectionUid as string);
    } else {
      console.log("incoming Action Request from a callback redirect flow");
      initializeRedirectCallback(
        matchConnect.params.network as ENearNetwork,
        matchConnect.params.action as EExternalActionType,
        queryObject,
      );
    }
  }

  const matchBatchImport = matchPath("/batch-import", pathToMatch);

  // We've landed at a batch import route
  if (matchBatchImport != null) {
    console.log("Batch import route");

    let { hash, network } = (queryObject ?? {}) as any;

    if (!notNullEmpty(hash) && notNullEmpty(window.location.hash)) {
      hash = window.location.hash.slice(1);
    }

    if (
      notNullEmpty(hash) &&
      notNullEmpty(network) &&
      EnumUtils.getEnumValues(ENearNetwork).includes(network as ENearNetwork)
    ) {
      AppStore.update((s) => {
        s.batchImportState = {
          hash,
          network: network as ENearNetwork,
          progress: EBatchImportProgress.P0_LANDING_DECRYPT,
        };
      });
    }
  }

  getMeteorExtensionCom().listen(EMeteorExtensionComEvent.extension_detected, () => {
    AppStore.update((s) => {
      s.extensionSync.status = EExtensionStatus.DETECTED;
      s.extensionSync.detected = true;
      const { setFeatures, features } = getMeteorExtensionCom();
      s.extensionSync.features = features;
      s.extensionSync.setFeatures = setFeatures;
    });
  });

  AppStore.createReaction(
    (s) => [s.profiles, s.currentProfileId] as const,
    ([profiles, currentId], draft) => {
      let newCurrentId: string | undefined = currentId;

      if (currentId == null && profiles.length > 0) {
        newCurrentId = profiles[0].id;
      }

      draft.currentProfileId = newCurrentId;
      const newCurrentProfile = profiles.find((p) => p.id === newCurrentId);

      if (newCurrentProfile != null) {
        draft.currentProfile = newCurrentProfile;
      }
    },
    {
      runNow: true,
    },
  );

  AppStore.subscribe(
    (s) => s.language,
    (lang) => {
      const trans = translations[lang];
      const code = trans.languageCode;
      moment.locale(code);
      // console.log("set lang to", code)
    },
  );

  registerOldAccountStateListeners();
  registerWalletUserStateListeners();
  registerAccountTransitionStateListeners();

  const localStorageAdapter = getAdaptiveVariable("localStorageAdapter");
  const sessionStorageAdapter = getAdaptiveVariable("sessionAdapter");

  const selectedAccountId = await localStorageAdapter.getJson<string>("selectedAccountId");
  const harvestMoonState = await localStorageAdapter.getJson<IHarvestMoonState>("harvestMoonState");

  // try to read browser language
  const chosenLanguage = await localStorageAdapter.getJson<string>("language");
  if (!chosenLanguage) {
    let defaultLanguage = ELanguage.en;
    const browserLocale = Intl.DateTimeFormat().resolvedOptions().locale;
    if (browserLocale !== "") {
      const [mainLang] = browserLocale.split("-");
      if (ELanguage[mainLang]) {
        defaultLanguage = ELanguage[mainLang];
      }
    }
    AppStore.update((s) => {
      s.language = defaultLanguage;
    });
  }

  // Get basic settings
  await Promise.all([
    createStateStorageLink(AppStore, localStorageAdapter.createJsonGetterSetter("theme"), [
      "theme",
    ]),
    createStateStorageLink(AppStore, localStorageAdapter.createJsonGetterSetter("language"), [
      "language",
    ]),
    createStateStorageLink(AppStore, sessionStorageAdapter.createJsonGetterSetter("sessionId"), [
      "sessionId",
    ]),
  ]);

  // Get account info (all accounts first)
  await createStateStorageLink(
    AppStore,
    localStorageAdapter.createJsonGetterSetter("allAccounts"),
    ["allAccounts"],
  );

  const { appDriver, appRelease } = AppStore.getRawState();

  if (appDriver === EAppPlatformType.EXTENSION) {
    await createStateStorageLink(
      AppStore,
      sessionStorageAdapter.createJsonGetterSetter("sessionAccounts"),
      ["sessionAccounts"],
    );
    /*await createStateStorageLink(
      AppStore,
      sessionStorageAdapter.createJsonGetterSetter("sessionState"),
      ["sessionState"],
    );*/
    await createStateStorageLink(
      AppStore,
      localStorageAdapter.createJsonGetterSetter("localStorageSessionState"),
      ["localStorageSessionState"],
    );
  } else {
    // On desktop site- make sure we have removed all these keys
    await Promise.all([
      sessionStorageAdapter.setJson("sessionAccounts", undefined),
      sessionStorageAdapter.setJson("sessionState", undefined),
      localStorageAdapter.setJson("localStorageSessionState", undefined),
    ]);
  }

  await createStateStorageLink(
    AppStore,
    localStorageAdapter.createJsonGetterSetter("selectedAccountId"),
    ["selectedAccountId"],
  );
  await createStateStorageLink(
    AppStore,
    localStorageAdapter.createJsonGetterSetter("harvestMoonConfigData"),
    ["harvestMoonConfigData"],
  );
  await createStateStorageLink(
    AppStore,
    localStorageAdapter.createJsonGetterSetter("harvestMoonAccountData"),
    ["harvestMoonAccountData"],
  );
  await createStateStorageLink(
    AppStore,
    localStorageAdapter.createJsonGetterSetter("harvestMoonIsSocialOnboardingDone"),
    ["harvestMoonIsSocialOnboardingDone"],
  );
  await createStateStorageLink(
    AppStore,
    localStorageAdapter.createJsonGetterSetter("harvestMoonState"),
    ["harvestMoonState"],
  );

  await Promise.all([
    // Get profile information
    createStateStorageLink(AppStore, localStorageAdapter.createJsonGetterSetter("profiles"), [
      "profiles",
    ]),
    createStateStorageLink(
      AppStore,
      localStorageAdapter.createJsonGetterSetter("currentProfileId"),
      ["currentProfileId"],
    ),
    createStateStorageLink(
      AppStore,
      localStorageAdapter.createJsonGetterSetter("selectedNetwork"),
      ["selectedNetwork"],
    ),
    createStateStorageLink(
      AppStore,
      localStorageAdapter.createJsonGetterSetter("newCurrentProfile"),
      ["newCurrentProfile"],
    ),
  ]);

  await createStateStorageLink(
    AppStore,
    localStorageAdapter.createJsonGetterSetter("walletEncryption"),
    ["walletEncryption"],
  );

  await createStateStorageLink(
    AppStore,
    localStorageAdapter.createJsonGetterSetter("meteorFeatureEnrollment"),
    ["meteorFeatureEnrollment"],
  );

  await createStateStorageLink(
    AppStore,
    localStorageAdapter.createJsonGetterSetter("meteorLastChangelogId"),
    ["meteorLastChangelogId"],
  );

  await createStateStorageLink(
    AppStore,
    localStorageAdapter.createJsonGetterSetter("selectedRpc"),
    ["selectedRpc"],
  );

  await createStateStorageLink(AppStore, localStorageAdapter.createJsonGetterSetter("customRpc"), [
    "customRpc",
  ]);

  AppStore.update((s, o) => {
    Object.keys(o.meteorFeatureEnrollment).forEach((key) => {
      if (
        o.meteorFeatureEnrollment[key].status == null ||
        (o.meteorFeatureEnrollment[key].status as unknown as string) === "rejected"
      ) {
        delete s.meteorFeatureEnrollment[key];
      }
    });
  });

  // Set the account key meta property, so that we can use it in the app
  AppStore.update((s, o) => {
    s.allAccounts = o.allAccounts.map((account) => {
      if (account.keyMeta == null) {
        return {
          ...account,
          keyMeta: {
            keyType: EAccountKeyType.LOCAL_PRIVATE_KEY,
          } as IAccountKeyMeta_LocalPrivate,
        };
      } else {
        return account;
      }
    });
  });

  // This must be activated when we move
  // over to the new account system completely
  /*await createStateStorageLink(
    AppStore,
    localStorageAdapter.createJsonGetterSetter("walletUser"),
    ["walletUser"],
  );*/

  // Check if we signed in recently with local storage
  // For now, sign in to both old and new account systems
  if (
    AppStore.getRawState().localStorageSessionState.newState != null &&
    AppStore.getRawState().localStorageSessionState.state != null
  ) {
    const {
      newState: st,
      state: oldSt,
      lastTouched: lt,
    } = AppStore.getRawState().localStorageSessionState!;
    const timeNow = Date.now();
    const lastTouched = lt ?? 0;
    const state = st!;
    const oldState = oldSt!;

    console.log("Had some session state to be looked at");

    if (timeNow > lastTouched && timeNow - LOCAL_STORAGE_SESSION_EXPIRATION < lastTouched) {
      if (!AppStore.getRawState().sessionState.isSignedIn) {
        await old_account_state_tasks.signIn({
          profileId: oldState.signedInProfileId,
          password: {
            passwordMatchHash: oldState.passwordMatchHash,
            passwordEncryptKeyHash: oldState.passwordEncryptKeyHash,
          },
        });
      }

      console.log(state);

      if (AppStore.getRawState().signedInWalletUser == null) {
        await wallet_user_state_tasks.signInWalletUser({
          paddedPasswordHash: state.paddedPasswordHash,
        });
      }

      // Touch it so that it lasts another length of time again
      AppStore.update((s) => {
        s.localStorageSessionState!.lastTouched = Date.now();
      });
    } else {
      // Expire the local storage session
      AppStore.update((s) => {
        s.localStorageSessionState = {};
      });
    }
  }

  if (ENV_IS_DEV) {
    const pass = await localStorageAdapter.getString("METEOR_DEV_PASSWORD");

    if (notNullEmpty(pass)) {
      const { currentProfileId } = AppStore.getRawState();

      await account_transition_state_tasks.signInWalletUser({
        profileId: currentProfileId,
        password: pass,
      });
    }
  }

  const harvestMoonParentMatch = matchPath("/harvest_moon", pathToMatch);

  if (harvestMoonParentMatch != null) {
    AppStore.update((s) => {
      s.walletMode = EWalletAppMode.harvest_moon_app;
      s.initRedirect = {
        route_id: "harvest_moon",
      };
    });
  }

  let { currentProfile, walletEncryption } = AppStore.getRawState();

  const isTelegramUser = await telegram_utils.checkIsTelegramUser();
  const telegramData = await telegram_utils.getTelegramUserData();

  const useTelegramAuthUserKey = false;

  if (currentProfile == null) {
    profile_state_tasks.rescueUndefinedProfile();
    currentProfile = AppStore.getRawState().currentProfile;
  }

  if (currentProfile.status === EProfileStatus.FRESH) {
    // Set up the fresh wallet encryption stuff

    if (useTelegramAuthUserKey && isTelegramUser && telegramData != null) {
      // generate new local key for Telegram
      const newLocalKey = EncryptionDecryptionUtils.generateSalt();
      const telegramAuthVersion = "v2";

      const meteorBackendV2Service = MeteorBackendV2Client.getInstance();

      try {
        const userTelegramKey = await meteorBackendV2Service.telegramGetUserKey({
          telegramAuthPayload: telegramData.telegramAuthPayload,
          version: telegramAuthVersion,
        });

        await security_state_tasks.setInitialWalletEncryption({
          type: EWalletEncryptionType.telegram_key,
          localKey: newLocalKey,
          version: telegramAuthVersion,
          userTelegramKey,
        });
      } catch (e) {
        console.error("Telegram account auth key couldn't be retrieved from backend", e);
      }
    } else {
      const newInsecureKey = EncryptionDecryptionUtils.generateSalt();

      await security_state_tasks.setInitialWalletEncryption({
        type: EWalletEncryptionType.insecure_key,
        insecureKey: newInsecureKey,
      });
    }
  } else {
    if (walletEncryption.type === EWalletEncryptionType.insecure_key) {
      // Auto sign in with insecure key
      const { currentProfileId } = AppStore.getRawState();

      memory_state.enteredPassword = walletEncryption.insecureKey;

      await account_transition_state_tasks.signInWalletUser({
        profileId: currentProfileId,
        password: walletEncryption.insecureKey,
      });
    } else if (
      walletEncryption.type === EWalletEncryptionType.telegram_key &&
      telegramData != null
    ) {
      const { currentProfileId } = AppStore.getRawState();

      const meteorBackendV2Service = MeteorBackendV2Client.getInstance();

      try {
        const userTelegramKey = await meteorBackendV2Service.telegramGetUserKey({
          telegramAuthPayload: telegramData.telegramAuthPayload,
          version: "v2",
        });

        console.log("User telegram key", userTelegramKey);

        memory_state.enteredPassword = userTelegramKey;

        await account_transition_state_tasks.signInWalletUser({
          profileId: currentProfileId,
          password: userTelegramKey,
        });
      } catch (e) {
        console.error("Telegram account auth key couldn't be retrieved from backend", e);
      }
    }
  }

  // Ensure that we are setting the actual previously set selected account ID
  if (selectedAccountId != null) {
    AppStore.update((s) => {
      s.selectedAccountId = selectedAccountId;
    });
  }
  if (harvestMoonState != null) {
    AppStore.update((s) => {
      s.harvestMoonState = harvestMoonState;
    });
  }

  // ensure that all accounts have a hashId set
  for (const [index, account] of AppStore.getRawState().allAccounts.entries()) {
    if (account.hashId == null) {
      const hashId = await MeteorEncryptionUtils.getWalletIdHash(account.id);
      AppStore.update((s) => {
        s.allAccounts[index].hashId = hashId;
      });
    }
  }

  const seedPhrase = SeedPhraseAndKeysUtil.generateSeedPhrase();

  AppStore.update((s) => {
    s.wizards.common.recovery = {
      type: ERecoveryType.seed_phrase,
      seedPhrase,
      isBackedUp: false,
    };
  });

  // TEMPORARY - disable changing theme to light mode

  createReactionForForcingDarkMode();

  /*hotkeys("ctrl+m", () => {
    AppStore.update((s, o) => {
      s.theme.mode =
        o.theme.mode === EThemeMode.dark ? EThemeMode.light : EThemeMode.dark;
    });
  });*/

  const {
    currentProfileId,
    appVersion,
    sessionId,
    language,
    theme: { mode },
  } = AppStore.getRawState();

  anal().initialize(
    {
      anonId: currentProfileId,
      appDriver,
      appVersion,
      appRelease,
      longSessionId: sessionId,
    },
    {
      themeMode: mode,
      appLanguage: language,
    },
  );

  MeteorAppAnalyticsActions.setOnCloseMeta({
    themeMode: mode,
  });

  AppStore.subscribe(
    (s) => s.theme.mode,
    (themeMode) => {
      MeteorAppAnalyticsActions.setOnCloseMeta({ themeMode });
      MeteorAppAnalyticsActions.userAction_changeTheme({ themeMode });
    },
  );

  AppStore.subscribe(
    (s) => s.language,
    (lang) => {
      MeteorAppAnalyticsActions.userAction_changeLanguage({
        appLanguage: lang,
      });
    },
  );

  AppStore.subscribe(
    (s) => s.selectedNetwork,
    (network) => {
      MeteorAppAnalyticsActions.userAction_changeNetwork({
        nearNetwork: network,
      });
    },
  );

  AppStore.subscribe(
    (s) => s.externalActions?.[s.externalActions.length - 1],
    (externalAction, allState) => {
      if (externalAction != null) {
        console.log(`Got an external action request`, externalAction);
        if (externalAction.actionType === EExternalActionType.login) {
          // const inputs: TExternal

          MeteorAppAnalyticsActions.walletAction_signInToDappRequest({
            nearNetwork: externalAction.network,
            wId: allState.selectedAccount?.id ?? "",
            wHash: allState.selectedAccount?.hashId ?? "",
            allowType: externalAction.inputs.type,
            signContractId: externalAction.inputs.contract_id,
            allowMethods: externalAction.inputs.methods,
            requestId: externalAction.uid,
            externalHost: externalAction.referrerHost ?? "",
          });
        }

        if (externalAction.actionType === EExternalActionType.logout) {
          MeteorAppAnalyticsActions.walletAction_signOutOfDappRequest({
            nearNetwork: externalAction.network,
            wId: allState.selectedAccount?.id ?? "",
            wHash: allState.selectedAccount?.hashId ?? "",
            signContractId: externalAction.inputs.contractInfo.contract_id,
            requestId: externalAction.uid,
            externalHost: externalAction.referrerHost ?? "",
          });
        }

        if (externalAction.actionType === EExternalActionType.sign) {
          meteor_analytics_utils
            .convertExternalActionToSignTransactionRequest(externalAction)
            .then((reqMeta) => {
              for (const req of reqMeta) {
                MeteorAppAnalyticsActions.walletAction_signTransactionRequest(req);
              }
            });
          /*const base: Pick<TMeteorEventMeta_WalletAction_SignTransactionRequest, "externalHost" | "nearNetwork" | "requestId"> = {
            requestId: externalAction.uid,
            nearNetwork: externalAction.network,
          };

          const actions: TMeteorEventMeta_WalletAction_SignTransactionRequest[] =
            externalAction.inputs.transactions.map((trx) =>
              trx.actions.map((action): TMeteorEventMeta_WalletAction_SignTransactionRequest => {
                return {

                };
              }),
            ).flat(2);

          MeteorAppAnalyticsActions.walletAction_signTransactionRequest({
            nearNetwork: externalAction.network,
            wHash: allState.selectedAccount?.hashId ?? "",
            externalHost: externalAction.referrerHost ?? "",
          });*/
        }
      }
    },
  );

  anal().flush();
  AppStateActions.refreshNewWalletWizards();
  await AppStateActions.initializeTelegram();
}
