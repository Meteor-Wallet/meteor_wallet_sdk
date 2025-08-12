import { AppStore } from "../../modules_app_core/state/app_store/AppStore";
import { ITranslations } from "../../modules_app_core/translation/translation_types";
import { StringUtils } from "../../modules_utility/data_type_utils/StringUtils";
import { getPresetRpcList } from "./rpc_utils";

function changeRpc({ nodeUrl, lang }: { nodeUrl: string; lang: ITranslations }) {
  const presetRpcList = getPresetRpcList();
  AppStore.update((s) => {
    const tmp = [...s.selectedRpc];

    const selectedIdx = tmp.findIndex((e) => e.network === s.selectedNetwork);

    const preset = presetRpcList.find((e) => e.nodeUrl === nodeUrl);

    if (preset) {
      if (selectedIdx === -1) {
        tmp.push({
          network: s.selectedNetwork,
          name: preset.name,
          nodeUrl: preset.nodeUrl,
        });
      } else {
        tmp[selectedIdx].nodeUrl = preset.nodeUrl;
      }

      s.selectedRpc = tmp;
      s.harvestMoonState.trigger_show_configure_rpc_modal = false;
      s.harvestMoonState.init_message = StringUtils.withTemplate(
        lang.configure_rpc.warning_success_update_rpc,
        {
          rpc:
            s.selectedNetwork === "mainnet"
              ? lang.configure_rpc.rpcNames.mainnet[preset.name]
              : lang.configure_rpc.rpcNames.testnet[preset.name],
        },
      );

      location.reload();
    }
  });
}

export const rpc_state_tasks = {
  changeRpc,
};
