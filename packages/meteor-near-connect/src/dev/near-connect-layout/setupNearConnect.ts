import { meteorPopupStyles } from "../../meteor-connect/meteorPopupStyles.ts";
import { css } from "./styles.ts";

export function setupNearConnectStyles() {
  const style = document.createElement("style");
  style.textContent = `${css(`.test`)} ${meteorPopupStyles}`;
  document.head.append(style);
}
