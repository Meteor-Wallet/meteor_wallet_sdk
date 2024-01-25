import { IOTokenConstructor_Input } from "../../../core/assets/token/Token.interfaces.ts";
import { NearBlockchain } from "../NearBlockchain.ts";
import { ENearFtSpec } from "./near.token.enums.ts";

export interface INearTokenMetadata {
  spec: ENearFtSpec;
  name: string;
  symbol: string;
  icon: string | null;
  reference: string | null;
  reference_hash: string | null;
  decimals: number;
}

export interface IONearTokenConstructor_Input
  extends Omit<IOTokenConstructor_Input, "metadata" | "blockchain"> {
  metadata: INearTokenMetadata;
  blockchain: NearBlockchain;
}

export type TNearStaticTokenDefinition = Omit<
  IONearTokenConstructor_Input,
  "blockchain" | "blockchainId"
>;
