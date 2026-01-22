import type { ExecutableAction } from "../action/ExecutableAction.ts";
import type { TMCActionRegistry } from "../action/mc_action.combined.ts";
import { isMobile } from "./utils/isMobile.ts";
import { bodyDesktop, bodyMobile } from "./view.ts";

declare global {
  interface Window {
    // meteorWallet: any;
    openMeteorExtension: () => void;
    openMeteorWeb: () => void;
    openMobileDeepLink: () => void;
  }
}

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
  strategy?: TRenderStrategy;
  onExecutionComplete?: (
    output: A extends ExecutableAction<infer O> ? TMCActionRegistry[O["id"]]["output"] : never,
  ) => void;
}

export function renderActionUi<A extends ExecutableAction<any>>({
  action,
  onExecutionComplete,
  strategy = {
    strategy: "create_popup",
  },
}: IRenderActionUi_Input<A>) {
  let root: HTMLElement;

  if (strategy.strategy === "provide_container_element") {
    root = strategy.element;
  } else if (strategy.strategy === "create_popup") {
    const foundPopupContainer = document.getElementById("meteor-connect-popup-container");

    if (foundPopupContainer != null) {
      root = foundPopupContainer.parentElement as HTMLElement;
    } else {
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
  } else {
    throw new Error(
      `MeteorConnect: Action UI couldn't be rendered for [${action.id}]- provide a render strategy`,
    );
  }

  window.openMeteorWeb = async () => {
    action.execute("v1_web").then((result) => onExecutionComplete?.(result));
  };

  window.openMeteorExtension = async () => {
    action.execute("v1_ext").then((result) => onExecutionComplete?.(result));
  };

  if (isMobile()) {
    root.innerHTML = bodyMobile;
  } else {
    root.innerHTML = bodyDesktop;
  }
}
