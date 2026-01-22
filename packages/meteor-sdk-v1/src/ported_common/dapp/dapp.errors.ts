export enum EDappActionErrorTag {
  NEW_ACTION_STARTED = "NEW_ACTION_STARTED",
  INCOMPLETE_ACTION = "INCOMPLETE_ACTION",
  NO_ACCOUNTS = "NO_ACCOUNTS",
  WINDOW_CLOSED = "WINDOW_CLOSED",
  USER_CANCELLED = "USER_CANCELLED",
  POPUP_WINDOW_REFUSED = "POPUP_WINDOW_REFUSED",
  POPUP_WINDOW_OPEN_FAILED = "POPUP_WINDOW_OPEN_FAILED",
  EXT_DIRECT_RESPONSE_FAILED = "EXT_DIRECT_RESPONSE_FAILED",
}

const en: { [key in EDappActionErrorTag]: string } = {
  [EDappActionErrorTag.WINDOW_CLOSED]: "User closed the window",
  [EDappActionErrorTag.INCOMPLETE_ACTION]: "User didn't complete the action",
  [EDappActionErrorTag.NEW_ACTION_STARTED]:
    "A new action was started by the user, old action failed",
  [EDappActionErrorTag.POPUP_WINDOW_OPEN_FAILED]: "Popup window failed to open",
  [EDappActionErrorTag.POPUP_WINDOW_REFUSED]: "User refused to allow the popup window to open",
  [EDappActionErrorTag.USER_CANCELLED]: "User cancelled the action",
  [EDappActionErrorTag.NO_ACCOUNTS]: "No Meteor account found- try again after creating one",
  [EDappActionErrorTag.EXT_DIRECT_RESPONSE_FAILED]:
    "Couldn't send and get a direct response from Meteor V1 Extension",
};

export function getExternalActionErrorMessageForEndTag(tag: string | EDappActionErrorTag): string {
  return en[tag as EDappActionErrorTag] ?? "An unknown error occurred";
}
