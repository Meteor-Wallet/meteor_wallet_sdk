export type NearConnectNetwork = "mainnet" | "testnet";

export interface NearConnectAccount {
  accountId: string;
  publicKey?: string;
}

export interface NearConnectSignedMessage {
  accountId: string;
  publicKey: string;
  signature: string;
}

export interface NaerConnectAccountWithSignedMessage extends NearConnectAccount {
  signedMessage: NearConnectSignedMessage;
}