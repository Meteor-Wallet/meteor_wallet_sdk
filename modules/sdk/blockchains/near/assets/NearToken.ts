import { Token } from "../../../core/assets/token/Token";
import { IOTokenToTokenAmount_Input } from "../../../core/assets/token/Token.interfaces.ts";
import { NearTokenAmount } from "./NearTokenAmount";
import { INearTokenMetadata, IONearTokenConstructor_Input } from "./near.token.interfaces";
import { EBlockchain } from "../../../core/blockchain/blockchain.enums";
import { token_utils } from "../../../core/assets/token/token.utils.ts";
import { EAccountFeature } from "../../../core/account/features/account_feature.enums.ts";
import { IBasicAccountFeatureMap } from "../../../core/account/features/account_feature.interfaces.ts";
import { NearBlockchain } from "../NearBlockchain.ts";
import { ENearFtSpec } from "./near.token.enums.ts";
import { NearBasicAccount } from "../account/NearBasicAccount.ts";
import {
  IWithBasicAccount,
  IWithBasicAccountProps,
} from "../../../core/account/account.interfaces.ts";
import { getNetworkIdFromProps } from "../../../core/blockchain/network/blockchain_network.utils.ts";
import { IListManageable } from "../../../core/utility/managers/list_manager/list_manager.interfaces.ts";

// reference: https://nomicon.io/Standards/Tokens/FungibleToken/Metadata#reference-level-explanation

export class NearToken
  extends Token
  implements
    IListManageable<IWithBasicAccountProps>,
    INearTokenMetadata,
    IWithBasicAccount<NearBasicAccount>,
    IWithBasicAccountProps
{
  spec: ENearFtSpec;
  name: string;
  symbol: string;
  icon: string | null;
  reference: string | null;
  reference_hash: string | null;
  blockchainId: EBlockchain.near = EBlockchain.near;

  basic: NearBasicAccount;
  blockchain: NearBlockchain;

  constructor({
    metadata,
    isNative,
    isBridged,
    dollarPrice,
    id,
    decimals,
    blockchain,
    customNetworkId,
    genericNetworkId,
    blockchainId,
  }: IONearTokenConstructor_Input) {
    super({
      isNative,
      dollarPrice,
      id,
      decimals,
      blockchain,
      isBridged,
      genericNetworkId,
      customNetworkId,
      blockchainId,
    });
    this.dollarPrice = dollarPrice;
    this.spec = metadata.spec;
    this.name = metadata.name;
    this.symbol = metadata.symbol;
    this.icon = metadata.icon;
    this.reference = metadata.reference;
    this.reference_hash = metadata.reference_hash;
    this.decimals = metadata.decimals;
    this.blockchain = blockchain;
    this.basic = blockchain.createBasicAccount({
      id,
      networkId: getNetworkIdFromProps({ genericNetworkId, customNetworkId }),
    });
  }

  // convert to NearTokenAmount
  toTokenAmount(inputs: IOTokenToTokenAmount_Input): NearTokenAmount {
    let cryptoInteger = inputs.value;

    if (!inputs.isCryptoInteger) {
      cryptoInteger = token_utils.convertReadableAmountToCryptoInteger(inputs.value, this.decimals);
    }
    return new NearTokenAmount({ cryptoInteger, token: this });
  }
}
