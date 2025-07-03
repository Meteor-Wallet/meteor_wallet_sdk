import type Gleap from "@meteorwallet/gleap";

const store: {
  client?: typeof Gleap;
} = {};

export const GLEAP_ENV = {
  API_KEY: "NzgTXE1VhwYvyOe0rCt5P3b3eEoDQGwk",
};

async function getGleapClient(): Promise<typeof Gleap> {
  if (store.client == null) {
    store.client = (await import("@meteorwallet/gleap")).default;
    // store.client.initialize(gleapApiKey);
  }

  return store.client;
}

export async function initializeGleap() {
  const Gleap = await getGleapClient();
  Gleap.showFeedbackButton(false);
  // if (!window?.location?.href?.includes("localhost")) {
  Gleap.initialize(GLEAP_ENV.API_KEY);
  // }
}

/*async function initializeGleapForOnceOffFeedback() {
  const Gleap = await getGleapClient();
  Gleap.initialize(GLEAP_ENV.API_KEY);
  Gleap.setEnvironment(ENV_IS_DEV ? "dev" : "prod");

  await AsyncUtils.waitMillis(500);

  Gleap.open();

  Gleap.on("close", () => {
    Gleap.destroy();
  });
}*/

export const GleapAsync = {
  getGleapClient,
  /*getGleapClientAsyncAction: createAsyncActionWithErrors(getGleapClient),
  initializeGleapForOnceOffFeedback: createAsyncActionWithErrors(
    initializeGleapForOnceOffFeedback,
  ),*/
};
