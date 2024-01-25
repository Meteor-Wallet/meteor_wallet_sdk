import { IUniqueAccountProps, IWithBasicAccount } from "../../account/account.interfaces";
import { Blockchain } from "../../blockchain/Blockchain.ts";

export interface IOTokenToTokenAmount_Input {
  value: string;
  isCryptoInteger: boolean;
}

export interface IOTokenConstructor_Input extends IUniqueAccountProps {
  isNative: boolean;
  isBridged: boolean;
  dollarPrice?: string;
  decimals: number;
  blockchain: Blockchain;
}

export interface ITokenWatchableProps {
  dollarPrice?: string;
}

export interface IWithToken {
  token: IWithBasicAccount;
}
