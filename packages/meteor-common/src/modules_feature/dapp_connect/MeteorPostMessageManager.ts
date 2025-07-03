import { AppStateActions } from "../../modules_app_core/state/app_store/AppStateActions";
import { AppStore } from "../../modules_app_core/state/app_store/AppStore";
import { notNullEmpty } from "../../modules_utility/data_type_utils/StringUtils";
import { transaction_utils } from "../transactions/transaction_utils";
import { ZO_PostMessageBase } from "./MetoerPostMessenger_Models";
import { IPageMeta, TResponseWalletCom, TSendWalletCom } from "./extension_com_types";
import {
  EDappActionConnectionStatus,
  EDappActionSource,
  EExternalActionType,
  EWalletExternalActionStatus,
  IDappAction_SignTransactions_Data,
  IODappAction_PostMessage_SignTransactions_Input,
  TClientPostMessageResponse,
  TPostMessageSend,
  TReferrerBits,
} from "./types_dappConnect";

class MeteorPostMessageManager {
  private _wasInitialized = false;
  private _replyWindow?: Window;
  private _referrer: TReferrerBits;
  private source: EDappActionSource;
  private tabId?: number;
  private pageMeta?: IPageMeta;

  constructor(source: EDappActionSource, referrerUri?: string) {
    if (notNullEmpty(referrerUri)) {
      try {
        const refUrl = new URL(referrerUri);
        this._referrer = {
          knownRef: true,
          referrerHost: refUrl.hostname,
          referrerOrigin: refUrl.origin,
          referrerFull: referrerUri,
        };
      } catch (e) {
        console.error(e);
        this._referrer = {
          knownRef: false,
        };
      }
    } else {
      this._referrer = {
        knownRef: false,
      };
    }

    if (!this._referrer.knownRef) {
      console.warn("Referrer not known when arriving at Meteor App");
    }

    this.source = source;

    this._replyWindow = window.opener;
  }

  processData(data: TPostMessageSend) {
    const parsed = ZO_PostMessageBase.safeParse(data);

    if (parsed.success) {
      if (parsed.data.status === EDappActionConnectionStatus.initializing) {
        AppStore.update((s, o) => {
          const index = o.externalActions.findIndex((action) => action.uid === parsed.data.uid);

          if (index === -1) {
            let inputs = data.inputs;

            if (data.actionType === EExternalActionType.sign) {
              inputs = {
                transactions: transaction_utils.deserializeTransactionsFromString(
                  (data.inputs as IODappAction_PostMessage_SignTransactions_Input).transactions,
                ),
                status: EWalletExternalActionStatus.UNCONFIRMED,
              } as IDappAction_SignTransactions_Data;
            }

            s.externalActions.push({
              source: this.source,
              actionType: parsed.data.actionType,
              network: parsed.data.network,
              referrerFull: this._referrer.referrerFull,
              referrerHost: this._referrer.referrerHost,
              referrerOrigin: this._referrer.referrerOrigin,
              uid: parsed.data.uid,
              connectionStatus: EDappActionConnectionStatus.connected,
              inputs,
            });
          }
        });
      }

      if (
        [
          EDappActionConnectionStatus.initializing,
          EDappActionConnectionStatus.connected,
          EDappActionConnectionStatus.attempting_reconnect,
        ].includes(parsed.data.status)
      ) {
        const currentActionIndex = AppStore.getRawState().externalActions.findIndex(
          (action) => action.uid === parsed.data.uid,
        );

        if (currentActionIndex === -1) {
          // Send a reconnection signal, since we actually don't have this action's data anymore
          this.sendActionMessage({
            uid: data.uid,
            status: EDappActionConnectionStatus.attempting_reconnect,
            endTags: [],
          });
        } else {
          // Send a connect signal, to show that we are still connected
          this.sendActionMessage({
            uid: data.uid,
            status: EDappActionConnectionStatus.connected,
            endTags: [],
          });
        }
      }

      if (parsed.data.status === EDappActionConnectionStatus.disconnected) {
        AppStateActions.updateExternalActionFromPostMessage(data);
      }

      if (
        parsed.data.status === EDappActionConnectionStatus.closed_success ||
        parsed.data.status === EDappActionConnectionStatus.closed_fail
      ) {
        window.close();
      }
    } else {
      console.warn("Couldn't parse postMessage correctly", data);
    }
  }

  initialize(source: EDappActionSource, connectionUid: string) {
    if (!this._wasInitialized) {
      if (source === EDappActionSource.website_post_message) {
        addEventListener("message", (evt) => {
          // console.log("[OUTGOING] Received message inside Meteor App", evt.data);
          if (evt.data != null) {
            const data: TPostMessageSend = evt.data;
            this.processData(data);
          }
        });
        AppStore.update((s) => {
          s.externalActionSource = EDappActionSource.website_post_message;
        });
      } else {
        chrome.runtime.onMessage.addListener((message: TSendWalletCom, sender) => {
          if (message.action === "wallet_com_client") {
            // console.log("[OUTGOING] Received message inside Meteor App", message);
            const data = message?.params;
            this.pageMeta = message?.pageMeta;
            this.tabId = message?.params?.tabId;
            this.processData(data);
          }
        });
        AppStore.update((s) => {
          s.externalActionSource = EDappActionSource.extension_injected;
        });
      }

      this.sendActionMessage({
        uid: connectionUid,
        endTags: [],
        status: EDappActionConnectionStatus.attempting_reconnect,
      });
    }
  }

  sendActionMessage(actionMessage: TClientPostMessageResponse) {
    if (this.source === EDappActionSource.website_post_message) {
      // console.log("[RESP] [WEBSITE_POST] SENDING message from Meteor App", actionMessage);
      if (this._replyWindow != null) {
        if (this._referrer.knownRef) {
          this._replyWindow.postMessage(actionMessage, this._referrer.referrerOrigin);
        } else {
          this._replyWindow.postMessage(actionMessage, "*");
        }
      } else {
        console.error("Reply window not found, can't communicate with original website / Dapp");
      }
    } else {
      // console.log("[RESP] [EXTENSION_COM] SENDING message from Meteor App", actionMessage);
      const response: TResponseWalletCom = {
        action: "wallet_com_response",
        params: { ...actionMessage, tabId: this.tabId },
        pageMeta: this.pageMeta!,
      };

      chrome.runtime.sendMessage(response);
    }
  }
}

let manager: MeteorPostMessageManager | undefined;

export function getPostMessageManager(inputs?: {
  source: EDappActionSource;
  referrerUri?: string;
}): MeteorPostMessageManager {
  if (manager == null) {
    if (inputs == null) {
      throw new Error("Need to provide inputs to create Post Message Manager the first time.");
    }
    manager = new MeteorPostMessageManager(inputs.source, inputs.referrerUri);
  }

  return manager;
}
