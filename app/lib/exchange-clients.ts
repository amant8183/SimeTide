"use client";
import type { Venue, AnyInstrument, OKXInstrument, BybitInstrument, DeribitInstrument } from '../types/domain';

export const WEBSOCKET_URLS: Record<Venue, string> = {
  OKX: 'wss://ws.okx.com/ws/v5/public',
  Bybit: 'wss://stream.bybit.com/v5/public/spot',
  Deribit: 'wss://www.deribit.com/ws/api/v2'
};

const REST_APIS = {
  OKX: 'https://www.okx.com/api/v5/public/instruments?instType=SPOT',
  Bybit: 'https://api.bybit.com/v5/market/instruments-info?category=spot',
  Deribit: {
    BTC: 'https://www.deribit.com/api/v2/public/get_instruments?currency=BTC&kind=future&expired=false',
    ETH: 'https://www.deribit.com/api/v2/public/get_instruments?currency=ETH&kind=future&expired=false'
  }
};

export const fetchInstruments = async (venue: Venue): Promise<AnyInstrument[]> => {
  try {
    switch (venue) {
      case 'OKX':
        const okxResponse = await fetch(REST_APIS.OKX);
        const okxData = await okxResponse.json();
        return okxData.code === '0' && okxData.data
          ? okxData.data
              .filter((inst: { state: string }) => inst.state === 'live')
              .map((inst: { instId: string; baseCcy: string; quoteCcy: string; tickSz: string; lotSz: string }): OKXInstrument => ({
                exchange: 'OKX',
                instId: inst.instId,
                baseCcy: inst.baseCcy,
                quoteCcy: inst.quoteCcy,
                tickSz: inst.tickSz,
                lotSz: inst.lotSz,
              }))
          : [];
      
      case 'Bybit':
        const bybitResponse = await fetch(REST_APIS.Bybit);
        const bybitData = await bybitResponse.json();
        return bybitData.retCode === 0 && bybitData.result?.list
          ? bybitData.result.list
              .filter((inst: { status: string }) => inst.status === 'Trading')
              .map((inst: { symbol: string; baseCoin: string; quoteCoin: string; priceFilter: { tickSize: string }; lotSizeFilter: { minOrderQty: string } }): BybitInstrument => ({
                exchange: 'Bybit',
                symbol: inst.symbol,
                baseCoin: inst.baseCoin,
                quoteCoin: inst.quoteCoin,
                priceFilter: inst.priceFilter,
                lotSizeFilter: inst.lotSizeFilter
              }))
          : [];

      case 'Deribit':
        const [btcResponse, ethResponse] = await Promise.all([
          fetch(REST_APIS.Deribit.BTC),
          fetch(REST_APIS.Deribit.ETH)
        ]);
        const [btcData, ethData] = await Promise.all([btcResponse.json(), ethResponse.json()]);
        const deribitInstruments: DeribitInstrument[] = [];
        if (btcData.result) deribitInstruments.push(...btcData.result.filter((i: { is_active: boolean }) => i.is_active).map((inst: { instrument_name: string; base_currency: string; quote_currency: string; tick_size: number; min_trade_amount: number; instrument_type?: string }): DeribitInstrument => ({
            exchange: 'Deribit',
            instrument_name: inst.instrument_name,
            base_currency: inst.base_currency,
            quote_currency: inst.quote_currency,
            tick_size: inst.tick_size,
            min_trade_amount: inst.min_trade_amount,
            instrument_type: inst.instrument_type
        })));
        if (ethData.result) deribitInstruments.push(...ethData.result.filter((i: { is_active: boolean }) => i.is_active).map((inst: { instrument_name: string; base_currency: string; quote_currency: string; tick_size: number; min_trade_amount: number; instrument_type?: string }): DeribitInstrument => ({
            exchange: 'Deribit',
            instrument_name: inst.instrument_name,
            base_currency: inst.base_currency,
            quote_currency: inst.quote_currency,
            tick_size: inst.tick_size,
            min_trade_amount: inst.min_trade_amount,
            instrument_type: inst.instrument_type
        })));
        return deribitInstruments;
    }
  } catch (error) {
    console.error(`Failed to fetch ${venue} instruments:`, error);
    return [];
  }
};

export const getSubscriptionMessage = (venue: Venue, instrumentId: string): string => {
  const message = (() => {
    switch (venue) {
      case 'OKX': 
        return { op: 'subscribe', args: [{ channel: 'books', instId: instrumentId }] };
      case 'Bybit': 
        return { op: "subscribe", args: [`orderbook.50.${instrumentId}`] };
      case 'Deribit': 
        return { jsonrpc: '2.0', id: Date.now(), method: 'public/subscribe', params: { channels: [`book.${instrumentId}.none.10.100ms`] } };
    }
  })();
  return JSON.stringify(message);
};

export const getPingMessage = (venue: Venue): string | null => {
  switch (venue) {
    case 'OKX': return JSON.stringify({ op: 'ping' });
    case 'Bybit': return JSON.stringify({ op: 'ping' });
    case 'Deribit': return JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method: 'public/test' });
    default: return null;
  }
};