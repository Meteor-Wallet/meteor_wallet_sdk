import { initialState, type StatusRenderer, Task } from "@lit/task";
import type { ReactiveControllerHost } from "lit";
import {
  lib_names_baseUrl,
  lib_names_kinds,
  type TLibNamesKind,
  type TLibNamesResult,
} from "./names_api.ts";

export class NamesController {
  host: ReactiveControllerHost;
  value?: string[];
  readonly kinds = lib_names_kinds;
  private task: Task<[TLibNamesKind], TLibNamesResult>;
  private _kind: TLibNamesKind = "";

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    this.task = new Task<[TLibNamesKind], TLibNamesResult>(
      host,
      async ([kind]: [TLibNamesKind]) => {
        if (!kind?.trim()) {
          return initialState;
        }
        try {
          const response = await fetch(`${lib_names_baseUrl}${kind}`);
          const data = await response.json();
          return data.results as TLibNamesResult;
        } catch {
          throw new Error(`Failed to fetch "${kind}"`);
        }
      },
      () => [this.kind],
    );
  }

  set kind(value: TLibNamesKind) {
    this._kind = value;
    this.host.requestUpdate();
  }
  get kind() {
    return this._kind;
  }

  render(renderFunctions: StatusRenderer<TLibNamesResult>) {
    return this.task.render(renderFunctions);
  }
}
