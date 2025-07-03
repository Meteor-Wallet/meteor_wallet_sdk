import { Store } from "pullstate";
import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";
import { ISignTelegramData, ITelegramData } from "../../modules_external/telegram/telegram.types";
import { telegram_async_functions } from "../telegram/telegram_async_function";

interface ITelegramLinkerState {
  isLinking: boolean;
  success: boolean;
  message: string;
  isModalOpen: boolean;
  linkingWallet: string;
}

export class HarvestMoonTelegramLinker {
  private stateStore: Store<ITelegramLinkerState>;
  private static instance: HarvestMoonTelegramLinker;
  private constructor() {
    this.stateStore = new Store<ITelegramLinkerState>({
      isLinking: false,
      success: false,
      message: "",
      isModalOpen: false,
      linkingWallet: "",
    });
  }

  public static getInstance() {
    if (!HarvestMoonTelegramLinker.instance) {
      HarvestMoonTelegramLinker.instance = new HarvestMoonTelegramLinker();
    }

    return HarvestMoonTelegramLinker.instance;
  }

  public useTelegramLinkerState() {
    return this.stateStore.useState((s) => s);
  }

  public async closeModal() {
    this.stateStore.update((s) => {
      s.isModalOpen = false;
    });
  }

  public async linkTelegramWallet({
    network,
    accountId,
    telegramData,
    autoClose = true,
    referrerDetails,
  }: {
    network: ENearNetwork;
    accountId: string;
    telegramData: ITelegramData;
    autoClose?: boolean;
    referrerDetails?: string;
  }): Promise<{
    success: boolean;
    isReferralCreated: boolean;
  }> {
    let success = false;
    let isReferralCreated = false;
    if (this.stateStore.getRawState().isLinking) {
      throw new Error("Another linking is in process.");
    }
    try {
      this.stateStore.update((s) => {
        s.isLinking = true;
        s.success = true;
        s.message = "";
        // s.isModalOpen = true;
        s.isModalOpen = false;
      });
      const linkResult = await telegram_async_functions.telegramLinkAccount({
        accountId,
        network,
        telegramData,
        referrerDetails,
      });

      isReferralCreated = linkResult.isReferralCreated;

      success = true;
      this.stateStore.update((s) => {
        s.success = true;
        if (autoClose) {
          s.isModalOpen = false;
        }
      });
    } catch (err) {
      if (err instanceof Error) {
        const msg = err.message;
        this.stateStore.update((s) => {
          s.success = false;
          s.message = msg;
        });
        // let the user to decide if he wants to close the modal
      }
    } finally {
      this.stateStore.update((s) => {
        s.isLinking = false;
      });
    }
    return { success, isReferralCreated };
  }

  public async linkTelegramMultipleWallet({
    wallets,
    telegramData,
    autoClose,
  }: {
    wallets: { network: ENearNetwork; accountId: string }[];
    telegramData: ISignTelegramData;
    autoClose?: boolean;
  }) {
    let success = false;
    if (this.stateStore.getRawState().isLinking) {
      throw new Error("Another linking is in process.");
    }
    try {
      this.stateStore.update((s) => {
        s.isLinking = true;
        s.success = true;
        s.message = "";
        s.isModalOpen = true;
        s.linkingWallet = "";
      });
      for (const wallet of wallets) {
        this.stateStore.update((s) => {
          s.linkingWallet = wallet.accountId;
        });
        await telegram_async_functions.telegramLinkAccount({
          accountId: wallet.accountId,
          network: wallet.network,
          telegramData,
        });
      }
      success = true;
      this.stateStore.update((s) => {
        s.success = true;
        if (autoClose) {
          s.isModalOpen = false;
        }
      });
    } catch (err) {
      if (err instanceof Error) {
        const msg = err.message;
        this.stateStore.update((s) => {
          s.success = false;
          s.message = msg;
        });
        // let the user to decide if he wants to close the modal
      }
    } finally {
      this.stateStore.update((s) => {
        s.isLinking = false;
      });
    }
    return { success };
  }

  public async testLinkerModal(error: boolean = false) {
    this.stateStore.update((s) => {
      s.isLinking = true;
      s.success = true;
      s.message = "";
      s.isModalOpen = true;
    });
    setTimeout(() => {
      this.stateStore.update((s) => {
        s.isLinking = false;
        if (error) {
          s.message = "Something went wrong";
          s.success = false;
        } else {
          s.success = true;
          s.isModalOpen = false;
        }
      });
    }, 4000);
  }
}
