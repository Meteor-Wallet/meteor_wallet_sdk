import type {
  TAllAccountsTransferDataEncrypted,
  TNewKeyTransferStartInputV1,
  TNewKeyTransferStartOutputV1,
  TNewKeyTransferVerifyActiveInputV1,
  TNewKeyTransferVerifyActiveOutputV1,
} from "@meteorwallet/connect-shared";
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
  "meteor_wallet_core::new_key_account_transfer_start": {
    input: {} as TNewKeyTransferStartInputV1,
    expandedInput: {} as TNewKeyTransferStartInputV1,
    output: {} as TNewKeyTransferStartOutputV1,
    meta: {
      executionTargetSource: "on_execution",
    },
  },
  "meteor_wallet_core::new_key_account_transfer_verify_active": {
    input: {} as TNewKeyTransferVerifyActiveInputV1,
    expandedInput: {} as TNewKeyTransferVerifyActiveInputV1,
    output: {} as TNewKeyTransferVerifyActiveOutputV1,
    meta: {
      executionTargetSource: "on_execution",
    },
  },
} as const satisfies Record<TMCActionId<"meteor_wallet_core">, IMCActionSchema>;
