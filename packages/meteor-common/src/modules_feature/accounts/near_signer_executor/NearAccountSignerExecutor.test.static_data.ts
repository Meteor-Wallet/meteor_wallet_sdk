import { FinalExecutionOutcome } from "@near-js/types";

export const goodFinalExecutionOutcome: FinalExecutionOutcome = {
  final_execution_status: "FINAL",
  status: {
    SuccessValue: "",
  },
  transaction: {
    actions: [
      {
        FunctionCall: {
          args: "eyJ0ZXh0IjoieW9vbyJ9",
          deposit: "50000000000000000000000",
          gas: 30000000000000,
          method_name: "addMessage",
        },
      },
    ],
    hash: "VNqvgsJ38muDuYo2vy6RMv8t5XQoRjXRsH8DyxAgWw1",
    nonce: 102035349000225,
    public_key: "ed25519:DS1rnnRDWFvqtECiSvgzqcv49GBoQfXaeUyoD37HFEAg",
    receiver_id: "guest-book.testnet",
    signature:
      "ed25519:2uB1C7fjg4rT9hod6yA5oK6dcA7YTKGavvpqQcyeQ8sMQkm36qav6M3se1xCdJgrHD5H9JDzPpk1Uvip8gDpyf6Y",
    signer_id: "pebbledev.testnet",
  },
  receipts_outcome: [
    {
      id: "48pqXs9dJoYMuCRazkTRaUk1MMJWwUcMfzBmuDPZ6YLN",
      outcome: {
        executor_id: "guest-book.testnet",
        gas_burnt: 3316340016967,
        logs: [],
        receipt_ids: ["EodagEXp3fAo48fGapBkRwBmXWJnagMAq6286qh1TaL8"],
        status: {
          SuccessValue: "",
        },
        tokens_burnt: "331634001696700000000",
      },
    },
  ],
  transaction_outcome: {
    id: "VNqvgsJ38muDuYo2vy6RMv8t5XQoRjXRsH8DyxAgWw1",
    outcome: {
      executor_id: "pebbledev.testnet",
      gas_burnt: 2427976898350,
      logs: [],
      receipt_ids: ["48pqXs9dJoYMuCRazkTRaUk1MMJWwUcMfzBmuDPZ6YLN"],
      status: {
        SuccessReceiptId: "48pqXs9dJoYMuCRazkTRaUk1MMJWwUcMfzBmuDPZ6YLN",
      },
      tokens_burnt: "242797689835000000000",
    },
  },
};

export const badFinalExecutionOutcome: FinalExecutionOutcome = {
  final_execution_status: "FINAL",
  status: {
    Failure: {
      error_message: "MethodNotFound",
      error_type: "FunctionCallError",
    },
  },
  transaction: {
    actions: [
      {
        FunctionCall: {
          args: "eyJyZWNlaXZlcl9pZCI6ImNvbXBvdW5kIiwiYW1vdW50IjoiMTAwMDAwMDAwMDAwMDAwMDAwMDAwMCIsIm1zZyI6ImludmVzdCJ9",
          deposit: "1",
          gas: 30000000000000,
          method_name: "something",
        },
      },
    ],
    hash: "5oEj7SW7PZAJQNvVMDuj6Qx7smXmS4e5mTXHhNhnB637",
    nonce: 102035349000227,
    public_key: "ed25519:DS1rnnRDWFvqtECiSvgzqcv49GBoQfXaeUyoD37HFEAg",
    receiver_id: "ft1.enleapstack.testnet",
    signature:
      "ed25519:iRrp2HZB85tZK9giHJazjk1c3RJ7t1rUJgHHpkCXcq47scknHDDNoQzY8HRDA8VWz5khBj9kVt5zuRmSGS7ZcXG",
    signer_id: "pebbledev.testnet",
  },
  transaction_outcome: {
    id: "5oEj7SW7PZAJQNvVMDuj6Qx7smXmS4e5mTXHhNhnB637",
    outcome: {
      executor_id: "pebbledev.testnet",
      gas_burnt: 2428108818456,
      logs: [],
      receipt_ids: ["Dws2wUqU4JntRLdXQwxtcaZJ63NpYft1wehGQZ6thMmi"],
      status: {
        SuccessReceiptId: "Dws2wUqU4JntRLdXQwxtcaZJ63NpYft1wehGQZ6thMmi",
      },
      tokens_burnt: "242810881845600000000",
    },
  },
  receipts_outcome: [
    {
      id: "Dws2wUqU4JntRLdXQwxtcaZJ63NpYft1wehGQZ6thMmi",
      outcome: {
        executor_id: "ft1.enleapstack.testnet",
        gas_burnt: 2428108818456,
        logs: [],
        receipt_ids: [
          "HmvVwd4ELfjDX977nPr11Xz73G1HneJLMoyWatk19Eyz",
          "FsQFrss78Wj8Gxbevc4eeS29JVbd8pPFZVtpiYytVnX4",
        ],
        status: {
          Failure: {
            error_message: "MethodNotFound",
            error_type: "FunctionCallError",
          },
        },
        tokens_burnt: "242810881845600000000",
      },
    },
  ],
};
