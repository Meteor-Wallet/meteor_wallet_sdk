import { FinalExecutionOutcome } from "@near-js/types";
import { getKeypomService } from "../../modules_external/near/services/near_keypom_service";
import {
  IWithContractId,
  IWithNetwork,
} from "../../modules_external/near/types/near_input_helper_types";
import {
  IKeypom_Drop,
  IKeypom_KeyInfo,
  IKeypom_NFTMetadata,
} from "../../modules_external/near/types/services/keypom_service_types";

export const linkdrop_async_functions = {
  getDropInformation,
  getKeyInformation,
  createAccountAndClaim,
  getKeyBalance,
  claim,
  getDropNftMetadata,
};

export type TIOGetDropInformation_Input = IWithContractId & IWithNetwork;
async function getDropInformation({
  network,
  contractId,
  privKey,
}: { privKey: string } & TIOGetDropInformation_Input): Promise<IKeypom_Drop | undefined> {
  return await getKeypomService(network).getDropInformation({
    contractId,
    privKey,
  });
}

async function getKeyInformation({
  network,
  contractId,
  privKey,
}: {
  privKey: string;
} & TIOGetDropInformation_Input): Promise<IKeypom_KeyInfo | undefined> {
  return await getKeypomService(network).getKeyInformation({
    contractId,
    privKey,
  });
}

async function createAccountAndClaim({
  network,
  contractId,
  privKey,
  newAccountId,
  newPublicKey,
}: {
  privKey: string;
  newAccountId: string;
  newPublicKey: string;
} & TIOGetDropInformation_Input): Promise<FinalExecutionOutcome> {
  return await getKeypomService(network).createAccountAndClaim({
    contractId,
    privKey,
    newAccountId,
    newPublicKey,
  });
}

async function getKeyBalance({
  network,
  contractId,
  privKey,
}: {
  privKey: string;
} & TIOGetDropInformation_Input): Promise<string> {
  return await getKeypomService(network).getKeyBalance({
    contractId,
    privKey,
  });
}

async function claim({
  network,
  contractId,
  privKey,
  accountId,
}: {
  privKey: string;
  accountId: string;
} & TIOGetDropInformation_Input): Promise<FinalExecutionOutcome> {
  return await getKeypomService(network).claim({
    contractId,
    privKey,
    accountId,
  });
}

async function getDropNftMetadata({
  network,
  dropInformation,
}: {
  dropInformation: IKeypom_Drop | undefined | null;
} & IWithNetwork): Promise<IKeypom_NFTMetadata | undefined> {
  return await getKeypomService(network).getDropNftMetadata(dropInformation);
}
