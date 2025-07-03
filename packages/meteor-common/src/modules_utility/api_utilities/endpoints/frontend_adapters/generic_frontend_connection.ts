import { SerializationUtils } from "../../../javascript_helpers/SerializationUtils";
import { IOApiRunnerClient_runAction_Frontend_Input } from "../ApiRunnerClient";

export const generic_frontend_connection = async (
  inputs: IOApiRunnerClient_runAction_Frontend_Input,
) => {
  // console.log(`API Frontend Connect: Need to handle inputs for action [${inputs.id}]`, inputs.args);

  if (inputs.actionInputs?._files != null) {
    console.log(`API Frontend Connect: Adding files to request`);
    const formData = new FormData();

    for (const fileKey of Object.keys(inputs.actionInputs._files)) {
      for (const file of inputs.actionInputs._files[fileKey]) {
        formData.append(fileKey, file);
      }
    }

    formData.append(
      "formActionInput",
      JSON.stringify({
        inputs: inputs.actionInputs,
        pluginState: inputs.pluginState,
      }),
    );

    return fetch(`${inputs.baseUrl}/${inputs.action.actionId}`, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
      credentials: "include",
    }).then(async (resp) =>
      JSON.parse(await resp.text(), SerializationUtils.JsonRevivers.reviveDateObjects),
    );
  } else {
    return fetch(`${inputs.baseUrl}/${inputs.action.actionId}`, {
      method: "POST",
      body: JSON.stringify({
        inputs: inputs.actionInputs,
        pluginState: inputs.pluginState,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }).then(async (resp) =>
      JSON.parse(await resp.text(), SerializationUtils.JsonRevivers.reviveDateObjects),
    );
    /* return fetch(`${actionBaseUrl}/${inputs.id}`, {
       method: "post",
       json:,
       throwHttpErrors: false,
       parseJson: (text) => JSON.parse(text, SerializationUtils.JsonRevivers.reviveDateObjects),
       timeout,
       credentials: "include"
     }).json();*/
  }
};
