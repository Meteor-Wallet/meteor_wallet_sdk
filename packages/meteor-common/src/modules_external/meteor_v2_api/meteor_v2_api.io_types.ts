import { ENearNetwork } from "../near/types/near_basic_types";

export type TIO_AccessInfo = {
  contractId: string;
  publicKey: string;
};

export interface IOBackendV2_CreateWallet_Input {
  network_id: ENearNetwork;
  wallet_id: string;
  public_key: string;
  captcha_token: string;
  rpcUrl?: string;
}
