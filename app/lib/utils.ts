"use client";
import type { AnyInstrument, ConnectionStatus } from "../types/domain";

export const getInstrumentId = (instrument: AnyInstrument): string => {
    switch (instrument.exchange) {
        case 'OKX': return instrument.instId;
        case 'Bybit': return instrument.symbol;
        case 'Deribit': return instrument.instrument_name;
    }
};

export const getInstrumentCurrencies = (instrument: AnyInstrument | null) => {
    if (!instrument) return { baseCcy: '...', quoteCcy: '...' };
    switch (instrument.exchange) {
        case 'OKX': return { baseCcy: instrument.baseCcy, quoteCcy: instrument.quoteCcy };
        case 'Bybit': return { baseCcy: instrument.baseCoin, quoteCcy: instrument.quoteCoin };
        case 'Deribit': return { baseCcy: instrument.base_currency, quoteCcy: instrument.quote_currency };
    }
};

export const getInstrumentSpecs = (instrument: AnyInstrument | null) => {
    if (!instrument) return { tickSize: 0.01, lotSize: 0.0001 };
    switch (instrument.exchange) {
        case 'OKX': return { tickSize: parseFloat(instrument.tickSz), lotSize: parseFloat(instrument.lotSz) };
        case 'Bybit': return { tickSize: parseFloat(instrument.priceFilter.tickSize), lotSize: parseFloat(instrument.lotSizeFilter.minOrderQty) };
        case 'Deribit': return { tickSize: instrument.tick_size, lotSize: instrument.min_trade_amount };
    }
};

export const getConnectionStatusInfo = (status: ConnectionStatus) => {
  switch (status) {
    case 'connecting':
      return { color: 'text-yellow-500', icon: '⟳', text: 'Connecting...', pulse: true };
    case 'connected':
      return { color: 'text-green-500', icon: '●', text: 'Live', pulse: false };
    case 'disconnected':
      return { color: 'text-gray-500', icon: '●', text: 'Offline', pulse: false };
    case 'error':
      return { color: 'text-red-500', icon: '●', text: 'Error', pulse: false };
    case 'fallback':
      return { color: 'text-orange-400', icon: '●', text: 'Fallback', pulse: true };
    default:
      return { color: 'text-gray-500', icon: '●', text: 'Unknown', pulse: false };
  }
};