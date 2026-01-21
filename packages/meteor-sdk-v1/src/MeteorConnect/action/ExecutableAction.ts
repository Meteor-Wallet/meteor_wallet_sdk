import type { MeteorConnect } from "../MeteorConnect.ts";
import type {
  TMCLoggingLevel,
  TMeteorConnectionExecutionTarget,
  TMeteorExecutionTargetConfig,
} from "../MeteorConnect.types.ts";
import { MeteorConnectTestClient } from "../target_clients/test_client/MeteorConnectTestClient.ts";
import { MeteorConnectV1Client } from "../target_clients/v1_client/MeteorConnectV1Client.ts";
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
    return `MeteorConnect: ${message}`;
  }

  getAllExecutionTargetConfigs(): TMeteorExecutionTargetConfig[] {
    return this.connectionTargetConfig.allExecutionTargets;
  }

  async execute(
    executionTarget?: TMeteorConnectionExecutionTarget,
  ): Promise<TMCActionRegistry[R["id"]]["output"]> {
    const request = this.request;

    const resolvedExecutionTarget: TMeteorConnectionExecutionTarget | undefined =
      executionTarget ?? this.connectionTargetConfig.contextualExecutionTarget;

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

    const response = await this.makeTargetedActionRequest(
      {
        id: request.id,
        expandedInput: this.expandedInput,
      },
      executionTargetConfig,
    );

    return response.output;
  }

  private async makeTargetedActionRequest<
    R extends TMCActionRequestUnionExpandedInput<TMCActionRegistry>,
  >(
    request: R,
    connection: TMeteorExecutionTargetConfig,
  ): Promise<{ output: TMCActionRegistry[R["id"]]["output"] }> {
    this.log(`Requesting action [${request.id}] for connection [${connection.executionTarget}]`);

    if (connection.executionTarget === "v1_web" || connection.executionTarget === "v1_ext") {
      return new MeteorConnectV1Client(this.meteorConnect).makeRequest(request, connection);
    }

    if (connection.executionTarget === "test") {
      return new MeteorConnectTestClient(this.meteorConnect).makeRequest(request, connection);
    }

    throw new Error(
      `MeteorConnect Request: Platform [${connection["platformTarget"]}] not implemented`,
    );
  }
}
