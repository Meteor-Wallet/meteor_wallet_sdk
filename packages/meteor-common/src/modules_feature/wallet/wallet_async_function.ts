import { getAdaptiveVariable } from "../../modules_app_core/app_plaftorms/app_adapter";
import { MeteorBackendV2Client } from "../../modules_external/meteor_v2_api/MeteorBackendV2Client";

async function createErrorEntry({
  message,
  stack,
}: {
  message: string;
  stack: string;
}): Promise<string> {
  const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
  let account_id: string | undefined;

  try {
    const localStorageAdapter = getAdaptiveVariable("localStorageAdapter");
    const selectedAccountIdRaw = await localStorageAdapter.getString("selectedAccountId");
    if (selectedAccountIdRaw) {
      account_id = selectedAccountIdRaw;
    }
  } catch (err) {
    console.warn("Unable to get storage adapter in error report.");
  }

  const resp = await meteorBackendV2Service.createErrorEntry({
    message,
    stack,
    path: location.href,
    account_id,
  });
  return resp;
}

export const wallet_async_function = {
  createErrorEntry,
};
