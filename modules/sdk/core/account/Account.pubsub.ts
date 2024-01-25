import { Signer } from "../keys_and_signers/signers/Signer";
import { IPubSub_BasicAccount } from "./BasicAccount.pubsub";

export enum EPubSub_Account {
  signers_changed = "signers_changed",
}

export interface IPubSub_Account extends IPubSub_BasicAccount {
  [EPubSub_Account.signers_changed]: Signer[];
}
