import { getAppEnvHelper } from "../../modules_app_core/env/app_env_helper";
import { IEventQuestPayload } from "../../modules_feature/missions/mission_types";
import { BaseHttpClient } from "../../modules_utility/http_utilities/BaseHttpClient";

export class MeteorAnalyticsClient extends BaseHttpClient {
  private static instance: MeteorAnalyticsClient;

  private constructor() {
    super();
  }

  public static getInstance(): MeteorAnalyticsClient {
    if (!MeteorAnalyticsClient.instance) {
      MeteorAnalyticsClient.instance = new MeteorAnalyticsClient();
    }

    return MeteorAnalyticsClient.instance;
  }

  public async createAppEvent(payload: IEventQuestPayload) {
    const headers = {
      "content-type": "application/json",
    };
    if (localStorage.getItem("meteor_session_id")) {
      headers["x-meteor-session-id"] = localStorage.getItem("meteor_session_id");
    }
    const res = await fetch(this.getBaseUrl() + "/api/analytics/app_events", {
      headers,
      method: "POST",
      body: JSON.stringify({
        ...payload,
        session_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
      keepalive: true,
    });
    const json = await res.json();
    if (json.data.meteor_session_id) {
      localStorage.setItem("meteor_session_id", json.data.meteor_session_id);
    }
    return json;
  }

  // Private/protected functions
  protected getBaseUrl(): string {
    // NOTE: URL SHOULD NOT END WITH '/'
    if (getAppEnvHelper().isDevAppVersion()) {
      // TODO: Swap this to proper dev url
      // return `http://localhost:4040`;
      return `https://ana-v2-dev.meteorwallet.app`;
    } else {
      // TODO: Swap this to proper prod url
      return `https://ana-v2.meteorwallet.app`;
    }
  }
}
