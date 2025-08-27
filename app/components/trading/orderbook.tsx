"use client"
import React, { useRef, useEffect, useState } from 'react'
import { useOrderbookData } from '../../hooks/useOrderbookData'
import { getConnectionStatusInfo, getInstrumentCurrencies, getInstrumentSpecs } from '../../lib/utils'
import type { Venue, AnyInstrument, SimulatedOrder, OrderbookData } from '../../types/domain'
// Internal order structure for orderbook display
interface Order {
  price: number;
  amount: number;
  total: number;
}
interface OrderbookProps {
  venue: Venue;
  instrument: AnyInstrument | undefined;
  simulatedOrder: SimulatedOrder | null;
}
const Orderbook = ({ venue, instrument, simulatedOrder }: OrderbookProps) => {
  const bidsScrollRef = useRef<HTMLDivElement>(null)
  const asksScrollRef = useRef<HTMLDivElement>(null)
  const [impactMetrics, setImpactMetrics] = useState<{
    fillPercentage: number;
    slippage: number;
    marketImpact: number;
    timeToFill: string;
    filledQuantity: number;
    estimatedPrice: number;
  } | null>(null);
  const [consumedLevels, setConsumedLevels] = useState<{price: number, amount: number}[]>([]);
  const instrumentId = instrument ? 
    ('instId' in instrument ? instrument.instId : 
     'symbol' in instrument ? instrument.symbol : 
     'instrument_name' in instrument ? instrument.instrument_name : null) : null;
  const { baseCcy, quoteCcy } = getInstrumentCurrencies(instrument || null);
  const { tickSize, lotSize } = getInstrumentSpecs(instrument || null);
  const { 
    connectionStatus, 
    data, 
  } = useOrderbookData(venue, instrumentId)
  useEffect(() => {
    if (simulatedOrder && data) {
      const metrics = calculateImpactMetrics(simulatedOrder, data);
      setImpactMetrics(metrics);
      
      if (simulatedOrder.type === 'Market') {
        const levels = simulatedOrder.side === 'Buy' ? data.asks : data.bids;
        let remainingQuantity = simulatedOrder.quantity;
        const newConsumedLevels = [];
        
        for (const level of levels) {
          if (remainingQuantity <= 0) break;
          
          const consumed = Math.min(level.amount, remainingQuantity);
          newConsumedLevels.push({
            price: level.price,
            amount: consumed
          });
          
          remainingQuantity -= consumed;
        }
        
        setConsumedLevels(newConsumedLevels);
      } else {
        setConsumedLevels([]);
      }
    } else {
      setImpactMetrics(null);
      setConsumedLevels([]);
    }
  }, [simulatedOrder, data]);
  // Calculate market impact metrics for simulated orders
  const calculateImpactMetrics = (order: SimulatedOrder, orderbook: OrderbookData) => {
    if (!order || !orderbook) return null;
    
    let filledQuantity = 0;
    let totalCost = 0;
    let slippage = 0;
    let marketImpact = 0;
    let timeToFill = 'Immediate';
    
    if (order.type === 'Market') {
      const levels = order.side === 'Buy' ? orderbook.asks : orderbook.bids;
      const bestPrice = levels[0]?.price || 0;
      
      for (const level of levels) {
        if (filledQuantity >= order.quantity) break;
        
        const available = level.amount;
        const needed = order.quantity - filledQuantity;
        const take = Math.min(available, needed);
        
        filledQuantity += take;
        totalCost += take * level.price;
      }
      
      const avgPrice = totalCost / filledQuantity;
      slippage = order.side === 'Buy' 
        ? ((avgPrice - bestPrice) / bestPrice) * 100
        : ((bestPrice - avgPrice) / bestPrice) * 100;
      
      marketImpact = filledQuantity < order.quantity 
        ? 100
        : (slippage / 10);
      
      timeToFill = filledQuantity < order.quantity 
        ? 'Partial Fill' 
        : 'Immediate';
    } else {
      const levels = order.side === 'Buy' ? orderbook.asks : orderbook.bids;
      const bestPrice = levels[0]?.price || 0;
      const orderPrice = order.price;
      
      if ((order.side === 'Buy' && orderPrice >= bestPrice) || 
          (order.side === 'Sell' && orderPrice <= bestPrice)) {
        for (const level of levels) {
          if (filledQuantity >= order.quantity) break;
          if ((order.side === 'Buy' && level.price > orderPrice) || 
              (order.side === 'Sell' && level.price < orderPrice)) break;
              
          const available = level.amount;
          const needed = order.quantity - filledQuantity;
          const take = Math.min(available, needed);
          
          filledQuantity += take;
          totalCost += take * level.price;
        }
        
        timeToFill = filledQuantity < order.quantity ? 'Partial Fill' : 'Immediate';
      } else {
        timeToFill = 'Not Immediately Fillable';
      }
      
      slippage = 0;
      marketImpact = 0;
    }
    
    const fillPercentage = (filledQuantity / order.quantity) * 100;
    
    return {
      fillPercentage,
      slippage,
      marketImpact,
      timeToFill,
      filledQuantity,
      estimatedPrice: totalCost / filledQuantity || order.price
    };
  };
  const getOrderbookWithSimulatedOrder = (data: OrderbookData, simulatedOrder: SimulatedOrder | null): OrderbookData => {
    if (!simulatedOrder || simulatedOrder.type !== 'Limit') {
      return data;
    }
    const { side, price, quantity } = simulatedOrder;
    const newData = { ...data, bids: [...data.bids], asks: [...data.asks] };
    if (side === 'Buy') {
      const existingIndex = newData.bids.findIndex(bid => Math.abs(bid.price - price) < 0.0001);
      
      if (existingIndex !== -1) {
        newData.bids[existingIndex] = {
          ...newData.bids[existingIndex],
          amount: newData.bids[existingIndex].amount + quantity,
          total: newData.bids[existingIndex].total + price * quantity
        };
      } else {
        let insertIndex = newData.bids.findIndex(bid => bid.price < price);
        if (insertIndex === -1) insertIndex = newData.bids.length;
        
        newData.bids.splice(insertIndex, 0, {
          price,
          amount: quantity,
          total: price * quantity
        });
      }
            } else {
      const existingIndex = newData.asks.findIndex(ask => Math.abs(ask.price - price) < 0.0001);
      
      if (existingIndex !== -1) {
        newData.asks[existingIndex] = {
          ...newData.asks[existingIndex],
          amount: newData.asks[existingIndex].amount + quantity,
          total: newData.asks[existingIndex].total + price * quantity
        };
      } else {
        let insertIndex = newData.asks.findIndex(ask => ask.price > price);
        if (insertIndex === -1) insertIndex = newData.asks.length;
        
        newData.asks.splice(insertIndex, 0, {
          price,
          amount: quantity,
          total: price * quantity
        });
      }
    }
    return newData;
  };
  // Synchronize scroll position between bids and asks sections
  const handleBidsScroll = () => {
    if (bidsScrollRef.current && asksScrollRef.current) {
      asksScrollRef.current.scrollTop = bidsScrollRef.current.scrollTop
    }
  }
  // Generate visual style for bid depth visualization
  const getBidAmplifyStyle = (bid: Order, maxBidAmount: number): React.CSSProperties => {
    const percentage = maxBidAmount > 0 ? (bid.amount / maxBidAmount) * 100 : 0;
    return {
      backgroundImage: 'linear-gradient(to left, rgba(37, 193, 120, 0.2), rgba(37, 193, 120, 0.2))',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right',
      backgroundSize: `${percentage}% 100%`,
    };
  };
  // Generate visual style for ask depth visualization
  const getAskAmplifyStyle = (ask: Order, maxAskAmount: number): React.CSSProperties => {
    const percentage = maxAskAmount > 0 ? (ask.amount / maxAskAmount) * 100 : 0;
    return {
      backgroundImage: 'linear-gradient(to right, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.2))',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'left',
      backgroundSize: `${percentage}% 100%`,
    };
  };
  // Calculate volume intensity percentage for visual representation
  const getVolumeIntensity = (amount: number, maxAmount: number): number => {
      return maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
  };
  // Format price with appropriate decimal places based on tick size
  const formatPrice = (num: number): string => num.toFixed(Math.max(0, -Math.floor(Math.log10(tickSize))));
  // Format amount with appropriate decimal places based on lot size
  const formatAmount = (num: number): string => num.toFixed(Math.max(0, -Math.floor(Math.log10(lotSize))));
  const statusInfo = getConnectionStatusInfo(connectionStatus);
  
  if (!data || !instrument) {
    return (
      <div className="innerContainer h-85 bg-bgPanel rounded-md flex items-center justify-center mx-auto p-2 sm:p-4">
        <div className="text-center w-full">
          <div className={`text-2xl text-txtPrimary ${statusInfo.pulse ? 'animate-pulse' : ''}`}>
            {statusInfo.icon}
          </div>
          <div className="text-txtSecondary text-lg mt-2">Loading Order Book...</div>
          <div className={`text-sm text-txtSecondary mt-2`}>{statusInfo.text}</div>
        </div>
      </div>
    )
  }
  const isSimulatedRow = (price: number): boolean => {
    if (!simulatedOrder || simulatedOrder.type !== 'Limit') return false;
    return Math.abs(price - simulatedOrder.price) < 0.0001;
  };
  const isMarketOrderConsumedLevel = (price: number, side: 'bid' | 'ask'): boolean => {
    if (!simulatedOrder || simulatedOrder.type !== 'Market') return false;
    
    const isCorrectSide = (simulatedOrder.side === 'Buy' && side === 'ask') || 
                         (simulatedOrder.side === 'Sell' && side === 'bid');
    
    if (!isCorrectSide) return false;
    
    return consumedLevels.some(level => {
      const tolerance = tickSize > 0 ? tickSize / 2 : 0.0001;
      return Math.abs(level.price - price) < tolerance;
    });
  };
  const getConsumedAmount = (price: number): number => {
    const tolerance = tickSize > 0 ? tickSize / 2 : 0.0001;
    const level = consumedLevels.find(l => Math.abs(l.price - price) < tolerance);
    return level ? level.amount : 0;
  };
  const orderbookData = getOrderbookWithSimulatedOrder(data, simulatedOrder);
  const maxBidAmount = Math.max(...orderbookData.bids.map(b => b.amount), 0);
  const maxAskAmount = Math.max(...orderbookData.asks.map(a => a.amount), 0);
  return (
    <div className="innerContainer h-85 bg-bgPanel rounded-md mx-auto p-2 flex flex-col m-1">
      <div className="flex flex-row items-center justify-between px-2 sm:px-4 py-1 rounded-sm mb-1">
        <div className="flex flex-col">
          <h2 className="text-txtPrimary font-bold text-base sm:text-md">Order Book</h2>
          {instrument && (
            <div className="text-xs text-txtSecondary">
              <span className="font-medium">{instrumentId}</span> • <span className="text-txtOnAccent">{venue}</span>
              <div className="mt-1">
                {instrument.exchange === 'Deribit' && instrument.instrument_type && (
                  <span className="ml-2 text-blue-400">
                    {instrument.instrument_type.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        <div className={`flex items-center space-x-1 ${statusInfo.color} mt-2 sm:mt-0`}>
          <span className={statusInfo.pulse ? 'animate-pulse' : ''}>{statusInfo.icon}</span>
          <span className="text-xs">{statusInfo.text}</span>
        </div>
      </div>
      
      {connectionStatus === 'error' && (
        <div className=" bg-status-negative/20 border-l-4 border-status-negative px-2 sm:px-4 py-2">
          <div className="text-status-negative text-xs font-medium">
            Connection lost, attempting to reconnect...
          </div>
        </div>
      )}
      
      {connectionStatus === 'connected' && (
        <div className="bg-txtOnAccent/20 border-l-4 border-txtOnAccent px-2 sm:px-4 py-2 mb-2">
          <div className="text-txtOnAccent text-xs font-medium">
            ✓ Live {venue} data • {baseCcy}/{quoteCcy}
          </div>
        </div>
      )}
      {simulatedOrder && (
        <div className={`${simulatedOrder.type === 'Limit' ? 'bg-accent-primary/20 border-accent-primary' : 'bg-blue-500/20 border-blue-500'} border-l-4 px-2 sm:px-4 py-2 mb-2`}>
          <div className={`${simulatedOrder.type === 'Limit' ? 'text-accent-primary' : 'text-blue-400'} text-xs font-medium flex items-center`}>
            <span className="mr-2">●</span>
            Simulated {simulatedOrder.side} {simulatedOrder.type} Order: {simulatedOrder.quantity} {simulatedOrder.type === 'Limit' ? `@ ${simulatedOrder.price}` : ''}
            {impactMetrics && (
              <span className="ml-2">
                • Est. Fill: {impactMetrics.fillPercentage.toFixed(1)}% @ {impactMetrics.estimatedPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      )}
      <div className="flex items-center justify-between w-full px-2 sm:px-4 py-2 bg-bgMain border-b border-border-primary text-xs">
        <div className="flex flex-col items-start">
          <span className="text-txtOnAccent font-mono font-bold text-sm">
            {formatPrice(orderbookData.bids[0]?.price || 0)}
          </span>
        </div>
        <div className="text-center flex-1 px-2">
          <div className="text-txtPrimary font-mono text-sm font-bold">
            {formatPrice(orderbookData.lastPrice)}
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-status-negative font-mono font-bold text-sm">
            {formatPrice(orderbookData.asks[0]?.price || 0)}
          </span>
        </div>
      </div>
      
      <div className="hidden sm:grid grid-cols-6 gap-4 px-2 sm:px-4 py-1 text-xs text-txtSecondary font-medium border-b border-border-primary bg-bgMain">
        <span>Price({quoteCcy})</span>
        <span className="text-right">Amount({baseCcy})</span>
        <span className="text-right">Total({baseCcy})</span>
        <span>Price({quoteCcy})</span>
        <span className="text-right">Amount({baseCcy})</span>
        <span className="text-right">Total({baseCcy})</span>
      </div>
      
      <div className="sm:hidden grid grid-cols-4 gap-1 px-2 py-1 text-xs text-txtSecondary font-medium border-b border-border-primary bg-bgMain">
        <span className="text-txtOnAccent font-bold text-xs">Price</span>
        <span className="text-txtOnAccent font-bold text-xs text-right">Amount</span>
        <span className="text-status-negative font-bold text-xs">Price</span>
        <span className="text-status-negative font-bold text-xs text-right">Amount</span>
      </div>
      
      <div 
        className="bg-bgMain flex-1 flex flex-row overflow-y-auto h-48 sm:h-64" 
        ref={bidsScrollRef} 
        onScroll={handleBidsScroll} 
        style={{scrollbarWidth: 'thin', scrollbarColor: '#35d799 #6ee2b0' }} 
      > 
        <div className="flex-1 flex flex-col"> 
          <div> 
            {orderbookData.bids.map((bid, index) => { 
              const intensity = getVolumeIntensity(bid.amount, maxBidAmount);
              const isSimulated = isSimulatedRow(bid.price);
              const isConsumed = isMarketOrderConsumedLevel(bid.price, 'bid');
              const consumedAmount = getConsumedAmount(bid.price);
              return ( 
                <div  
                  key={`bid-${index}`}  
                  className={`relative group hover:bg-bgHover transition-all duration-200 border-y-[0.5px] border-border-primary ${
                    isSimulated ? 'ring-2 ring-yellow-500 ring-inset bg-yellow-500/20' : 
                    isConsumed ? 'ring-2 ring-blue-500 ring-inset bg-blue-500/20' : ''
                  }`}
                  style={getBidAmplifyStyle(bid, maxBidAmount)} 
                > 
                  {intensity > 75 && <div className="absolute inset-0 bg-gradient-to-l from-txtOnAccent/75 via-txtOnAccent/5 to-transparent animate-pulse" />} 
                  <div className="relative grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2 px-1 sm:px-4 py-0.5 sm:py-1 text-xs font-mono"> 
                    <span className={`font-medium transition-colors truncate text-xs sm:text-xs ${intensity > 60 ? 'text-txtOnAccent font-bold' : 'text-txtOnAccent'}`}>
                      {formatPrice(bid.price)}
                      {isSimulated && <span className="ml-1 text-yellow-500 font-bold">● SIMULATED</span>}
                      {isConsumed && <span className="ml-1 text-blue-500 font-bold">● MARKET</span>}
                    </span> 
                    <span className={`text-right transition-colors truncate text-xs sm:text-xs ${intensity > 60 ? 'text-txtPrimary font-bold' : 'text-txtPrimary'}`}>
                      {formatAmount(bid.amount)}
                      {isConsumed && consumedAmount > 0 && (
                        <span className="ml-1 text-blue-400">
                          (-{formatAmount(consumedAmount)})
                        </span>
                      )}
                    </span> 
                    <span className="text-txtPrimary text-right truncate hidden sm:block">
                      {formatAmount(bid.total)}
                    </span> 
                  </div> 
                </div> 
              );
            })} 
          </div> 
        </div> 
        
        <div className="flex-1 flex flex-col"> 
          <div> 
            <div className="space-y-0"> 
              {orderbookData.asks.map((ask, index) => { 
                const intensity = getVolumeIntensity(ask.amount, maxAskAmount);
                const isSimulated = isSimulatedRow(ask.price);
                const isConsumed = isMarketOrderConsumedLevel(ask.price, 'ask');
                const consumedAmount = getConsumedAmount(ask.price);
                return ( 
                  <div  
                    key={`ask-${index}`}  
                    className={`relative group hover:bg-bgHover transition-all duration-200 border-y-[0.5px] border-border-primary ${
                      isSimulated ? 'ring-2 ring-yellow-500 ring-inset bg-yellow-500/20' : 
                      isConsumed ? 'ring-2 ring-blue-500 ring-inset bg-blue-500/20' : ''
                    }`}
                    style={getAskAmplifyStyle(ask, maxAskAmount)} 
                  > 
                    {intensity > 75 && <div className="absolute inset-0 bg-gradient-to-r from-status-negative/75 via-status-negative/5 to-transparent animate-pulse" />} 
                    <div className="relative grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2 px-1 sm:px-4 py-0.5 sm:py-1 text-xs font-mono"> 
                      <span className={`font-medium transition-colors truncate text-xs sm:text-xs ${intensity > 60 ? 'text-txtPrimary font-bold' : 'text-txtPrimary'}`}>
                        {formatPrice(ask.price)}
                        {isSimulated && <span className="ml-1 text-yellow-500 font-bold">● SIMULATED</span>}
                        {isConsumed && <span className="ml-1 text-blue-500 font-bold">● MARKET</span>}
                      </span> 
                      <span className={`text-right transition-colors truncate text-xs sm:text-xs ${intensity > 60 ? 'text-txtPrimary font-bold' : 'text-txtPrimary'}`}>
                        {formatAmount(ask.amount)}
                        {isConsumed && consumedAmount > 0 && (
                          <span className="ml-1 text-blue-400">
                            (-{formatAmount(consumedAmount)})
                          </span>
                        )}
                      </span> 
                      <span className="text-status-negative text-right truncate hidden sm:block">
                        {formatAmount(ask.total)}
                      </span> 
                    </div> 
                  </div> 
                );
              })} 
            </div> 
          </div> 
        </div> 
      </div>
    </div>
  )
}
export default Orderbook 