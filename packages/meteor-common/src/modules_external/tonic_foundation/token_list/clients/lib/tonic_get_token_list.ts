import { TokenInfo, TokenListProvider } from "@tonic-foundation/token-list";
import { ENearNetwork } from "../../../../near/types/near_basic_types";
import { IOGetTokenList_input } from "../../types_tokenlist";

export async function getTokenList({ network }: IOGetTokenList_input): Promise<TokenInfo[]> {
  const net = network === ENearNetwork.mainnet ? "mainnet" : "testnet";

  const provider = await new TokenListProvider().resolve();
  return provider.filterByNearEnv(net).getList();
}
