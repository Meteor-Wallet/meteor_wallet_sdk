import { DROP_TYPE } from "../../../modules_feature/linkdrop/keypom_types";
import { IKeypom_Drop } from "../types/services/keypom_service_types";

export const near_keypom_util = {
  getDropType,
  getNftContractId,
};

function getDropType(drop: IKeypom_Drop): DROP_TYPE {
  if (drop.fc === undefined && drop.nft === undefined) {
    return DROP_TYPE.TOKEN;
  }

  if (drop.fc !== undefined) {
    if (drop.fc.methods[0]?.length === 2) {
      return DROP_TYPE.TRIAL;
    }

    if (drop.fc.methods.length === 3) {
      return DROP_TYPE.TICKET;
    }

    if (
      drop.fc.methods.length === 1 &&
      drop.fc.methods[0] !== undefined &&
      drop.fc.methods[0][0].method_name === "nft_mint"
    ) {
      return DROP_TYPE.NFT;
    }

    return DROP_TYPE.SIMPLE;
  }

  return DROP_TYPE.SIMPLE;
}

function getNftContractId(drop: IKeypom_Drop): string {
  const fcMethods = drop.fc?.methods;
  if (
    fcMethods === undefined ||
    fcMethods.length === 0 ||
    fcMethods[0] === undefined ||
    fcMethods[0][0] === undefined
  ) {
    throw new Error("Unable to retrieve function calls.");
  }

  const fcMethod = fcMethods[0][0];
  return fcMethod.receiver_id;
}
