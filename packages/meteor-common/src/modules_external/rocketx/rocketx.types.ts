import { DBIBridgeHistory } from "../../modules_feature/bridge/bridge.types";

interface IRocketX_SupportedExchange {
  id: string;
  name: string;
  logo: string;
  type: string;
  enabled: number;
  is_txn_allowed: number;
}

export interface IRocketX_SupportedNetwork {
  id: string;
  name: string;
  symbol: string;
  chainId: string;
  logo: string;
  enabled: number;
  rpc_url: string;
  native_token: string;
  block_explorer_url: string;
  shorthand: string;
  sort_order: number;
  regex: string;
  type: string;
  greyscale_logo: string;
  buy_enabled: number;
  sell_enabled: number;
}

export interface IRocketX_Config {
  configs: {
    is_rocket_live: number;
    is_maintenance_mode_enabled: number;
  };
  supported_exchanges: IRocketX_SupportedExchange[];
  supported_network: IRocketX_SupportedNetwork[];
}

export interface IRocketX_Token {
  id: number;
  token_name: string;
  token_symbol: string;
  coin_id: string;
  icon_url: string;
  enabled: number;
  score: number;
  is_custom: number;
  is_native_token: number;
  contract_address: string;
  token_decimals: number;
  network_id: string;
  chainId: string;
  walletless_enabled: number;
  buy_enabled: number;
  sell_enabled: number;
}

interface IRocketX_QuotationTokenInfo {
  id: number;
  contract_address: string;
  token_decimals: number;
  token_symbol: string;
  token_name: string;
  network_symbol: string;
  icon_url: string;
  network_name: string;
  chainId: string;
  network_shorthand: string;
  network_logo: string;
  network_type: string;
  block_explorer_url: string;
  max_amount: number;
  network_id: string;
  price: number;
  is_native_token: number;
}

export interface IRocketX_Quote {
  err?: string;
  code?: number;
  exchangeInfo: {
    id: number;
    title: string;
    logo: string;
    allow_diff_wallet: boolean;
    walletLess: boolean;
    memoRequired?: boolean;
    override: boolean;
    exchange_type: string;
    keyword: string;
  };
  fromTokenInfo: IRocketX_QuotationTokenInfo;
  toTokenInfo: IRocketX_QuotationTokenInfo;
  estTimeInSeconds: {
    avg: number;
    min: number | null;
    max: number | null;
  };
  type: string;
  fromAmount: number;
  toAmount: number;
  platformFeeUsd: number;
  platformFeeInPercent: number;
  excludingFee: number;
  includingFee: number;
  discount: number;
  isTxnAllowed: boolean;
  gasFeeUsd: number;
  additionalInfo: {
    avgPrice: {
      from: number;
      to: number;
    };
    priceImpact: number;
    priceImpactWithoutGasFee: number;
    totalFeeUsd: number;
    savingUsd: number;
  };
}

export interface IRocketX_Quotation {
  platformToken: {
    totalHolding: number;
    eligibleDiscount: number;
    holdingByNetwork: {};
  };
  quotes: IRocketX_Quote[];
  alternateRoute: null;
  meteor_fee_percent: number;
}

interface IRocketX_ExchangeInfo {
  id: number;
  title: string;
  logo: string;
  allow_diff_wallet: boolean;
  walletLess: boolean;
  memoRequired: boolean;
  override: boolean;
  exchange_type: string;
}

export interface IRocketX_SwapResponse {
  requestId: string;
  exchangeInfo: IRocketX_ExchangeInfo;
  fromTokenInfo: IRocketX_Token;
  toTokenInfo: IRocketX_Token;
  estTimeInSeconds: {
    avg: number;
    min: number | null;
    max: number | null;
  };
  path: [];
  swap: {
    fromAmount: number;
    toAmount: number;
    depositAddress: string;
    tx: {
      from: string;
      to: string;
      memo: null | string;
      method: string;
      chainId: string;
      networkType: string;
    };
  };
}

export interface IRocketX_BridgeHistoryResponse {
  history: DBIBridgeHistory[];
  count: number;
}
