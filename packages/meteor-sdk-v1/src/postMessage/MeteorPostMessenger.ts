import { wait_utils } from "@meteorwallet/utils/javascript_helpers/wait.utils";
import { nanoid } from "nanoid";
import { stringify } from "query-string";
import { envConfig } from "../envConfig";
import { MeteorLogger } from "../MeteorConnect/logging/MeteorLogger";
import type { TMeteorConnectV1ExecutionTargetConfig } from "../MeteorConnect/target_clients/v1_client/MeteorConnectV1Client.types";
import { SIGN_POPUP_HEIGHT, SIGN_POPUP_WIDTH } from "../ported_common/constants_theme";
import {
  EDappActionConnectionStatus,
  EDappActionSource,
  EExternalActionType,
} from "../ported_common/dapp/dapp.enums";
import { EDappActionErrorTag } from "../ported_common/dapp/dapp.errors";
import {
  type IMeteorActionResponse_Output,
  type IMeteorComInjectedObject,
  type IMeteorComInjectedObjectV2,
  type IPostMessageConnection,
  MeteorActionError,
  type TClientPostMessageResponse,
  type TMeteorComListener,
  type TPostMessageSend,
} from "../ported_common/dapp/dapp.types";
import { ENearNetwork } from "../ported_common/near/near_basic_types";

interface IOConnectAndWaitForResponse_Input {
  network: ENearNetwork;
  actionType: EExternalActionType;
  inputs: any;
  forceExecutionTargetConfig: TMeteorConnectV1ExecutionTargetConfig | undefined;
}

declare global {
  interface Window {
    meteorCom?: IMeteorComInjectedObject;
    meteorComV2?: IMeteorComInjectedObjectV2;
  }
}

class ComWindow {
  comType: EDappActionSource;
  websiteWindow: Window | undefined;
  // hasActiveCom: boolean;
  wasOpened: boolean;
  walletOrigin: string;
  directExtensionState?: {
    listener: TMeteorComListener<TClientPostMessageResponse>;
  };
  private lastResponseStatus: EDappActionConnectionStatus | null = null;
  private lastSendStatus: EDappActionConnectionStatus | null = null;

  private logger = MeteorLogger.createLogger("MeteorPostMessenger:ComWindow");

  constructor(
    connection: IPostMessageConnection,
    listener: TMeteorComListener<TClientPostMessageResponse>,
  ) {
    this.logger.log("Creating ComWindow for connection", connection);

    const baseWalletUrl =
      connection.forceExecutionTargetConfig?.executionTarget === "v1_web_localhost"
        ? connection.forceExecutionTargetConfig.baseUrl
        : envConfig.wallet_base_url;
    const url = new URL(baseWalletUrl);
    this.walletOrigin = url.origin;

    const forceWeb =
      connection.forceExecutionTargetConfig?.executionTarget === "v1_web" ||
      connection.forceExecutionTargetConfig?.executionTarget === "v1_web_localhost";

    if (forceWeb || window.meteorCom == null) {
      this.comType = EDappActionSource.website_post_message;
      this.logger.log(
        window.meteorCom == null
          ? "No extension found. Need to connect to web popup for Meteor communication"
          : "Extension found but user requested Meteor Web wallet for action",
      );

      const queryParams: {
        source: EDappActionSource.website_post_message;
        connectionUid: string;
        pageUri?: string;
      } = {
        source: EDappActionSource.website_post_message,
        connectionUid: connection.uid,
        pageUri: encodeURIComponent(window.location.href),
      };

      const w = SIGN_POPUP_WIDTH;
      const h = SIGN_POPUP_HEIGHT;

      const y = window.top!.outerHeight / 2 + window.top!.screenY - h / 2;
      const x = window.top!.outerWidth / 2 + window.top!.screenX - w / 2;

      const newWindow: Window | null = window.open(
        `${baseWalletUrl}/connect/${connection.network}/${
          connection.actionType
        }?${stringify(queryParams)}`,
        "_blank",
        `popup=1,width=${w},height=${h},top=${y},left=${x}`,
      );

      if (newWindow != null) {
        this.websiteWindow = newWindow;
      } else {
        throw new MeteorActionError({
          message: "Couldn't open popup window to complete wallet action",
          endTags: [EDappActionErrorTag.POPUP_WINDOW_OPEN_FAILED],
        });
      }

      window.addEventListener("message", (event) =>
        listener(event.data as TClientPostMessageResponse),
      );
      this.wasOpened = false;
    } else {
      this.comType = EDappActionSource.extension_injected;

      if (connection.forceExecutionTargetConfig?.executionTarget === "v1_ext") {
        this.directExtensionState = {
          listener,
        };
      } else {
        // console.log("Need to communicate with the extension!");
        window.meteorCom.addMessageDataListener(listener);
      }

      this.wasOpened = true;
    }
  }

  focus() {
    if (this.comType === EDappActionSource.website_post_message) {
      this.websiteWindow?.focus();
    }
  }

  sendMessage(data: TPostMessageSend) {
    if (this.comType === EDappActionSource.website_post_message) {
      this.websiteWindow?.postMessage(data, this.walletOrigin);
    } else {
      if (this.directExtensionState != null) {
        const callDirect = async (d: TPostMessageSend) => {
          const response = await window.meteorComV2?.sendMessageDataAndRespond(d);

          /* if (
            this.lastResponseStatus === EDappActionConnectionStatus.closed_fail ||
            this.lastResponseStatus === EDappActionConnectionStatus.closed_success
          ) {
            return;
          } */

          if (response?.status !== this.lastResponseStatus) {
            this.logger.log(
              `[sendMessageDataAndRespond()]: RESPONSE [status = ${response?.status}]`,
              response,
            );
            this.lastResponseStatus = response?.status ?? null;
          }

          this.directExtensionState!.listener(response);
        };

        if (this.lastSendStatus !== data.status) {
          this.logger.log(`[sendMessageDataAndRespond()]: SEND [status = ${data.status}]`, data);
          this.lastSendStatus = data.status;
        }

        callDirect(data);
      } else {
        window.meteorCom?.sendMessageData(data);
      }
    }
  }

  isWindowClosed(): boolean {
    if (this.comType === EDappActionSource.website_post_message) {
      return this.websiteWindow?.closed ?? true;
    } else {
      return false;
    }
  }

  hasActiveWindow() {
    if (this.comType === EDappActionSource.website_post_message) {
      return this.websiteWindow != null;
    } else {
      return true;
    }
  }

  close() {
    if (this.comType === EDappActionSource.website_post_message) {
      delete this.websiteWindow;
    } else {
    }
  }
}

const pingInterval = 100;

class MeteorPostMessenger {
  baseWalletUrl: string;
  walletOrigin: string;
  // listener: (event: MessageEvent) => void;
  listener: (data: TClientPostMessageResponse | undefined) => void;
  connections: IPostMessageConnection[] = [];
  // comWindow: { win: Window; wasOpened: boolean } | undefined;
  comWindow: ComWindow | undefined;
  comInterval: any;

  constructor() {
    const baseUrl = envConfig.wallet_base_url;

    const url = new URL(baseUrl);

    this.baseWalletUrl = baseUrl;
    this.walletOrigin = url.origin;

    this.listener = (data) => {
      // console.log("[ METEOR POST MESSENGER !!! MESSAGE ] Received data", data);

      if (data != null) {
        // const data: TClientPostMessageResponse = event.data;
        // console.log("Meteor Post Messenger received event with data: ", data);

        const currentConnection = this.connections.find((con) => con.uid === data.uid);

        if (currentConnection != null) {
          this.updateConnection(currentConnection.uid, {
            lastConnection: Date.now(),
          });

          if (data.status === EDappActionConnectionStatus.attempting_reconnect) {
            this.updateConnection(currentConnection.uid, {
              status: EDappActionConnectionStatus.initializing,
            });

            this.sendComs();
          }

          if (
            data.status === EDappActionConnectionStatus.connected &&
            currentConnection.status === EDappActionConnectionStatus.initializing
          ) {
            this.updateConnection(currentConnection.uid, {
              status: EDappActionConnectionStatus.connected,
            });
          }

          if (data.status === EDappActionConnectionStatus.closed_success) {
            this.updateConnection(currentConnection.uid, {
              status: EDappActionConnectionStatus.closed_success,
            });

            this.sendComs();

            wait_utils.waitMillis(100).then(() => {
              currentConnection.resolve({
                success: true,
                endTags: [],
                payload: data.payload,
              });
            });
          }

          if (data.status === EDappActionConnectionStatus.closed_fail) {
            this.updateConnection(currentConnection.uid, {
              status: EDappActionConnectionStatus.closed_fail,
            });
            this.sendComs();
            // const error = new MeteorActionError({ endTags: data.endTags });
            // console.log("Ending failure with error", { ...error });
            currentConnection.reject(new MeteorActionError({ endTags: data.endTags }));
          }

          if (data.status === EDappActionConnectionStatus.closed_window) {
            this.updateConnection(currentConnection.uid, {
              status: EDappActionConnectionStatus.closed_window,
            });

            currentConnection.reject(
              new MeteorActionError({
                endTags: data.endTags,
                message: "User closed the window",
              }),
            );
          }

          if (
            [
              EDappActionConnectionStatus.disconnected,
              EDappActionConnectionStatus.closed_fail,
              EDappActionConnectionStatus.closed_window,
              EDappActionConnectionStatus.closed_success,
            ].includes(data.status)
          ) {
            this.removeConnection(currentConnection.uid);
          }
        } /* else {
          console.warn(`Connection data received but no ID found "${data.uid}"`, data);
        }*/
      }
    };
    // window.addEventListener("message", this.listener);
  }

  removeConnection(uid: string) {
    this.connections = this.connections.filter((con) => con.uid !== uid);

    if (this.connections.length === 0) {
      delete this.comWindow;
      clearInterval(this.comInterval);
      delete this.comInterval;
    }
  }

  updateConnection(uid: string, newConnectionProperties: Partial<IPostMessageConnection>) {
    this.connections = this.connections.map((con) => {
      if (con.uid === uid) {
        return {
          ...con,
          ...newConnectionProperties,
          uid: con.uid,
        };
      }

      return con;
    });
  }

  sendComs() {
    if (this.comWindow?.hasActiveWindow() && this.connections.length > 0) {
      if (this.comInterval == null) {
        this.comInterval = setInterval(() => this.sendComs(), pingInterval);
      }

      if (this.comWindow.isWindowClosed()) {
        if (this.comWindow.wasOpened) {
          for (const con of this.connections) {
            con.reject(
              new MeteorActionError({
                message: "User closed the window before completing the action",
                endTags: [EDappActionErrorTag.INCOMPLETE_ACTION, EDappActionErrorTag.WINDOW_CLOSED],
              }),
            );
          }

          this.connections = [];
          this.comWindow.close();
        } else {
          console.log("Window is closed, need to allow popup");
        }
      } else {
        this.comWindow.wasOpened = true;
        for (const { network, actionType, endTags, status, inputs, uid } of this.connections) {
          const postMessage: TPostMessageSend = {
            endTags,
            actionType: actionType,
            status,
            uid,
            network,
          };

          if (status === EDappActionConnectionStatus.initializing) {
            postMessage.inputs = inputs;
          }

          this.comWindow.sendMessage(postMessage);
        }
      }
    } else {
      clearInterval(this.comInterval);
      delete this.comInterval;
    }
  }

  addAndStartConnection(connection: IPostMessageConnection) {
    if (this.connections.length > 0) {
      for (const con of this.connections) {
        con.status = EDappActionConnectionStatus.disconnected;
        con.endTags = [EDappActionErrorTag.NEW_ACTION_STARTED];
      }
    }

    this.connections.push(connection);

    if (this.comWindow == null || !this.comWindow.hasActiveWindow()) {
      this.comWindow = new ComWindow(connection, this.listener);
    } else {
      this.comWindow.focus();
    }

    this.sendComs();
  }

  async connectAndWaitForResponse<T>({
    actionType,
    network,
    inputs,
    forceExecutionTargetConfig,
  }: IOConnectAndWaitForResponse_Input): Promise<IMeteorActionResponse_Output<T>> {
    let newConnection: IPostMessageConnection = {
      uid: nanoid(),
      actionType,
      lastAttemptedConnection: 0,
      lastConnection: 0,
      status: EDappActionConnectionStatus.initializing,
      promise: undefined as any,
      reject: undefined as any,
      resolve: undefined as any,
      currentPayload: {},
      inputs,
      network,
      endTags: [],
      forceExecutionTargetConfig,
    };

    console.log("Starting execution for V1", newConnection);

    const promise = new Promise<IMeteorActionResponse_Output<any>>((resolve, reject) => {
      newConnection.resolve = resolve;
      newConnection.reject = (error: Error) => {
        this.connections = this.connections.filter((con) => con.uid !== newConnection.uid);
        reject(error);
      };
    });

    newConnection.promise = promise;

    this.addAndStartConnection(newConnection);

    return await promise;
  }
}

let postMessenger: MeteorPostMessenger | undefined;

export function getMeteorPostMessenger(): MeteorPostMessenger {
  if (postMessenger == null) {
    postMessenger = new MeteorPostMessenger();
  }

  return postMessenger;
}
