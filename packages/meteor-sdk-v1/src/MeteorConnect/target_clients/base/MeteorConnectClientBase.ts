import type { TMCActionOutput, TMCActionRegistry } from "../../action/mc_action.combined.ts";
import type { TMCActionRequestUnionExpandedInput } from "../../action/mc_action.types.ts";
import type { LoggerInstance } from "../../logging/MeteorLogger.ts";
import { MeteorConnect } from "../../MeteorConnect.ts";
import type {
  TMeteorConnectionExecutionTarget,
  TMeteorExecutionTargetConfig,
} from "../../MeteorConnect.types.ts";

export abstract class MeteorConnectClientBase {
  abstract readonly clientName: string;
  abstract readonly executionTargets: TMeteorConnectionExecutionTarget[];
  protected abstract logger: LoggerInstance;

  constructor(protected readonly meteorConnect: MeteorConnect) {}

  abstract getExecutionTargetConfigs<
    R extends TMCActionRequestUnionExpandedInput<TMCActionRegistry>,
  >(request: R): Promise<TMeteorExecutionTargetConfig[]>;

  abstract makeRequest<R extends TMCActionRequestUnionExpandedInput<TMCActionRegistry>>(
    request: R,
    connection: TMeteorExecutionTargetConfig,
  ): Promise<TMCActionOutput<R>>;
}
