import type { TMCActionRegistry } from "../../action/mc_action.combined.ts";
import type { TMCActionRequestUnionExpandedInput } from "../../action/mc_action.types.ts";
import { MeteorConnect } from "../../MeteorConnect.ts";
import type {
  TMeteorConnectionExecutionTarget,
  TMeteorConnectionTarget,
} from "../../MeteorConnect.types.ts";

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

  abstract getSupportedExecutionTargets(): Promise<TMeteorConnectionTarget[]>;

  abstract makeRequest<K extends keyof TMCActionRegistry>(
    request: TMCActionRequestUnionExpandedInput<TMCActionRegistry>,
    connection: TMeteorConnectionTarget,
  ): Promise<{ output: TMCActionRegistry[K]["output"] }>;
}
