import {
  ELedgerConnectedStatus,
  ELedgerConnectionStatus,
  ELedgerDisconnectedStatus,
} from "@meteorwallet/ledger-client/near/near_ledger.enums";

export const ledger_disconnected_status_for_alert = {
  [ELedgerDisconnectedStatus.user_cancelled]: "error",
  [ELedgerDisconnectedStatus.awaiting_connection]: "error",
  [ELedgerDisconnectedStatus.browser_refresh_needed]: "error",
  [ELedgerDisconnectedStatus.error]: "error",
};

export const ledger_connected_status_for_alert = {
  [ELedgerConnectedStatus.not_unlocked]: "warning",
  [ELedgerConnectedStatus.app_not_opened]: "warning",
  [ELedgerConnectedStatus.error]: "warning",
};

export const ledger_alert_status_for_ledger_status = {
  [ELedgerConnectionStatus.connected]: {
    ...ledger_connected_status_for_alert,
  },
  [ELedgerConnectionStatus.disconnected]: {
    ...ledger_disconnected_status_for_alert,
  },
};
