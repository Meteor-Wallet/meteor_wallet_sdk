import type { TMeteorConnectionExecutionTarget } from "../../../MeteorConnect.types";
import { svg_icons_text } from "../graphical/svg_icons/svg_icons_text";

export function getIconSvgTextForTargetedPlatform(
  targetedPlatform: TMeteorConnectionExecutionTarget | "unset",
): string {
  switch (targetedPlatform) {
    case "v1_web": {
      return svg_icons_text.icon_web_globe;
    }
    case "v1_web_localhost": {
      return svg_icons_text.icon_web_globe;
    }
    case "v1_ext": {
      return svg_icons_text.icon_chrome;
    }
    default: {
      return `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"></svg>`;
    }
  }
}
