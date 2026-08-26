import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { ExecutableAction } from "../../action/ExecutableAction";
import type { TMeteorConnectionExecutionTarget } from "../../MeteorConnect.types";

export class ActionUiController implements ReactiveController {
  host: ReactiveControllerHost;
  // This promise is created when the SDK creates the action
  private action: ExecutableAction<any>;
  private cleanupUi?: () => void;

  constructor(
    host: ReactiveControllerHost,
    executableAction: ExecutableAction<any>,
    cleanupUi?: () => void,
  ) {
    (this.host = host).addController(this);
    this.action = executableAction;
    this.cleanupUi = cleanupUi;
  }

  async prepareMobileBridge(options?: Parameters<ExecutableAction<any>["prepareMobileBridge"]>[0]) {
    return this.action.prepareMobileBridge(options);
  }

  async refreshMobileBridge(options?: Parameters<ExecutableAction<any>["refreshMobileBridge"]>[0]) {
    return this.action.refreshMobileBridge(options);
  }

  async resetMobileIdentityAndRePair() {
    return this.action.resetMobileIdentityAndRePair();
  }

  hostConnected() {
    // Logic for when the popup opens
  }

  async executeAction(target: TMeteorConnectionExecutionTarget) {
    try {
      await this.action.execute(target);
    } catch (e) {
      // Ensure UI gets cleaned if execution fails
      this.cleanupUi?.();
      throw e;
    }
  }
}

// Mark this module as hot-reloadable to prevent bubbling reloads up to the app.
if (import.meta.hot) {
  import.meta.hot.accept();
}
