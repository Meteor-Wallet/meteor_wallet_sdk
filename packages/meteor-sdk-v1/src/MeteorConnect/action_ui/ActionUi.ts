import { wait_utils } from "@meteorwallet/utils/javascript_helpers/wait.utils";
import type { ExecutableAction } from "../action/ExecutableAction";
import { MeteorLogger } from "../logging/MeteorLogger";
import type { TMeteorConnectionExecutionTarget } from "../MeteorConnect.types";
import { METEOR_ACTION_UI_POPUP_PARENT_ID } from "./action_ui.static";
import type { IRenderActionUi_Input } from "./action_ui.types";
import { GILROY_FONT_FAMILY_DATA_URL_STYLESHEET } from "./lit_ui/font/gilroy-font-kit/gilroy_font.static";
import { MeteorActionUiContainer } from "./lit_ui/meteor-action-ui-container";
import { MeteorActionUiOverlay } from "./lit_ui/meteor-action-ui-overlay";

declare global {
  interface Window {
    // meteorWallet: any;
    openMeteorExtension: () => void;
    openMeteorWeb: () => void;
    openMobileDeepLink: () => void;
  }
}

// This is mostly for Safari on iOS which requires user interaction to open new tabs/windows,
// but we can use it as a general flag for whether we should attempt to open windows immediately or
// show a prompt for the user to click before opening windows, since many browsers are moving towards stricter popup blocking.
function usingBrowserThatRequiresUserAction() {
  // Check for mobile browsers
  const userAgent = navigator.userAgent.toLowerCase();

  // Detect mobile devices
  const isMobile = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent,
  );

  // Detect Safari (but exclude Chrome-based browsers that contain 'safari' in UA string)
  const isSafari =
    /safari/i.test(userAgent) && !/chrome|chromium|crios|edge|brave/i.test(userAgent);

  return isMobile || isSafari;
}

export class ActionUi {
  private container: HTMLElement | null = null;
  private actionUiComponent: MeteorActionUiContainer | null = null;
  private styleElement: HTMLStyleElement | null = null;
  static shared: ActionUi = new ActionUi();
  private logger = MeteorLogger.createLogger("MeteorConnect:ActionUi");
  // private _onCancelAction: (() => void) | undefined = undefined;
  private knownExecutionTargetBeforeUiCheck: TMeteorConnectionExecutionTarget | undefined =
    undefined;

  /**
   * Opens the UI and returns a Promise that resolves with the data
   * or rejects if the user cancels.
   */
  public async prompt<A extends ExecutableAction<any>>(
    input: IRenderActionUi_Input<A>,
  ): Promise<A extends ExecutableAction<infer O> ? O : never> {
    try {
      const responsePromise = input.action.waitForExecutionOutput();

      let knownExecutionTarget = input.action.getActionKnownContextualTarget();
      // Store the original known target before we potentially override it
      this.knownExecutionTargetBeforeUiCheck = knownExecutionTarget;

      // it is better we just force user to click again
      // most browser nowadays block any non-user interaction initiated window/tab opening
      // so if the dapp request multiple action in a row, it is better to just ask user to click again instead of trying to open multiple window/tab and get blocked by browser

      if (usingBrowserThatRequiresUserAction()) {
        knownExecutionTarget = undefined;
      }
      // knownExecutionTarget = undefined;

      if (knownExecutionTarget != null) {
        this.logger.log(
          `Action has known contextual target ${knownExecutionTarget}, executing with that target`,
        );
        input.action.execute(knownExecutionTarget);
      }

      await wait_utils.waitMillis(10);

      this.renderAction(input, knownExecutionTarget);

      const response = await responsePromise;
      this.logger.log("Prompted action finished", response);
      return response;
    } finally {
      this.cleanup();
    }
    /*
    return new Promise((resolve, reject) => {
      // 1. Setup the DOM (Same logic as before)
      this.renderAction(input);

      if (!this.actionUiComponent) return reject("Failed to initialize UI");

      // 2. Listen for the 'submit' event
      // const handleSubmit = (e: any) => {
      //   const data = e.detail;
      //   this.cleanup(); // Self-destroy after action
      //   resolve(data);
      // };

      // 3. Listen for 'cancel' or 'close'
      const handleCancel = () => {
        this.cleanup();
        reject(new Error("User cancelled interaction"));
      };

      // this.actionUiComponent.addEventListener("sdk-submit", handleSubmit, { once: true });
      this.actionUiComponent.addEventListener("sdk-cancel", handleCancel, { once: true });
    });*/
  }

  private renderAction(
    input: IRenderActionUi_Input,
    executedTarget?: TMeteorConnectionExecutionTarget,
  ) {
    if (input.strategy?.strategy === "target_element") {
      this.container =
        typeof input.strategy.element === "string"
          ? document.querySelector(input.strategy.element)
          : input.strategy.element;
    }

    if (!this.container) {
      this.container = this.createPopupOverlay(input.action);
      document.body.appendChild(this.container);
    }

    if (this.styleElement == null) {
      this.styleElement = document.createElement("style");
      this.styleElement.textContent = GILROY_FONT_FAMILY_DATA_URL_STYLESHEET;
      document.head.appendChild(this.styleElement);
    }

    // If there was a known execution target and we didn't execute it due to browser restrictions,
    // show the continue-action-screen instead of the normal action UI
    if (
      this.knownExecutionTargetBeforeUiCheck != null &&
      executedTarget == null &&
      usingBrowserThatRequiresUserAction()
    ) {
      this._renderNormalActionUI(input, this.knownExecutionTargetBeforeUiCheck);
    } else {
      this._renderNormalActionUI(input);
    }
  }

  private _renderNormalActionUI(
    input: IRenderActionUi_Input,
    pendingKnownExecutionTarget?: TMeteorConnectionExecutionTarget,
  ) {
    this.actionUiComponent = new MeteorActionUiContainer();
    this.actionUiComponent.action = input.action;
    this.actionUiComponent.pendingKnownExecutionTarget = pendingKnownExecutionTarget;
    this.actionUiComponent.closeAction = () => {
      this.cleanup();
      input.action.cancelAction();
    };

    if (this.container) {
      this.container.appendChild(this.actionUiComponent);
    }
  }

  /**
   * Manual clean-up method that users can call,
   * or used internally by the SDK.
   */
  public cleanup() {
    if (this.actionUiComponent) {
      this.actionUiComponent.remove();
      this.actionUiComponent = null;
    }

    // Only remove the container if we created it (the popup overlay)
    if (this.container && this.container.id === METEOR_ACTION_UI_POPUP_PARENT_ID) {
      this.container.remove();
      this.container = null;
    }

    this.knownExecutionTargetBeforeUiCheck = undefined;
  }

  private createPopupOverlay(action: ExecutableAction<any>): HTMLElement {
    const popupOverlay = new MeteorActionUiOverlay();
    this.logger.log("Created popup overlay for action UI", popupOverlay);
    popupOverlay.closeAction = () => {
      this.cleanup();
      action.cancelAction();
    };
    return popupOverlay;
  }
}
