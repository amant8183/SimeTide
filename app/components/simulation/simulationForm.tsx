"use client";

import React, { useState, FormEvent } from 'react';
import Image from 'next/image';
import { getInstrumentId } from '../../lib/utils';
import type { Venue, AnyInstrument, SimulatedOrder, OrderSide, OrderType } from '../../types/domain';

// Available order types for simulation
const ORDER_TYPES: OrderType[] = ["Market", "Limit"];
// Available order sides
const SIDES: OrderSide[] = ["Buy", "Sell"];
// Timing delay options for order execution simulation
const TIMING_DELAYS = [
  { label: "Immediate", value: 0 },
  { label: "5s delay", value: 5 },
  { label: "10s delay", value: 10 },
  { label: "30s delay", value: 30 }
];

interface SimulationFormProps {
  venue: Venue;
  instruments: AnyInstrument[];
  isLoadingInstruments: boolean;
  selectedInstrumentId: string | null;
  onVenueChange: (venue: Venue) => void;
  onInstrumentChange: (instrumentId: string) => void;
  onSimulate: (order: SimulatedOrder) => void;
  onClose?: () => void;
}

const SimulationForm = ({
  venue,
  instruments,
  isLoadingInstruments,
  selectedInstrumentId,
  onVenueChange,
  onInstrumentChange,
  onSimulate,
  onClose
}: SimulationFormProps) => {
  const [orderType, setOrderType] = useState<OrderType>("Market");
  const [side, setSide] = useState<OrderSide>("Buy");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [timing, setTiming] = useState(TIMING_DELAYS[0]);
  const [symbolDropdownOpen, setSymbolDropdownOpen] = useState(false);

  // Handle form submission and order simulation
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!quantity || (orderType === 'Limit' && !price)) {
      alert("Please fill in all required fields.");
      return;
    }
    
    // Create simulated order object
    onSimulate({
      type: orderType,
      side,
      price: parseFloat(price) || 0,
      quantity: parseFloat(quantity),
    });
  };
  
  // Get the appropriate icon for a given symbol
  const getIconForSymbol = (symbolId: string) => {
    const asset = symbolId.split(/[-_]/)[0].toLowerCase();
    if (asset.includes('eth')) return '/eth.png';
    if (asset.includes('sol')) return '/sol.png';
    if (asset.includes('btc'))return '/btc.png';
    return '/default.png';
  };
  
  return (
    <form
      onSubmit={handleSubmit}
      className='innerContainer h-full lg:w-[380px] lg:max-w-[380px] bg-bgPanel rounded-md p-4 flex flex-col flex-shrink-0'
    >
      <div className='border-b border-bginput pb-4 mb-4'>
        <div className="flex justify-between items-start mb-3">
          <h2 className="text-lg font-bold text-txtPrimary">Order Simulator</h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-txtSecondary hover:text-status-negative transition-colors p-1 rounded-md hover:bg-bgHover"
              title="Close simulator"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <label className="simulatorHeading">Venue</label>
        <div className="flex gap-1 mt-1.5">
          {(['OKX', 'Bybit', 'Deribit'] as Venue[]).map((v) => (
            <button
              type="button"
              key={v}
              className={`navBtn flex-1 transition-all text-sm ${
                venue === v ? "btnGradient text-black" : "bg-bgMain text-txtPrimary hover:bg-bgHover"
              }`}
              onClick={() => onVenueChange(v)}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="simulatorHeading">Symbol</label>
          <div className="relative">
            <button
              type="button"
              className="navBtn bg-bgMain text-white justify-between gap-2 w-full text-xs sm:text-sm disabled:opacity-50"
              onClick={() => setSymbolDropdownOpen(!symbolDropdownOpen)}
              disabled={isLoadingInstruments}
            >
              <div className="navBtn bg-bgMain text-white justify-start gap-2 w-full text-xs sm:text-sm disabled:opacity-50">
                {isLoadingInstruments ? (
                  <span>Loading...</span>
                ) : (
                  <>
                    <Image 
                      src={getIconForSymbol(selectedInstrumentId || '')} 
                      alt="" 
                      width={24} 
                      height={24} 
                      className="w-4 h-auto sm:w-6 sm:h-auto"
                    />
                    <span className="text-xs sm:text-sm truncate">
                      {selectedInstrumentId || "Select Symbol"}
                    </span>
                  </>
                )}
              </div>
              <svg
                viewBox="0 0 10 6"
                fill="currentColor"
                className="w-1 h-1 sm:w-2 sm:h-2"
              >
                <polygon points="0,0 10,0 5,6" />
              </svg>
            </button>
            {symbolDropdownOpen && !isLoadingInstruments && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-bgMain border border-border-primary rounded shadow-lg z-20 max-h-60 overflow-y-auto">
                {instruments.map((instrument) => {
                  const id = getInstrumentId(instrument);
                  return (
                    <button
                      type="button"
                      key={id}
                      className={`flex items-center justify-start w-full px-4 py-2 font-bold gap-3 text-xs sm:text-sm ${
                        id === selectedInstrumentId 
                          ? "btnGradient text-black" 
                          : "text-white hover:bg-bgHover"
                      }`}
                      onClick={() => {
                        onInstrumentChange(id);
                        setSymbolDropdownOpen(false);
                      }}
                    >
                      <Image 
                        src={getIconForSymbol(id)} 
                        alt="" 
                        width={24} 
                        height={24} 
                        className="w-4 h-auto sm:w-6 sm:h-auto"
                      />
                      <span className="truncate">{id}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className=" gap-4 p-3 rounded">
          <div className='flex lg:flex-col justify-between items-start gap-4'>
            <div className="space-y-1.5 w-1/2">
              <label className="simulatorHeading">Type</label>
              <div className="flex gap-1">
                {ORDER_TYPES.map((type) => (
                  <button type="button" key={type} onClick={() => setOrderType(type)} className={`flex-1 py-1.5 px-2 rounded text-xs font-bold transition-all ${orderType === type ? "btnGradient text-black" : "bg-bgMain text-txtPrimary hover:bg-bgHover"}`}>
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5 w-1/2">
              <label className="simulatorHeading">Side</label>
              <div className="flex gap-1">
                {SIDES.map((sideOption) => (
                  <button type="button" key={sideOption} onClick={() => setSide(sideOption)} className={`flex-1 py-1.5 px-2 rounded text-xs font-bold transition-all ${side === sideOption ? (sideOption === "Buy" ? "btnGradient text-black" : "bg-status-negative text-white") : "bg-bgMain text-txtPrimary hover:bg-bgHover"}`}>
                    {sideOption}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className='flex gap-4'>
          {orderType === "Limit" && (
            <div className="space-y-1.5 flex-1">
              <label htmlFor="price" className="simulatorHeading">Price</label>
              <div className="relative">
                <input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Enter price" required className="w-full bg-bgMain text-txtPrimary px-3 py-2 pr-12 rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => setPrice(prev => (parseFloat(prev || "0") + 0.1).toFixed(1))}
                    className="w-6 h-3 flex items-center justify-center text-white hover:text-accent-primary transition-colors"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrice(prev => Math.max(0, parseFloat(prev || "0") - 0.1).toFixed(1))}
                    className="w-6 h-3 flex items-center justify-center text-white hover:text-accent-primary transition-colors"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-1.5 flex-1">
            <label htmlFor="quantity" className="simulatorHeading">Quantity</label>
            <div className="relative">
              <input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Enter quantity" required className="w-full bg-bgMain text-txtPrimary px-3 py-2 pr-12 rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => setQuantity(prev => (parseFloat(prev || "0") + 0.01).toFixed(1))}
                  className="w-6 h-3 flex items-center justify-center text-white hover:text-accent-primary transition-colors"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setQuantity(prev => Math.max(0, parseFloat(prev || "0") - 0.01).toFixed(1))}
                  className="w-6 h-3 flex items-center justify-center text-white hover:text-accent-primary transition-colors"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
            <label className="simulatorHeading">Timing Simulation</label>
            <div className="grid grid-cols-2 gap-1.5">
                {TIMING_DELAYS.map((delay) => (
                <button type="button" key={delay.value} onClick={() => setTiming(delay)} className={`py-1.5 px-2 rounded text-xs font-bold transition-all ${timing.value === delay.value ? "btnGradient text-black" : "bg-bgMain text-txtPrimary hover:bg-bgHover"}`}>
                    {delay.label}
                </button>
                ))}
            </div>
        </div>

        <button type="submit" className="w-full btnGradient text-black font-bold py-3 rounded text-sm mt-4 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoadingInstruments}>
          SIMULATE ORDER
        </button>
      </div>
    </form>
  )
}

export default SimulationForm;