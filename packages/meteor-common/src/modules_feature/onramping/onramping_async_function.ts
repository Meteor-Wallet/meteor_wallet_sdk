import {
  EDriverPlatform,
  getCurrentPlatform,
} from "../../modules_app_core/app_plaftorms/drivers/index";
import { GeoJs_HttpClient } from "../../modules_external/geojs/clients/GeoJs_HttpClient";
import { IGeoJsCountryInfo } from "../../modules_external/geojs/geojs_types";
import { MeteorBackendV2Client } from "../../modules_external/meteor_v2_api/MeteorBackendV2Client";
import { IWithAccountIdAndNetwork } from "../../modules_external/near/types/near_input_helper_types";
import { hmutils_signPayload } from "../harvest_moon/harvest_moon_utils";
import { MERCURYO_ACCEPTANCE_RATE } from "./onramping_static_data";
import { TOnrampingProviders } from "./onramping_types";

async function getCountryCode(): Promise<IGeoJsCountryInfo> {
  const helper = GeoJs_HttpClient.getInstance();
  const countryInfo = await helper.getCountryCode();
  return countryInfo;
}

async function getMercuryoSignature(input: IWithAccountIdAndNetwork): Promise<string> {
  const walletSignedPayload = await hmutils_signPayload(input);
  const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
  const resp = await meteorBackendV2Service.getMercuryoSignature({
    walletSignedPayload,
  });
  return resp;
}

function getRecommendedProvider(countryCode: string): TOnrampingProviders | "Unknown" {
  if (countryCode === "") {
    return "Unknown";
  }

  if (getCurrentPlatform() === EDriverPlatform.ext_chrome) {
    return "Onramper";
  }

  const mercuryoRate =
    MERCURYO_ACCEPTANCE_RATE.find((item) => item.country === countryCode)?.rate ?? 0;
  // const onramperRate =
  //   ONRAMPER_ACCEPTANCE_RATE.find((item) => item.country === countryCode)
  //     ?.rate ?? 0;
  // const rampRate =
  //   RAMP_ACCEPTANCE_RATE.find((item) => item.country === countryCode)?.rate ??
  //   0;

  if (mercuryoRate >= 60) {
    return "Mercuryo";
  } else {
    return "Onramper";
  }
}

export const onramping_async_functions = {
  getCountryCode,
  getMercuryoSignature,
  getRecommendedProvider,
};
