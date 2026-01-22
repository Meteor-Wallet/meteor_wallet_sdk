/*
import type { ExecutableAction } from "../action/ExecutableAction.ts";
import {
  METEOR_ACTION_UI_POPUP_CONTAINER_CLASS,
  METEOR_ACTION_UI_POPUP_CONTAINER_ID,
  METEOR_ACTION_UI_POPUP_PARENT_CLASS,
  METEOR_ACTION_UI_POPUP_PARENT_ID,
} from "./action_ui.static.ts";
import type { IRenderActionUi_Input } from "./MeteorConnectActionUi.ts";
import { isMobile } from "./utils/isMobile.ts";
import { bodyDesktop, bodyMobile, head } from "./view.ts";

export function renderActionUi<A extends ExecutableAction<any>>({
  action,
  strategy = {
    strategy: "create_popup",
  },
}: IRenderActionUi_Input<A>) {
  let root: HTMLElement;

  document.head.innerHTML = head;

  if (strategy.strategy === "target_element") {
    root = strategy.element;
  } else if (strategy.strategy === "create_popup") {
    const foundPopupContainer = document.getElementById(METEOR_ACTION_UI_POPUP_CONTAINER_ID);

    if (foundPopupContainer != null) {
      root = foundPopupContainer.parentElement as HTMLElement;
    } else {
      const divPopupLayoutParent = document.createElement("div");
      divPopupLayoutParent.setAttribute("id", METEOR_ACTION_UI_POPUP_PARENT_ID);
      divPopupLayoutParent.setAttribute("class", METEOR_ACTION_UI_POPUP_PARENT_CLASS);
      // divPopupLayoutParent.style.position = "fixed";
      // divPopupLayoutParent.style.zIndex = "9999";
      // divPopupLayoutParent.style.background = "rgba(10, 10, 20, 0.2)";
      // divPopupLayoutParent.style.width = "100%";
      // divPopupLayoutParent.style.height = "100%";
      // divPopupLayoutParent.style.display = "flex";
      // divPopupLayoutParent.style.flexDirection = "column";
      // divPopupLayoutParent.style.alignItems = "center";
      // divPopupLayoutParent.style.justifyContent = "center";

      document.body.appendChild(divPopupLayoutParent);

      const divPopupContainer = document.createElement("div");
      divPopupContainer.setAttribute("id", METEOR_ACTION_UI_POPUP_CONTAINER_ID);
      divPopupContainer.setAttribute("class", METEOR_ACTION_UI_POPUP_CONTAINER_CLASS);
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
*/
