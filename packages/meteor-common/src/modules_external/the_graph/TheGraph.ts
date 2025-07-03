import { theGraph_gqlQuery_getInscriptionHolderInfos } from "./graphql/queries/inscription";

export const TheGraph = {
  getInscriptionHolderInfoApi: theGraph_gqlQuery_getInscriptionHolderInfos.executeQuery,
};
