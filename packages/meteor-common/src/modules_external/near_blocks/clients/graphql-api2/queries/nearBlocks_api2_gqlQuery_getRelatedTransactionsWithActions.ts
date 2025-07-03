import { gql } from "graphql-request";
import _ from "lodash";
import { ENearNetwork } from "../../../../near/types/near_basic_types";
import { INearBlocks_Api2_TransactionWithReceipts } from "../../../types_nearBlocks";
import { NearBlocks_GqlClient } from "../NearBlocks_GqlClient";

interface IONearBlocks_Api2_GqlQuery_GetRelatedTransactionsWithActions_Input {
  network: ENearNetwork;
  address: string;
  limit: number;
  offset: number;
}

interface IONearBlocks_Api2_GqlQuery_GetRelatedTransactionsWithActions_Output {
  transactions: INearBlocks_Api2_TransactionWithReceipts[];
}

const query = gql`
  query ($address: String, $limit: Int, $offset: Int) {
    transactions(
      limit: $limit
      offset: $offset
      where: {
        receipts: {
          _or: [
            { predecessor_account_id: { _eq: $address } }
            { receiver_account_id: { _eq: $address } }
          ]
        }
      }
      order_by: { block_timestamp: desc }
    ) {
      ...transactionsFull
      block {
        ...blocks
        __typename
      }
      __typename
      receipts {
        ...receiptsFull
        execution_outcome {
          ...executionOutcomes
          __typename
        }
        __typename
      }
    }
  }

  fragment blocks on blocks {
    block_height
    block_hash
    block_timestamp
    author_account_id
    __typename
  }

  fragment receiptsFull on receipts {
    receipt_id
    included_in_block_hash
    included_in_chunk_hash
    index_in_chunk
    included_in_block_timestamp
    predecessor_account_id
    receiver_account_id
    receipt_kind
    originated_from_transaction_hash
    __typename
    action_receipt_actions {
      action_kind
      args
      __typename
    }
  }

  fragment transactionsFull on transactions {
    transaction_hash
    included_in_block_hash
    included_in_chunk_hash
    index_in_chunk
    block_timestamp
    signer_account_id
    signer_public_key
    nonce
    receiver_account_id
    signature
    status
    converted_into_receipt_id
    receipt_conversion_gas_burnt
    receipt_conversion_tokens_burnt
    __typename
  }

  fragment executionOutcomes on execution_outcomes {
    gas_burnt
    tokens_burnt
    __typename
  }
`;

export const nearBlocks_api2_gqlQuery_getRelatedTransactionsWithActions = {
  query,
  executeQuery: (
    inputs: IONearBlocks_Api2_GqlQuery_GetRelatedTransactionsWithActions_Input,
  ): Promise<IONearBlocks_Api2_GqlQuery_GetRelatedTransactionsWithActions_Output> =>
    NearBlocks_GqlClient[inputs.network].request(query, _.omit(inputs, ["network"])),
};
