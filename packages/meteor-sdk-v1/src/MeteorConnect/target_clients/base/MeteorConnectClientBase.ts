import type { TMCActionOutput, TMCActionRegistry } from "../../action/mc_action.combined";
import type { TMCActionRequestUnionExpandedInput } from "../../action/mc_action.types";
import type { LoggerInstance } from "../../logging/MeteorLogger";
import { MeteorConnect } from "../../MeteorConnect";
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

  abstract getEnvironmentSupportedPlatforms(): Promise<TMeteorConnectionExecutionTarget[]>;
}
