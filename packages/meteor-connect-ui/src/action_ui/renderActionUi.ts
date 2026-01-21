import { ExecutableAction } from "@meteorwallet/sdk";

export type TRenderStrategy =
  | {
      strategy: "provide_container_element";
      element: HTMLElement;
    }
  | {
      strategy: "create_popup";
    };

export interface IRenderActionUi_Input<A extends ExecutableAction<any>> {
  action: A;
  strategy: TRenderStrategy;
  onExecutionComplete?: (output: A extends ExecutableAction<infer O> ? O : never) => void;
}

export function renderActionUi<A extends ExecutableAction<any>>({
  action,
  onExecutionComplete,
  strategy,
}: IRenderActionUi_Input<A>) {
  let root: HTMLElement;

  if (strategy.strategy === "provide_container_element") {
    root = strategy.element;
  } else if (strategy.strategy === "create_popup") {
    const foundPopupContainer = document.getElementById("meteor-connect-popup-container");

    const divPopupLayoutParent = document.createElement("div");
    divPopupLayoutParent.setAttribute("id", "meteor-connect-popup-parent");
    divPopupLayoutParent.style.position = "fixed";
    divPopupLayoutParent.style.zIndex = "9999";
    divPopupLayoutParent.style.background = "rgba(10, 10, 20, 0.2)";
    divPopupLayoutParent.style.width = "100%";
    divPopupLayoutParent.style.height = "100%";
    divPopupLayoutParent.style.display = "flex";
    divPopupLayoutParent.style.flexDirection = "column";
    divPopupLayoutParent.style.alignItems = "center";
    divPopupLayoutParent.style.justifyContent = "center";

    document.body.appendChild(divPopupLayoutParent);

    const divPopupContainer = document.createElement("div");
    divPopupContainer.setAttribute("id", "meteor-connect-popup-container");
    divPopupContainer.style.height = "100%";
    divPopupContainer.style.maxHeight = "720px";
    divPopupContainer.style.width = "100%";
    divPopupContainer.style.maxWidth = "420px";

    divPopupLayoutParent.appendChild(divPopupContainer);

    root = divPopupContainer;
  }
}
