import { ActionUi } from "../action_ui/ActionUi.ts";
import type { IRenderActionUi_Input } from "../action_ui/action_ui.types.ts";
import type { MeteorConnect } from "../MeteorConnect.ts";
import type {
  TMCLoggingLevel,
  TMeteorConnectionExecutionTarget,
  TMeteorExecutionTargetConfig,
} from "../MeteorConnect.types.ts";
import { MCActionRegistryMap, type TMCActionRegistry } from "./mc_action.combined.ts";
import type {
  IMCActionMeta,
  TMCActionRequestUnion,
  TMCActionRequestUnionExpandedInput,
} from "./mc_action.types.ts";

export class ExecutableAction<R extends TMCActionRequestUnion<TMCActionRegistry>> {
  readonly id: R["id"];
  readonly expandedInput: any;
  private readonly meta: IMCActionMeta;
  private execute_promise?: Promise<TMCActionRegistry[R["id"]]["output"]>;
  private exeucteWithUi_promise?: Promise<TMCActionRegistry[R["id"]]["output"]>;

  private waitForExecutionOutput_promise?: Promise<TMCActionRegistry[R["id"]]["output"]>;
  private waitForExecutionOutput_resolve?: (output: TMCActionRegistry[R["id"]]["output"]) => void;
  private waitForExecutionOutput_reject?: (reason?: any) => void;

  constructor(
    private readonly request: R,
    expandedInput: any,
    private readonly meteorConnect: MeteorConnect,
    private readonly connectionTargetConfig: {
      allExecutionTargets: TMeteorExecutionTargetConfig[];
      contextualExecutionTarget?: TMeteorConnectionExecutionTarget;
    },
  ) {
    this.id = request.id;
    this.expandedInput = expandedInput;
    this.meta = MCActionRegistryMap[this.id].meta;
    this.loggingLevel = meteorConnect.getLoggingLevel();
  }

  private loggingLevel: TMCLoggingLevel = "basic";

  private log(actionDescription: string, meta?: any) {
    if (this.loggingLevel === "none") {
      return;
    }

    if (this.loggingLevel === "basic") {
      console.log(this.formatMsg(actionDescription));
    }

    if (this.loggingLevel === "debug") {
      console.log(this.formatMsg(actionDescription), meta);
    }
  }

  private formatMsg(message: string): string {
    return `MeteorConnect [ExecutableAction]: ${message}`;
  }

  getAllExecutionTargetConfigs(): TMeteorExecutionTargetConfig[] {
    return this.connectionTargetConfig.allExecutionTargets;
  }

  getActionKnownContextualTarget(): TMeteorConnectionExecutionTarget | undefined {
    return this.connectionTargetConfig.contextualExecutionTarget;
  }

  private async _execute(
    executionTarget?: TMeteorConnectionExecutionTarget,
  ): Promise<TMCActionRegistry[R["id"]]["output"]> {
    const request = this.request;

    const resolvedExecutionTarget: TMeteorConnectionExecutionTarget | undefined =
      this.connectionTargetConfig.contextualExecutionTarget ?? executionTarget;

    const executionTargetConfig = this.connectionTargetConfig.allExecutionTargets.find(
      (config) => config.executionTarget === resolvedExecutionTarget,
    );

    if (executionTargetConfig == null) {
      throw new Error(
        this.formatMsg(
          `Couldn't execute action (targeted platform / protocol needs to be provided on execution, or otherwise targeted platform doesn't support the action)
Available targets: [${this.connectionTargetConfig.allExecutionTargets.map((c) => c.executionTarget)}]`,
        ),
      );
    }

    if (request.id === "near::sign_in") {
      const response = await this.makeTargetedActionRequest(
        {
          id: request.id,
          expandedInput: this.expandedInput,
        },
        executionTargetConfig,
      );

      await this.meteorConnect.addSignedInAccount(response.output);

      return response.output;
    }

    if (request.id === "near::sign_out") {
      const response = await this.makeTargetedActionRequest(
        {
          id: request.id,
          expandedInput: this.expandedInput,
        },
        executionTargetConfig,
      );

      await this.meteorConnect.removeSignedInAccount(response.output);

      return response.output;
    }

    const response = await this.makeTargetedActionRequest(
      {
        id: request.id,
        expandedInput: this.expandedInput,
      },
      executionTargetConfig,
    );

    return response.output;
  }

  async execute(
    executionTarget?: TMeteorConnectionExecutionTarget,
  ): Promise<TMCActionRegistry[R["id"]]["output"]> {
    if (this.execute_promise == null) {
      this.execute_promise = this._execute(executionTarget)
        .then((value) => {
          this.waitForExecutionOutput_resolve?.(value);
          return value;
        })
        .catch((err) => {
          this.waitForExecutionOutput_reject?.(err);
          throw err;
        });
      this.waitForExecutionOutput_promise = this.execute_promise;
    }

    return this.execute_promise;
    // return this._execute(executionTarget);
  }

  private async _promptForExecution(
    input?: Omit<IRenderActionUi_Input<this>, "action">,
  ): Promise<TMCActionRegistry[R["id"]]["output"]> {
    return (await ActionUi.shared.prompt({
      action: this,
      strategy: input?.strategy,
    })) as any;
  }

  async promptForExecution(
    input?: Omit<IRenderActionUi_Input<this>, "action">,
  ): Promise<TMCActionRegistry[R["id"]]["output"]> {
    if (this.exeucteWithUi_promise == null) {
      this.exeucteWithUi_promise = this._promptForExecution(input);
      this.waitForExecutionOutput_promise = this.exeucteWithUi_promise;
    }

    return this.exeucteWithUi_promise;
    // return this._promptForExecution(input);
  }

  private async _waitForExecutionOutput(): Promise<TMCActionRegistry[R["id"]]["output"]> {
    if (this.execute_promise != null) {
      return this.execute_promise;
    }

    return new Promise<TMCActionRegistry[R["id"]]["output"]>((resolve, reject) => {
      this.waitForExecutionOutput_resolve = resolve;
      this.waitForExecutionOutput_reject = reject;
    });
  }

  async waitForExecutionOutput(): Promise<TMCActionRegistry[R["id"]]["output"]> {
    if (this.waitForExecutionOutput_promise == null) {
      this.waitForExecutionOutput_promise = this._waitForExecutionOutput();
    }

    return this.waitForExecutionOutput_promise;
    // return this._waitForExecutionOutput();
  }

  private async makeTargetedActionRequest<
    R extends TMCActionRequestUnionExpandedInput<TMCActionRegistry>,
  >(
    request: R,
    connection: TMeteorExecutionTargetConfig,
  ): Promise<{ output: TMCActionRegistry[R["id"]]["output"] }> {
    this.log(`Requesting action [${request.id}] for connection [${connection.executionTarget}]`);

    return {
      output: await this.meteorConnect
        .getClientByExecutionTargetId(connection.executionTarget)
        .makeRequest(request, connection),
    };
  }
}
