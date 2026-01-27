import { Task } from "@lit/task";
import { wait_utils } from "@meteorwallet/utils/javascript_helpers/wait.utils";
import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { ExecutableAction } from "../../action/ExecutableAction.ts";
import type { TMeteorConnectionExecutionTarget } from "../../MeteorConnect.types.ts";

export class ActionUiController implements ReactiveController {
  host: ReactiveControllerHost;
  // This promise is created when the SDK creates the action
  private action: ExecutableAction<any>;
  private cleanupUi?: () => void;

  // The Task handles the async state of the Request ID
  meteorV2RequestIdTask: Task<any, string>;

  constructor(
    host: ReactiveControllerHost,
    executableAction: ExecutableAction<any>,
    cleanupUi?: () => void,
  ) {
    (this.host = host).addController(this);
    this.meteorV2RequestIdTask = new Task(this.host, {
      task: async () => {
        // const id = await this.requestIdPromise;
        // return id;
        await wait_utils.waitSeconds(0.2);
        return "meteorwallet://wallet";
      },
      args: () => [],
    });
    this.action = executableAction;
    this.cleanupUi = cleanupUi;
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
