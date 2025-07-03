import { getNearLedgerClient } from "@meteorwallet/ledger-client/near/NearLedgerClient";
import { Store } from "pullstate";
import { INep0413_PayloadToSign } from "../../modules_external/near/types/standards/wallet_standard_types";
import { near_wallet_utils } from "../../modules_external/near/utils/near_wallet_utils";

interface ILedgerSignState {
  isModalOpen: boolean;
  payloadToBeSigned?: INep0413_PayloadToSign;
  hdPath?: string;
  accountId?: string;
}

export class LedgerSign {
  private stateStore: Store<ILedgerSignState>;
  private static instance: LedgerSign;
  private promiseResolver?: (value: Buffer) => void;
  private promiseRejecter?: (reason: Error) => void;
  private constructor() {
    this.stateStore = new Store<ILedgerSignState>({
      isModalOpen: false,
    });
  }

  public static getInstance() {
    if (!LedgerSign.instance) {
      LedgerSign.instance = new LedgerSign();
    }

    return LedgerSign.instance;
  }

  private async closeModal() {
    this.stateStore.update((s) => {
      s.isModalOpen = false;
    });
  }

  public useLedgerSignState() {
    return this.stateStore.useState((s) => s);
  }

  public async sign413Message(payload: INep0413_PayloadToSign, path: string, accountId: string) {
    return new Promise<Buffer>((resolve, reject) => {
      this.stateStore.update((s) => {
        s.payloadToBeSigned = payload;
        s.hdPath = path;
        s.accountId = accountId;
        s.isModalOpen = true;
      });
      this.promiseRejecter = reject;
      this.promiseResolver = resolve;
    });
  }

  private failWithReason(msg: string) {
    this.closeModal();
    if (this.promiseRejecter) {
      this.promiseRejecter(new Error(msg));
    }
  }

  /**
   * You should use `initiateSign413Message` instead. This is for internal usage only.
   */
  public async _internal_only_sign413Message() {
    if (!this.promiseResolver) {
      this.failWithReason("NEP413 sign is not initiated properly. Please try again.");
      return;
    }
    const rawState = this.stateStore.getRawState();
    const payloadToBeSigned = rawState.payloadToBeSigned;
    const hdPath = rawState.hdPath;

    if (!payloadToBeSigned) {
      this.failWithReason("Payload not found, please try again.");
      return;
    }
    if (!hdPath) {
      this.failWithReason("HD path not found, please try again.");
      return;
    }

    const signatureBuffer = await getNearLedgerClient().signMessageNep413Buffer(
      near_wallet_utils.nep0413_createLedgerSignMessagePayloadBuffer(payloadToBeSigned),
      hdPath,
    );
    this.promiseResolver(signatureBuffer);
    this.closeModal();
  }

  /**
   * You should use `initiateSign413Message` instead. This is for internal usage only.
   */
  public async _internal_only_cancelSign413Message() {
    this.failWithReason("User rejected the sign request.");
  }
}
