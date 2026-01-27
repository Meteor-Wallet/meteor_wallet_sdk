import { ActionUi } from "../action_ui/ActionUi";
import type { IRenderActionUi_Input } from "../action_ui/action_ui.types";
import { MeteorLogger } from "../logging/MeteorLogger";
import type { MeteorConnect } from "../MeteorConnect";
import type {
  TMeteorConnectionExecutionTarget,
  TMeteorExecutionTargetConfig,
} from "../MeteorConnect.types.ts";
import { MCActionRegistryMap, type TMCActionRegistry } from "./mc_action.combined";
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
  private executeWithUi_promise?: Promise<TMCActionRegistry[R["id"]]["output"]>;
  private waitForExecutionOutput_promise?: Promise<TMCActionRegistry[R["id"]]["output"]>;

  private actionResolvers: ((output: TMCActionRegistry[R["id"]]["output"]) => void)[] = [];
  private actionRejecters: ((reason?: any) => void)[] = [];

  // private waitForExecutionOutput_resolve?: (output: TMCActionRegistry[R["id"]]["output"]) => void;
  // private waitForExecutionOutput_reject?: (reason?: any) => void;

  private logger = MeteorLogger.createLogger("MeteorConnect:ExecutableAction");

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
        this.logger.formatMsg(`Couldn't execute action (targeted platform / protocol needs to be provided on execution, or otherwise targeted platform doesn't support the action)
Available targets: [${this.connectionTargetConfig.allExecutionTargets.map((c) => c.executionTarget)}]`),
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
          this.actionResolvers.forEach((resolver) => resolver(value));
          return value;
        })
        .catch((err) => {
          this.actionRejecters.forEach((rejecter) => rejecter(err));
          throw err;
        });
      this.waitForExecutionOutput_promise = this.execute_promise;
    }

    return this.execute_promise;
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
    if (this.executeWithUi_promise == null) {
      this.executeWithUi_promise = this._promptForExecution(input);
    }

    return this.executeWithUi_promise;
    // return this._promptForExecution(input);
  }

  private async _waitForExecutionOutput(): Promise<TMCActionRegistry[R["id"]]["output"]> {
    if (this.execute_promise != null) {
      return this.execute_promise;
    }

    return new Promise<TMCActionRegistry[R["id"]]["output"]>((resolve, reject) => {
      this.actionResolvers.push(resolve);
      this.actionRejecters.push(reject);
    });
  }

  async waitForExecutionOutput(): Promise<TMCActionRegistry[R["id"]]["output"]> {
    if (this.waitForExecutionOutput_promise == null) {
      this.waitForExecutionOutput_promise = this._waitForExecutionOutput();
    }

    return this.waitForExecutionOutput_promise;
  }

  private async makeTargetedActionRequest<
    R extends TMCActionRequestUnionExpandedInput<TMCActionRegistry>,
  >(
    request: R,
    connection: TMeteorExecutionTargetConfig,
  ): Promise<{ output: TMCActionRegistry[R["id"]]["output"] }> {
    const client = this.meteorConnect.getClientByExecutionTargetId(connection.executionTarget);

    this.logger.log(
      `Requesting action [${request.id}] for connection [${connection.executionTarget}]`,
    );

    return {
      output: await client.makeRequest(request, connection),
    };
  }
}
