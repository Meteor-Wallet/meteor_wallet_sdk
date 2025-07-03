import { IAccount_Old } from "../../../modules_feature/accounts/account_types";
import {
  EMeteorExtensionDirectActionType,
  EMeteorInjectedFeature,
  IMeteorComInjectedObject,
  IMeteorExtensionDirectAction_CheckSyncStatus_Output,
  IMeteorExtensionDirectAction_OpenPage_Output,
  IMeteorExtensionDirectAction_SyncAccounts_Output,
  TMeteorExtensionDirectAction_CheckSyncStatus_Input,
  TMeteorExtensionDirectAction_OpenPage_Input,
  TMeteorExtensionDirectAction_SyncAccounts_Input,
} from "../../../modules_feature/dapp_connect/types_dappConnect";
import { IMeteorExtensionSetFeatures } from "../../state/app_store/AppStore_types";

declare global {
  interface Window {
    meteorCom?: IMeteorComInjectedObject;
  }
}

export enum EMeteorExtensionComEvent {
  extension_detected = "extension_detected",
}

class MeteorExtensionCom {
  private detectionInterval: any;
  private eventListeners: {
    [event in EMeteorExtensionComEvent]: Function[];
  } = {
    extension_detected: [],
  };
  detected: boolean = false;
  features: string[] = [];
  setFeatures: IMeteorExtensionSetFeatures = {
    batchImport: false,
    syncCheck: false,
    openPage: false,
    syncAccounts: false,
  };

  constructor() {
    if (window.meteorCom != null) {
      this.extensionDetected();
    } else {
      this.detectionInterval = setInterval(() => {
        if (window.meteorCom != null) {
          clearInterval(this.detectionInterval);
          this.extensionDetected();
        }
      }, 500);
    }
  }

  listen(event: EMeteorExtensionComEvent, func: () => void) {
    if (event === EMeteorExtensionComEvent.extension_detected && this.detected) {
      func();
    } else {
      this.eventListeners[event].push(func);
    }
  }

  async openPageInExtension(inputs: {
    path: string;
    queryParams: object;
    hash: string;
  }): Promise<IMeteorExtensionDirectAction_OpenPage_Output> {
    if (this.detected && this.setFeatures.openPage) {
      console.log("Should be opening extension page", inputs);
      return await window.meteorCom!.directAction<TMeteorExtensionDirectAction_OpenPage_Input>({
        actionType: EMeteorExtensionDirectActionType.open_page,
        inputs: {
          path: inputs.path,
          queryParams: inputs.queryParams,
          hash: inputs.hash,
        },
      });
    }

    return {
      opened: false,
    };
  }

  async checkSyncStatus(inputs: {
    hash: string;
    checkAccounts: Pick<IAccount_Old, "id" | "network" | "label">[];
  }): Promise<IMeteorExtensionDirectAction_CheckSyncStatus_Output> {
    if (this.detected && this.setFeatures.syncCheck) {
      const actionResponse = await window.meteorCom!.directAction<
        TMeteorExtensionDirectAction_CheckSyncStatus_Input,
        IMeteorExtensionDirectAction_CheckSyncStatus_Output
      >({
        actionType: EMeteorExtensionDirectActionType.check_sync_status,
        inputs: {
          hash: inputs.hash,
          checkAccounts: inputs.checkAccounts,
        },
      });

      console.log("Returning response for check password hashes (ext)", actionResponse);
      return actionResponse;
    }

    return {
      matched: false,
      accountSync: {
        extMissing: [],
        webMissing: [],
      },
    };
  }

  async syncAccounts(inputs: {
    passwordHash: string;
    accounts: IAccount_Old[];
  }): Promise<IMeteorExtensionDirectAction_SyncAccounts_Output> {
    if (this.detected && this.setFeatures.syncAccounts) {
      const actionResponse = await window.meteorCom!.directAction<
        TMeteorExtensionDirectAction_SyncAccounts_Input,
        IMeteorExtensionDirectAction_SyncAccounts_Output
      >({
        actionType: EMeteorExtensionDirectActionType.sync_accounts,
        inputs: {
          passwordHash: inputs.passwordHash,
          accounts: inputs.accounts,
        },
      });

      console.log("Returning response for check password hashes (ext)", actionResponse);
      return actionResponse;
    }

    return {
      success: false,
      accounts: [],
    };
  }

  private emit(event: EMeteorExtensionComEvent) {
    for (const listener of this.eventListeners[event]) {
      listener();
    }
  }

  private extensionDetected() {
    console.log("Meteor extension was detected");
    this.detected = true;
    this.features = window.meteorCom?.features ?? [];
    if (this.features.includes(EMeteorInjectedFeature.batch_import)) {
      this.setFeatures.batchImport = true;
    }

    if (this.features.includes(EMeteorInjectedFeature.sync_check)) {
      this.setFeatures.syncCheck = true;
    }

    if (this.features.includes(EMeteorInjectedFeature.open_page)) {
      this.setFeatures.openPage = true;
    }

    this.emit(EMeteorExtensionComEvent.extension_detected);
  }
}

let extensionSync: MeteorExtensionCom | undefined;

export function getMeteorExtensionCom(): MeteorExtensionCom {
  if (extensionSync == null) {
    extensionSync = new MeteorExtensionCom();
  }

  return extensionSync;
}
