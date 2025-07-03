import { nanoid } from "nanoid";
import { AppStore } from "../../modules_app_core/state/app_store/AppStore";
import { meteor_mission_async_function } from "../../modules_feature/missions/mission_async_functions";
import {
  EMeteorAnalytics_EventType,
  EMeteorAnalytics_SubType_UserAction,
  EMeteorAnalytics_SubType_WalletAction,
} from "./meteor_analytics_enums";
import {
  TMeteorEventMeta_AppHidden,
  TMeteorEventMeta_Initialize,
  TMeteorEventMeta_PageView,
  TMeteorEventMeta_UserAction,
  TMeteorEventMeta_WalletAction,
  TMeteorEventObject,
} from "./types/meteor_analytics_app_types";

// const eventBaseUrl = "https://meteor-analytics-worker.meteorwallet.workers.dev";
// const eventBaseUrl = "https://ana.meteorwallet.app";
const eventBaseUrl = "https://ana2.meteorwallet.app";

const appEventUrl = `${eventBaseUrl}/app-event`;

async function makeAnalyticEventRequest(event: TMeteorEventObject[]) {
  await fetch(appEventUrl, {
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(event),
  });
}

type TMeteorAnalyticsInitObject = Pick<
  TMeteorEventObject,
  "appVersion" | "appDriver" | "appRelease" | "anonId" | "longSessionId" | "memSessionId"
>;

class MeteorAnalytics {
  initObject: TMeteorAnalyticsInitObject | undefined;
  immediateSessionId: string;
  eventsToGo: TMeteorEventObject[] = [];
  lastPath: string = "___";
  timeTracked: number = 0;
  timeTrackingInterval: any;
  flushingInterval: any;
  metaToSendOnClose: any;

  constructor() {
    this.immediateSessionId = `${Date.now()}_${nanoid(4)}`;
    this.trackTime(1);
    this.flushingInterval = setInterval(() => {
      this.flush();
    }, 30);
  }

  setMetaForOnClose(meta: any): MeteorAnalytics {
    this.metaToSendOnClose = meta;
    return this;
  }

  flush() {
    if (this.eventsToGo.length > 0) {
      const network = AppStore.getRawState().selectedNetwork;
      meteor_mission_async_function.missionAnalytics([...this.eventsToGo], network);
      makeAnalyticEventRequest([...this.eventsToGo]);
      this.eventsToGo = [];
    }
  }

  private trackTime(initial: number = 0) {
    this.timeTracked = initial;
    this.timeTrackingInterval = setInterval(() => {
      this.timeTracked += 1;
    }, 1000);
  }

  userAction(
    subId: EMeteorAnalytics_SubType_UserAction,
    meta?: TMeteorEventMeta_UserAction,
  ): MeteorAnalytics {
    // console.log(`Meteor Analytics: [userAction] [${subId}]`);

    this.eventsToGo.push({
      ...this.initObject!,
      eventMeta: meta ?? {},
      eventType: EMeteorAnalytics_EventType.user_action,
      eventSubTypeId: subId,
    });
    return this;
  }

  pageView(meta: TMeteorEventMeta_PageView): MeteorAnalytics {
    if (meta.path !== this.lastPath) {
      // console.log(
      //   `Meteor Analytics: [pageView] { wHash: ${meta.wHash}, path: ${meta.path}, qs: ${meta.queryString} }`,
      // );

      this.eventsToGo.push({
        ...this.initObject!,
        eventMeta: meta,
        eventType: EMeteorAnalytics_EventType.page_view,
      });

      this.lastPath = meta.path;
    }

    return this;
  }

  walletAction(
    subId: EMeteorAnalytics_SubType_WalletAction,
    meta: TMeteorEventMeta_WalletAction,
  ): MeteorAnalytics {
    console.log(`Meteor Analytics: [walletAction] [${subId}]`, meta);

    this.eventsToGo.push({
      ...this.initObject!,
      eventMeta: meta,
      eventType: EMeteorAnalytics_EventType.wallet_action,
      eventSubTypeId: subId,
    });
    return this;
  }

  appHiddenOrClosed() {
    const eventMeta: TMeteorEventMeta_AppHidden = {
      viewedSeconds: this.timeTracked,
      ...this.metaToSendOnClose,
    };

    clearInterval(this.timeTrackingInterval);
    this.timeTracked = 0;

    const eventObject: TMeteorEventObject = {
      ...this.initObject!,
      eventMeta,
      eventType: EMeteorAnalytics_EventType.app_hidden,
    };
    navigator.sendBeacon(appEventUrl, JSON.stringify([eventObject]));
  }

  appVisible() {
    this.trackTime();

    this.eventsToGo.push({
      ...this.initObject!,
      eventType: EMeteorAnalytics_EventType.app_visible,
    });
    this.flush();
  }

  initialize(
    initObject: Omit<TMeteorAnalyticsInitObject, "memSessionId">,
    initMeta: TMeteorEventMeta_Initialize,
  ): MeteorAnalytics {
    this.initObject = { ...initObject, memSessionId: this.immediateSessionId };
    this.eventsToGo.push({
      ...this.initObject,
      eventType: EMeteorAnalytics_EventType.initialized,
      eventMeta: initMeta,
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.appHiddenOrClosed();
      } else if (document.visibilityState === "visible") {
        this.appVisible();
      }
    });

    return this;
  }
}

let analytics: MeteorAnalytics | undefined;

export function anal(): MeteorAnalytics {
  if (analytics == null) {
    analytics = new MeteorAnalytics();
  }

  return analytics;
}
