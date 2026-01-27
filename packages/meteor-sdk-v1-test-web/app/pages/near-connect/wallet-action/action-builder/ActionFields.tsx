import { AddKeyFields } from "./fields/AddKeyFields";
import { CreateAccountFields } from "./fields/CreateAccountFields";
import { DeleteAccountFields } from "./fields/DeleteAccountFields";
import { DeleteKeyFields } from "./fields/DeleteKeyFields";
import { DeployContractFields } from "./fields/DeployContractFields";
import { DeployGlobalContractFields } from "./fields/DeployGlobalContractFields";
import { FunctionCallFields } from "./fields/FunctionCallFields";
import { StakeFields } from "./fields/StakeFields";
import { TransferFields } from "./fields/TransferFields";
import { UseGlobalContractFields } from "./fields/UseGlobalContractFields";
import type { ActionForm } from "./types";

export function ActionFields(props: { value: ActionForm; onChange: (next: ActionForm) => void }) {
  const { value, onChange } = props;
  switch (value.type) {
    case "CreateAccount":
      return <CreateAccountFields value={value} onChange={onChange} />;
    case "DeployContract":
      return <DeployContractFields value={value} onChange={onChange} />;
    case "FunctionCall":
      return <FunctionCallFields value={value} onChange={onChange} />;
    case "Transfer":
      return <TransferFields value={value} onChange={onChange} />;
    case "Stake":
      return <StakeFields value={value} onChange={onChange} />;
    case "AddKey":
      return <AddKeyFields value={value} onChange={onChange} />;
    case "DeleteKey":
      return <DeleteKeyFields value={value} onChange={onChange} />;
    case "DeleteAccount":
      return <DeleteAccountFields value={value} onChange={onChange} />;
    case "UseGlobalContract":
      return <UseGlobalContractFields value={value} onChange={onChange} />;
    case "DeployGlobalContract":
      return <DeployGlobalContractFields value={value} onChange={onChange} />;
  }
}
