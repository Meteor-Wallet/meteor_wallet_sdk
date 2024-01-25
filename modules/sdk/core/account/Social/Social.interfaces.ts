import { IWithBasicAccount } from "../account.interfaces";

export interface IOSocialConstructor_Input {
  id: string;
}

export interface ISocialWatchableProps {}

export interface IWithBasicSocialProps {
  hasTosToAccept: IWithBasicAccount;
}

export interface ISocialProfile {
  [key: string]: string;
}
