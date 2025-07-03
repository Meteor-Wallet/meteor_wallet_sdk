import { gql } from "graphql-request";
import { TheGraph_GqlClient } from "../../TheGraph_GqlClient";

interface IOTheGraph_GqlQuery_GetInscriptionHolderInfos_Input {
  accountId: string;
}

interface IOTheGraph_GqlQuery_GetInscriptionHolderInfos_Output {
  holderInfos: {
    accountId: string;
    amount: string;
  }[];
}

const query = gql`
  query ($accountId: String) {
    holderInfos(where: { accountId: $accountId, ticker: "neat" }) {
      accountId
      amount
    }
  }
`;

export const theGraph_gqlQuery_getInscriptionHolderInfos = {
  query,
  executeQuery: (
    inputs: IOTheGraph_GqlQuery_GetInscriptionHolderInfos_Input,
  ): Promise<IOTheGraph_GqlQuery_GetInscriptionHolderInfos_Output> =>
    TheGraph_GqlClient.request(query, inputs),
};
