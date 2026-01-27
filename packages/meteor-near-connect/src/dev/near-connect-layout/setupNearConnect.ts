import { meteorPopupStyles } from "../../meteor-near-connect/meteorPopupStyles";
import { css } from "./styles";

export function setupNearConnectStyles() {
  const style = document.createElement("style");
  style.textContent = `${css(`.test`)} ${meteorPopupStyles}`;
  document.head.append(style);
}
