import type { ExecutableAction } from "../action/ExecutableAction.ts";
import { METEOR_ACTION_UI_POPUP_PARENT_ID } from "./action_ui.static.ts";
import type { IRenderActionUi_Input } from "./action_ui.types.ts";
import { MeteorActionUiContainer } from "./lit_ui/meteor-action-ui-container.ts";

declare global {
  interface Window {
    // meteorWallet: any;
    openMeteorExtension: () => void;
    openMeteorWeb: () => void;
    openMobileDeepLink: () => void;
  }
}

export class ActionUi {
  private container: HTMLElement | null = null;
  private actionUiComponent: MeteorActionUiContainer | null = null;
  static shared: ActionUi = new ActionUi();

  /**
   * Opens the UI and returns a Promise that resolves with the data
   * or rejects if the user cancels.
   */
  public async prompt<A extends ExecutableAction<any>>(
    input: IRenderActionUi_Input<A>,
  ): Promise<A extends ExecutableAction<infer O> ? O : never> {
    this.renderAction(input);
    const response = await input.action.waitForExecutionOutput();
    console.log("Prompted action finished", response);
    return response;
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

  private renderAction(input: IRenderActionUi_Input<any>) {
    if (input.strategy?.strategy === "target_element") {
      this.container =
        typeof input.strategy.element === "string"
          ? document.querySelector(input.strategy.element)
          : input.strategy.element;
    }

    if (!this.container) {
      this.container = this.createPopupOverlay();
      document.body.appendChild(this.container);
    }

    this.actionUiComponent = new MeteorActionUiContainer();
    this.actionUiComponent.action = input.action;

    this.container.appendChild(this.actionUiComponent);

    /**
     * LIT TESTING COMPONENTS
     */
    // const something = new LitClockElement();
    // this.container.appendChild(something);
    //
    // const litNames = new LitNamesElement();
    // this.container.appendChild(litNames);
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
  }

  private createPopupOverlay(): HTMLElement {
    const overlay = document.createElement("div");
    overlay.id = METEOR_ACTION_UI_POPUP_PARENT_ID;
    Object.assign(overlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0,0,0,0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "10000",
    });
    return overlay;
  }
}
