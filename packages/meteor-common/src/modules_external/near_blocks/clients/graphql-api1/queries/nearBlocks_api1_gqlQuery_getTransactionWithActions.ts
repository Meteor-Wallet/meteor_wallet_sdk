import { gql } from "graphql-request";
import _ from "lodash";
import { ENearNetwork } from "../../../../near/types/near_basic_types";
import { INearBlocks_Api1_TransactionWithActions } from "../../../types_nearBlocks";
import { NearBlocks_Api1_GqlClient } from "../NearBlocks_Api1_GqlClient";

interface IONearBlocks_GqlQuery_GetTransactionWithActions_Input {
  network: ENearNetwork;
  hash: string;
}

interface IONearBlocks_GqlQuery_GetTransactionWithActions_Output {
  transactions: INearBlocks_Api1_TransactionWithActions[];
}

const query = gql`
  query ($hash: String) {
    transactions(where: { transaction_hash: { _eq: $hash } }) {
      ...transactionsFull
      transaction_actions {
        ...transactionActionsFull
        __typename
      }
      block {
        ...blocks
        __typename
      }
      receipts(order_by: { included_in_block_timestamp: asc }) {
        ...receiptsFull
        execution_outcome {
          ...executionOutcomes
          __typename
        }
        assets__fungible_token_events {
          event_kind
          emitted_by_contract_account_id
          token_new_owner_account_id
          token_old_owner_account_id
          amount
          emitted_for_receipt_id
          token {
            metainfo {
              name
              symbol
              price
              decimals
              extra
              __typename
            }
            __typename
          }
          __typename
        }
        action_receipt_actions {
          ...actionReceiptActionsFull
          ft {
            ...ftMetaFull
            __typename
          }
          __typename
        }
        __typename
      }
      __typename
    }
  }

  fragment blocks on blocks {
    block_height
    block_hash
    block_timestamp
    author_account_id
    __typename
  }

  fragment ftMetaFull on legacy_ft_meta {
    contract
    name
    decimals
    symbol
    args
    price
    price_btc
    price_eth
    change_24
    market_cap
    fully_diluted_market_cap
    circulating_supply
    volume_24h
    description
    twitter
    facebook
    telegram
    reddit
    website
    total_supply
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

  fragment transactionActionsFull on transaction_actions {
    transaction_hash
    index_in_transaction
    action_kind
    args
    __typename
  }

  fragment actionReceiptActionsFull on action_receipt_actions {
    receipt_id
    index_in_action_receipt
    action_kind
    args
    receipt_predecessor_account_id
    receipt_receiver_account_id
    receipt_included_in_block_timestamp
    __typename
  }
`;

export const nearBlocks_api1_gqlQuery_getTransactionWithActions = {
  query,
  executeQuery: (
    inputs: IONearBlocks_GqlQuery_GetTransactionWithActions_Input,
  ): Promise<IONearBlocks_GqlQuery_GetTransactionWithActions_Output> =>
    NearBlocks_Api1_GqlClient[inputs.network].request(query, _.omit(inputs, ["network"])),
};
