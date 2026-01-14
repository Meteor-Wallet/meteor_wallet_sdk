import type { TMCActionDefinition } from "../../action/mc_action.combined.types.ts";
import { MeteorConnect } from "../../MeteorConnect.ts";

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

  async makeRequest<R extends TMCActionDefinition = TMCActionDefinition>(
    request: R["request"],
  ): Promise<R> {
    return {
      request,
      outcome: await this.resolveRequest(request),
    } as R;
  }

  abstract resolveRequest<R extends TMCActionDefinition = TMCActionDefinition>(
    request: R["request"],
  ): Promise<R["outcome"]>;
}
