export type Venue = 'OKX' | 'Bybit' | 'Deribit';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'fallback';

export interface OrderbookEntry {
  price: number;
  amount: number;
  total: number;
}

export interface OrderbookData {
  bids: OrderbookEntry[];
  asks: OrderbookEntry[];
  spread: number;
  lastPrice: number;
}

export interface OKXInstrument {
  exchange: 'OKX';
  instId: string;
  baseCcy: string;
  quoteCcy: string;
  tickSz: string;
  lotSz: string;
}

export interface DeribitInstrument {
  exchange: 'Deribit';
  instrument_name: string;
  base_currency: string;
  quote_currency: string;
  tick_size: number;
  min_trade_amount: number;
  instrument_type?: string;
}

export interface BybitInstrument {
  exchange: 'Bybit';
  symbol: string;
  baseCoin: string;
  quoteCoin: string;
  priceFilter: {
    tickSize: string;
  };
  lotSizeFilter: {
    minOrderQty: string;
  };
}

export type AnyInstrument = OKXInstrument | DeribitInstrument | BybitInstrument;

export type OrderSide = 'Buy' | 'Sell';
export type OrderType = 'Market' | 'Limit';

export interface SimulatedOrder {
  price: number;
  quantity: number;
  side: OrderSide;
  type: OrderType;
}