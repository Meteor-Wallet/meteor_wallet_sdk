import type { ExecutableAction } from "../action/ExecutableAction";

export type TRenderStrategy =
  | {
      strategy: "target_element";
      element: HTMLElement | string;
    }
  | {
      strategy: "create_popup";
    };

export interface IRenderActionUi_Input<A extends ExecutableAction<any> = ExecutableAction<any>> {
  action: A;
  strategy?: TRenderStrategy;
  // onCloseAction?: () => void;
  // onExecutionComplete?: (
  //   output: A extends ExecutableAction<infer O> ? TMCActionRegistry[O["id"]]["output"] : never,
  // ) => void;
}
