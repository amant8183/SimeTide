import React from 'react';
import type { SimulatedOrder, OrderbookData } from '../../types/domain';

interface OrderImpactAnalysisProps {
  simulatedOrder: SimulatedOrder;
  orderbookData: OrderbookData | null;
  venue: string;
}

const OrderImpactAnalysis = ({ simulatedOrder, orderbookData }: OrderImpactAnalysisProps) => {
  if (!orderbookData) {
    return (
      <div className="innerContainer bg-bgPanel rounded-md p-4 mt-4">
        <h3 className="text-lg font-bold text-txtPrimary mb-3">Order Impact Analysis</h3>
        <div className="text-txtSecondary text-sm">Waiting for orderbook data...</div>
      </div>
    );
  }

  // Calculate order execution impact based on current market depth
  const calculateOrderImpact = () => {
    const { side, quantity, type, price: limitPrice } = simulatedOrder;
    const { bids, asks, lastPrice } = orderbookData;
    
    const isMarketOrder = type === 'Market';
    const isBuyOrder = side === 'Buy';
    const relevantSide = isBuyOrder ? asks : bids;
    
    let totalExecuted = 0;
    let totalCost = 0;
    let remainingQuantity = quantity;
    const executedLevels = [];
    
    for (let i = 0; i < relevantSide.length && remainingQuantity > 0; i++) {
      const level = relevantSide[i];
      
      if (!isMarketOrder) {
        if (isBuyOrder && level.price > limitPrice) break;
        if (!isBuyOrder && level.price < limitPrice) break;
      }
      
      const executeQuantity = Math.min(remainingQuantity, level.amount);
      totalExecuted += executeQuantity;
      totalCost += executeQuantity * level.price;
      remainingQuantity -= executeQuantity;
      
      executedLevels.push({
        price: level.price,
        quantity: executeQuantity,
        percentage: (executeQuantity / quantity) * 100
      });
    }
    
    // Calculate execution metrics
    const avgExecutionPrice = totalExecuted > 0 ? totalCost / totalExecuted : 0;
    const referencePrice = isMarketOrder ? lastPrice : limitPrice;
    const priceImpact = totalExecuted > 0 
      ? ((avgExecutionPrice - referencePrice) / referencePrice) * 100 * (isBuyOrder ? 1 : -1)
      : 0;
    
    const fillPercentage = (totalExecuted / quantity) * 100;
    const totalValue = totalCost;
    
    return {
      avgExecutionPrice,
      priceImpact,
      fillPercentage,
      totalValue,
      executedLevels,
      remainingQuantity,
      totalExecuted
    };
  };

  const impact = calculateOrderImpact();

  // Format currency values with appropriate precision
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(value);
  };

  // Format percentage values with sign and precision
  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(3)}%`;
  };

  return (
    <div className="innerContainer bg-bgPanel rounded-md p-4 mt-4 w-auto xl:w-full">
      <h3 className="text-lg font-bold text-txtPrimary mb-4">Order Impact Analysis</h3>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-bgMain rounded p-3">
          <div className="text-xs text-txtSecondary mb-1">Avg Execution Price</div>
          <div className="text-sm font-bold text-txtPrimary">
            {formatCurrency(impact.avgExecutionPrice)}
          </div>
        </div>
        
        <div className="bg-bgMain rounded p-3">
          <div className="text-xs text-txtSecondary mb-1">Price Impact</div>
          <div className={`text-sm font-bold ${
            Math.abs(impact.priceImpact) > 1 ? 'text-status-negative' : 
            Math.abs(impact.priceImpact) > 0.1 ? 'text-amber-400' : 'text-status-positive'
          }`}>
            {formatPercentage(impact.priceImpact)}
          </div>
        </div>
        
        <div className="bg-bgMain rounded p-3">
          <div className="text-xs text-txtSecondary mb-1">Fill Percentage</div>
          <div className={`text-sm font-bold ${
            impact.fillPercentage === 100 ? 'text-status-positive' : 'text-amber-400'
          }`}>
            {impact.fillPercentage.toFixed(1)}%
          </div>
        </div>
        
        <div className="bg-bgMain rounded p-3">
          <div className="text-xs text-txtSecondary mb-1">Total Value</div>
          <div className="text-sm font-bold text-txtPrimary">
            {formatCurrency(impact.totalValue)}
          </div>
        </div>
      </div>

      {/* Execution Details */}

    </div>
  );
};

export default OrderImpactAnalysis;
export { OrderImpactAnalysis };