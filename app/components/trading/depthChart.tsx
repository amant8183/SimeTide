"use client";
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useOrderbookData } from '../../hooks/useOrderbookData';
import type { Venue } from '../../types/domain';

interface DepthChartProps {
  venue: Venue;
  instrumentId: string | null;
}

// Custom tooltip component for depth chart
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number }>; label?: number }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 bg-opacity-90 p-3 rounded-md border border-gray-700 text-sm shadow-lg">
        <p className="text-gray-300 font-semibold">{`Price: ${(label as number).toFixed(2)}`}</p>
        <p className="text-gray-400">{`Cumulative Vol: ${(payload[0].value! / 1000).toFixed(2)}K`}</p>
      </div>
    );
  }
  return null;
};

const DepthChart: React.FC<DepthChartProps> = ({ venue, instrumentId }) => {
  const { data } = useOrderbookData(venue, instrumentId);

  if (!data || data.bids.length === 0 || data.asks.length === 0) {
    return (
      <div className="innerContainer w-auto xl:w-full h-44 sm:h-76 bg-bgPanel rounded-md flex items-center justify-center p-4">
        <p className="text-txtSecondary animate-pulse">Loading Depth Chart...</p>
      </div>
    );
  }

  // Prepare chart data from orderbook
  const bidsChartData = data.bids.map(b => ({ price: b.price, volume: b.total })).reverse();
  const asksChartData = data.asks.map(a => ({ price: a.price, volume: a.total }));
  const chartData = [...bidsChartData, ...asksChartData];
  
  // Calculate maximum volume for Y-axis scaling
  const maxVolume = Math.max(
    bidsChartData[bidsChartData.length - 1]?.volume || 0,
    asksChartData[asksChartData.length - 1]?.volume || 0
  );

  return (
    <div className="innerContainer w-auto xl:w-full h-44 sm:h-76 bg-bgPanel rounded-md p-4 flex flex-col">
      <h2 className="text-txtPrimary font-bold text-lg mb-4">Market Depth</h2>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorBids" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#25C178" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#25C178" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorAsks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF4D4D" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#FF4D4D" stopOpacity={0} />
            </linearGradient>
          </defs>
          
          <XAxis 
            dataKey="price" 
            type="number" 
            domain={['dataMin', 'dataMax']}
            tick={{ fill: '#868D9B', fontSize: 11 }}
            tickFormatter={(price: number) => price.toFixed(1)}
            axisLine={{ stroke: '#363A45' }}
            tickLine={{ stroke: '#363A45' }}
          />
          <YAxis 
            orientation="right"
            domain={[0, maxVolume * 1.1]}
            tick={{ fill: '#868D9B', fontSize: 11 }}
            tickFormatter={(volume: number) => `${(volume / 1000).toFixed(0)}K`}
            axisLine={{ stroke: '#363A45' }}
            tickLine={{ stroke: '#363A45' }}
            mirror
          />

          <Tooltip content={<CustomTooltip />} />
          
          <Area type="step" dataKey="volume" data={bidsChartData} stroke="#25C178" fill="url(#colorBids)" strokeWidth={1.5} />
          <Area type="step" dataKey="volume" data={asksChartData} stroke="#FF4D4D" fill="url(#colorAsks)" strokeWidth={1.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DepthChart;