import {
  INearAction_AddKey,
  INearAction_DeleteAccount,
  INearAction_DeleteKey,
  INearAction_DeployContract,
  INearAction_FunctionCall,
  INearAction_Stake,
  INearAction_Transfer,
  TNearAction,
  TNearAction_CreateAccount,
} from "../types/near_blockchain_data_types";

function isFunctionCallAction(action: TNearAction): action is INearAction_FunctionCall {
  return action["FunctionCall"] != null;
}

function isCreateAccountAction(action: TNearAction): action is TNearAction_CreateAccount {
  return action === "CreateAccount";
}

function isDeleteAccountAction(action: TNearAction): action is INearAction_DeleteAccount {
  return action["DeleteAccount"] != null;
}

function isAddKeyAction(action: TNearAction): action is INearAction_AddKey {
  return action["AddKey"] != null;
}

function isDeleteKeyAction(action: TNearAction): action is INearAction_DeleteKey {
  return action["DeleteKey"] != null;
}

function isStakeAction(action: TNearAction): action is INearAction_Stake {
  return action["Stake"] != null;
}

function isTransferAction(action: TNearAction): action is INearAction_Transfer {
  return action["Transfer"] != null;
}

function isDeployContractAction(action: TNearAction): action is INearAction_DeployContract {
  return action["DeployContract"] != null;
}

export const near_type_matching_util = {
  actions: {
    isDeployContractAction,
    isCreateAccountAction,
    isDeleteAccountAction,
    isAddKeyAction,
    isDeleteKeyAction,
    isTransferAction,
    isStakeAction,
    isFunctionCallAction,
  },
};
