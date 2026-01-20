import type { MeteorConnect } from "../MeteorConnect.ts";
import type {
  TMCLoggingLevel,
  TMeteorConnectionExecutionTarget,
  TMeteorConnectionTarget,
} from "../MeteorConnect.types.ts";
import { MeteorConnectTestClient } from "../target_clients/test_client/MeteorConnectTestClient.ts";
import { MeteorConnectV1Client } from "../target_clients/v1_client/MeteorConnectV1Client.ts";
import { MCActionRegistryMap, type TMCActionRegistry } from "./mc_action.combined.ts";
import type {
  TMCActionRequestUnion,
  TMCActionRequestUnionExpandedInput,
} from "./mc_action.types.ts";

export class ExecutableAction<R extends TMCActionRequestUnion<TMCActionRegistry>> {
  constructor(
    private request: R,
    private meteorConnect: MeteorConnect,
    private connectionTargetConfig: {
      allTargets: TMeteorConnectionTarget[];
      currentTarget?: TMeteorConnectionTarget;
    },
  ) {}

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

  getLastUsedExecutionTarget(): TMeteorConnectionExecutionTarget | undefined {
    return this.connectionTargetConfig.currentTarget?.executionTarget;
  }

  getExecutionTargets(): TMeteorConnectionExecutionTarget[] {
    return this.connectionTargetConfig.allTargets.map((t) => t.executionTarget);
  }

  async execute(
    executionTarget: TMeteorConnectionExecutionTarget,
  ): Promise<TMCActionRegistry[R["id"]]["output"]> {
    const request = this.request;

    if (request.id === "near::sign_in") {
      const response = await this.makeTargetedActionRequest(
        {
          id: request.id,
          expandedInput: request.input,
        },
        {
          executionTarget: executionTarget,
        },
      );

      await this.meteorConnect.addSignedInAccount(response.output);

      return response.output;
    }

    const expandedInput: any = {
      ...request.input,
    };

    let connection: any = expandedInput.connection;

    const meta = MCActionRegistryMap[request.id].meta;

    if (meta.inputTransform.some((i) => i === "targeted_account")) {
      const account = await this.meteorConnect.getAccountOrThrow(request.input.target);
      expandedInput.account = account;
      connection = account.connection;
    }

    if (connection == null) {
      throw new Error(
        this.formatMsg("Couldn't find a connection configuration to complete the wallet action"),
      );
    }

    const response = await this.makeTargetedActionRequest(
      {
        id: request.id,
        expandedInput: expandedInput,
      },
      connection,
    );

    return response.output;
  }

  private async makeTargetedActionRequest<
    R extends TMCActionRequestUnionExpandedInput<TMCActionRegistry>,
  >(
    request: R,
    connection: TMeteorConnectionTarget,
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
