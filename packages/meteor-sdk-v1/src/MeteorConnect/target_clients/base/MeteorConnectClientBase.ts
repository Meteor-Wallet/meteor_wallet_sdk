import type { TMCActionOutput, TMCActionRegistry } from "../../action/mc_action.combined.ts";
import type { TMCActionRequestUnionExpandedInput } from "../../action/mc_action.types.ts";
import { MeteorConnect } from "../../MeteorConnect.ts";
import type { TMeteorExecutionTargetConfig } from "../../MeteorConnect.types.ts";

export abstract class MeteorConnectClientBase {
  abstract readonly clientName: string;

  constructor(protected readonly meteorConnect: MeteorConnect) {}

  protected log(actionDescription: string, meta?: any) {
    const level = this.meteorConnect.getLoggingLevel();

    if (level === "none") {
      return;
    }

    if (level === "basic") {
      console.log(this.formatMsg(actionDescription));
    }

    if (level === "debug") {
      console.log(this.formatMsg(actionDescription), meta);
    }
  }

  protected formatMsg(message: string): string {
    return `${this.clientName}: ${message}`;
  }

  abstract getExecutionTargetConfigs<
    R extends TMCActionRequestUnionExpandedInput<TMCActionRegistry>,
  >(request: R): Promise<TMeteorExecutionTargetConfig[]>;

  abstract makeRequest<R extends TMCActionRequestUnionExpandedInput<TMCActionRegistry>>(
    request: R,
    connection: TMeteorExecutionTargetConfig,
  ): Promise<{ output: TMCActionOutput<R> }>;
}
