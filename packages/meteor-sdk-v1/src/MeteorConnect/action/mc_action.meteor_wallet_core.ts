import type { TAllAccountsTransferDataEncrypted } from "@meteorwallet/connect-shared";
import type { IMCActionSchema, TMCActionId } from "./mc_action.types.ts";

// ------------------------------------
//
// METEOR WALLET CORE ACTION DEFINITIONS
//
// ------------------------------------

export interface IMCAOutput_MeteorWalletCore_TransferAccounts {
  success: boolean;
}

export const MCMeteorWalletCoreActions = {
  "meteor_wallet_core::transfer_accounts": {
    // The registry only ever carries the ENCRYPTED payload — plaintext account secrets live in
    // the sensitive transfer attachment on the ExecutableAction, never in request/expandedInput.
    input: {} as TAllAccountsTransferDataEncrypted,
    expandedInput: {} as TAllAccountsTransferDataEncrypted,
    output: {} as IMCAOutput_MeteorWalletCore_TransferAccounts,
    meta: {
      executionTargetSource: "on_execution",
    },
  },
} as const satisfies Record<TMCActionId<"meteor_wallet_core">, IMCActionSchema>;
