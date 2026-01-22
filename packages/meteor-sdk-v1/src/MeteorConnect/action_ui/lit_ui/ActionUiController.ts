import { Task } from "@lit/task";
import { wait_utils } from "@meteorwallet/utils/javascript_helpers/wait.utils";
import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { ExecutableAction } from "../../action/ExecutableAction.ts";
import type { TMeteorConnectionExecutionTarget } from "../../MeteorConnect.types.ts";

export class ActionUiController implements ReactiveController {
  host: ReactiveControllerHost;
  // This promise is created when the SDK creates the action
  private action: ExecutableAction<any>;

  // The Task handles the async state of the Request ID
  meteorV2RequestIdTask: Task<any, string>;

  constructor(host: ReactiveControllerHost, executableAction: ExecutableAction<any>) {
    (this.host = host).addController(this);
    this.meteorV2RequestIdTask = new Task(this.host, {
      task: async () => {
        // const id = await this.requestIdPromise;
        // return id;
        await wait_utils.waitSeconds(2);
        return "test-id";
      },
      args: () => [],
    });
    this.action = executableAction;
  }

  hostConnected() {
    // Logic for when the popup opens
  }

  async executeAction(target: TMeteorConnectionExecutionTarget) {
    await this.action.execute(target);
  }
}
