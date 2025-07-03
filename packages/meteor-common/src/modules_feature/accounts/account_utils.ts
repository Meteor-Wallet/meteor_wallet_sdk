import { KeyPair, KeyPairString } from "@near-js/crypto";
import { canonicalize } from "json-canonicalize";
import { nearApiForNetwork } from "../../modules_external/near/clients/near_api_js/NearApiJsClient";
import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";
import { near_wallet_utils } from "../../modules_external/near/utils/near_wallet_utils";
import {
  EAccountErrorType,
  EAccountIdentifierType,
  EAccountKeyType,
  IAccountSignedRequestInputs,
  IAccount_Old,
  ISignedInSessionAccount_Old,
  TAccountChain,
} from "./account_types";

const ACCOUNT_ID_REGEX = /^(([a-z\d]+[\-_])*[a-z\d]+\.)*([a-z\d]+[\-_])*[a-z\d]+$/;

const ACCOUNT_ID_SINGLE_DOT_REGEX = /^(([a-z\d]+[\-_])*[a-z\d]+\.)?([a-z\d]+[\-_])*[a-z\d]+$/;

export type TAccountIdAnalysis =
  | {
      good: false;
      type?: undefined;
      namedPart?: undefined;
      knownNetwork?: ENearNetwork;
      errorType: EAccountErrorType;
      chain?: TAccountChain;
    }
  | {
      good: true;
      type: EAccountIdentifierType;
      namedPart?: string;
      knownNetwork?: ENearNetwork;
      errorType?: EAccountErrorType;
      chain: TAccountChain;
    };

export function checkAccountIdNear(
  testAccountId: string,
  options?: { isCreateWallet?: boolean },
): TAccountIdAnalysis {
  const isCreateWallet = options?.isCreateWallet ?? false;
  let checkFurther: string | undefined;
  let knownNetwork: ENearNetwork | undefined;
  let type: EAccountIdentifierType = EAccountIdentifierType.NAMED;

  if (testAccountId.endsWith(".near")) {
    checkFurther = testAccountId.slice(0, -5);
    knownNetwork = ENearNetwork.mainnet;
  } else if (testAccountId.endsWith(".testnet")) {
    knownNetwork = ENearNetwork.testnet;
    checkFurther = testAccountId.slice(0, -8);
  } else if (testAccountId.endsWith(".betanet")) {
    knownNetwork = ENearNetwork.betanet;
    checkFurther = testAccountId.slice(0, -8);
  } else if (testAccountId.endsWith(".localnet")) {
    knownNetwork = ENearNetwork.localnet;
    checkFurther = testAccountId.slice(0, -9);
  } else if (testAccountId.length === 64) {
    checkFurther = testAccountId;
    type = EAccountIdentifierType.IMPLICIT;
  } else {
    checkFurther = testAccountId.split(".").slice(-1)[0];
  }

  if (
    checkFurther == null ||
    (isCreateWallet && !ACCOUNT_ID_SINGLE_DOT_REGEX.test(testAccountId)) ||
    (!isCreateWallet && !ACCOUNT_ID_REGEX.test(testAccountId))
  ) {
    return { good: false, errorType: EAccountErrorType.invalid_account };
  }

  return {
    good: true,
    type,
    namedPart: type === EAccountIdentifierType.NAMED ? checkFurther : undefined,
    knownNetwork,
    chain: "NEAR",
  };
}

function isValidHexAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function checkAccountIdEVM(testAccountId: string): TAccountIdAnalysis {
  if (testAccountId.length !== 42) {
    return {
      good: false,
      errorType:
        testAccountId.length < 42
          ? EAccountErrorType.invalid_account_length_short
          : EAccountErrorType.invalid_account_length_long,
    };
  }

  if (!isValidHexAddress(testAccountId)) {
    return { good: false, errorType: EAccountErrorType.invalid_account_format };
  }

  return {
    good: true,
    type: EAccountIdentifierType.IMPLICIT,
    chain: "EVM",
  };
}

function verifyRequestInputs(signedRequestInputs: IAccountSignedRequestInputs<any>): boolean {
  const inputsString = canonicalize(signedRequestInputs.inputs);

  return near_wallet_utils.nep0413_verifySignedMessage({
    signedPayload: signedRequestInputs.signed,
    originalInputs: {
      nonce: Buffer.from(signedRequestInputs.nonce),
      recipient: signedRequestInputs.receiver,
      message: inputsString,
    },
  });
}

/**
 * @param sessionAccounts
 */
async function replaceKeystoresWithSessionAccounts(sessionAccounts: {
  [accountId: string]: ISignedInSessionAccount_Old;
}) {
  for (const network in nearApiForNetwork) {
    await nearApiForNetwork[network as ENearNetwork]?.keystore.clear();
  }

  for (const accountId in sessionAccounts) {
    const account = sessionAccounts[accountId];

    if (
      account.decrypted.type === EAccountKeyType.LOCAL_PRIVATE_KEY ||
      account.decrypted.type === undefined
    ) {
      const keyPair = KeyPair.fromString(account.decrypted.privateKey as KeyPairString);
      await nearApiForNetwork[account.network]?.keystore.setKey(
        account.network,
        account.id,
        keyPair,
      );
    }
  }
}

const getAccountKey = (account: IAccount_Old) => `${account.network}::${account.id}`;

export const account_utils = {
  checkAccountIdNear,
  verifyRequestInputs,
  replaceKeystoresWithSessionAccounts,
  getAccountKey,
};
