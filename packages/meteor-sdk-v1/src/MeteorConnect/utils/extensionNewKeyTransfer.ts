import { EMeteorInjectedFeature } from "../../ported_common/dapp/dapp.enums";
import {
  EMeteorExtensionDirectActionType,
  type IMeteorComInjectedObject,
  type IMeteorExtensionDirectAction_OpenPage_Output,
  type TMeteorExtensionDirectAction_OpenMeteorConnect_Input,
} from "../../ported_common/dapp/dapp.types";

const injected = (): IMeteorComInjectedObject | undefined =>
  typeof window === "undefined" ? undefined : (window as any).meteorCom;

export const isExtensionNewKeyTransferAvailable = (): boolean =>
  typeof injected()?.directAction === "function" &&
  injected()?.features?.includes(EMeteorInjectedFeature.new_key_transfer) === true;

export async function openExtensionNewKeyTransfer(link: string): Promise<void> {
  if (!isExtensionNewKeyTransferAvailable()) throw new Error("extension_update_required");
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const response = await Promise.race([
      injected()!.directAction<
        TMeteorExtensionDirectAction_OpenMeteorConnect_Input,
        IMeteorExtensionDirectAction_OpenPage_Output
      >({ actionType: EMeteorExtensionDirectActionType.open_meteor_connect, inputs: { link } }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("extension_popup_timeout")), 10_000);
      }),
    ]);
    if (response?.opened !== true) throw new Error("extension_popup_failed");
  } finally {
    clearTimeout(timer);
  }
}
