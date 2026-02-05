export enum EExternalActionType {
  login = "login",
  sign = "sign",
  logout = "logout",
  verify_owner = "verify_owner",
  keypom_claim = "keypom_claim",
  sign_message = "sign_message",
  sign_delegate_actions = "sign_delegate_actions",
}

export enum EMeteorWalletSignInType {
  ALL_METHODS = "ALL_METHODS",
  SELECTED_METHODS = "SELECTED_METHODS",
  FULL_ACCESS = "FULL_ACCESS",
}

export enum EWalletExternalAction_SignIn_AccessType {
  FULL_ACCESS = "fullAccess",
  LIMITED_ACCESS = "limitedAccess",
}

export enum EWalletExternalActionStatus {
  UNCONFIRMED = "UNCONFIRMED",
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILURE = "FAILURE",
}

export enum EMeteorInjectedFeature {
  open_page = "open_page",
  batch_import = "batch_import",
  sync_check = "sync_check",
  account_sync = "account_sync",
}

export enum EDappActionSource {
  website_callback = "wcb",
  website_post_message = "wpm",
  website_visit = "wv",
  extension_injected = "ext",
}

export enum EDappActionConnectionStatus {
  initializing = "initializing",
  connected = "connected",
  attempting_reconnect = "attempting_reconnect",
  disconnected = "disconnected",
  closed_success = "closed_success",
  closed_fail = "closed_fail",
  closed_window = "closed_window",
}
