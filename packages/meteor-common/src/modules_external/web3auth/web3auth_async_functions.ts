import { OpenloginUserInfo } from "@toruslabs/openlogin";
import { getED25519Key } from "@toruslabs/openlogin-ed25519";
import { CHAIN_NAMESPACES } from "@web3auth/base";
import { Web3Auth } from "@web3auth/modal";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import bs58 from "bs58";
import { METEOR_STATIC_FILE_LOGO } from "../../configs/app_constants";
import { app_env } from "../../modules_app_core/env/app_env";
import { TFRFailure } from "../../modules_utility/api_utilities/task_function/TaskFunctionResponses";
import { ETaskFunctionEndId } from "../../modules_utility/api_utilities/task_function/TaskFunctionTypes";
import { TaskFunctionError } from "../../modules_utility/api_utilities/task_function/TaskFunctionUtils";
import { AsyncUtils } from "../../modules_utility/javascript_helpers/AsyncUtils";

const { ENV_IS_DEV } = app_env;

const clientId =
  "BGRZff-cldftEu3tqfZx4KYL0TGW65nrb2UHfJC4BMjDLyBiercW2hTYdNPHslR52JjAzDT8cCyaWa5qvtlIU2s";
const network: "testnet" | "mainnet" = "mainnet";

export interface IOLoginWithWeb3Auth_Inputs {
  darkMode: boolean;
  language: string;
}

export interface IOLoginWithWeb3Auth_Outputs {
  privateKey: string;
  userInfo: Partial<OpenloginUserInfo>;
}

async function signInAndGetDataWithWeb3Auth({
  darkMode,
  language,
}: IOLoginWithWeb3Auth_Inputs): Promise<IOLoginWithWeb3Auth_Outputs> {
  const web3AuthClient = new Web3Auth({
    clientId,
    chainConfig: {
      chainNamespace: CHAIN_NAMESPACES.OTHER,
      rpcTarget: "https://rpc.ankr.com/near",
      displayName: "NEAR",
      blockExplorer: "https://explorer.near.org/",
      ticker: "NEAR",
      tickerName: "NEAR",
    },
    uiConfig: {
      defaultLanguage: language,
      theme: darkMode ? "dark" : "light",
      appLogo: METEOR_STATIC_FILE_LOGO,
      appName: "Meteor (NEAR)",
    },
    authMode: "WALLET",
    web3AuthNetwork: network,
    enableLogging: ENV_IS_DEV,
  });

  const openloginAdapter = new OpenloginAdapter({
    adapterSettings: {
      clientId,
      network,
      uxMode: "popup",
      whiteLabel: {
        url: "https://meteorwallet.app",
        defaultLanguage: language,
        name: "Meteor Wallet",
        dark: darkMode,
        logoDark: METEOR_STATIC_FILE_LOGO,
        logoLight: METEOR_STATIC_FILE_LOGO,
      },
    },
    loginSettings: {
      sessionTime: 86400,
      mfaLevel: "none",
    },
  });

  web3AuthClient.configureAdapter(openloginAdapter);
  await web3AuthClient.initModal();

  const web3AuthProvider = await web3AuthClient.connect();

  if (web3AuthProvider == null) {
    throw new TaskFunctionError(TFRFailure(ETaskFunctionEndId.NOT_FOUND, "No auth provider found"));
  }

  const privateKey = await web3AuthProvider.request<string>({
    method: "private_key",
  });

  const userInfo = await web3AuthClient.getUserInfo();

  try {
    web3AuthClient.loginModal.closeModal();
  } catch (e) {}

  await AsyncUtils.waitMillis(200);
  await web3AuthClient.logout({ cleanup: true });

  if (privateKey) {
    const nearPrivateKey = getED25519Key(privateKey);
    console.log(`Original Private Key: ${nearPrivateKey.sk.toString("hex")}`);
    console.log(`Address: ${nearPrivateKey.pk.toString("hex")}`);
    console.log(`Public Key: ed25519:${bs58.encode(Buffer.from(nearPrivateKey.pk))}`);

    const ed25519PrivateKeyString = `ed25519:${bs58.encode(Buffer.from(nearPrivateKey.sk))}`;

    console.log(`Private Key: ed25519:${bs58.encode(Buffer.from(nearPrivateKey.sk))}`);

    return {
      privateKey: ed25519PrivateKeyString,
      userInfo,
    };
  } else {
    throw new TaskFunctionError(
      TFRFailure(
        ETaskFunctionEndId.ERROR,
        "Private key could not be retrieved from the Web3Auth provider",
      ),
    );
  }
}

export const web3auth_async_functions = {
  signInAndGetDataWithWeb3Auth,
};
