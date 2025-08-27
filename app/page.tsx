"use client" 

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/layout/navbar';
import Footer from './components/layout/footer';
import SimulationForm from './components/simulation/simulationForm';
import { Orderbook, DepthChart } from './components/trading';
import { useOrderbookData } from './hooks/useOrderbookData';
import OrderImpactAnalysis from './components/simulation/simulatorView';
import { useInstruments } from './hooks/useInstrument';
import { getInstrumentId } from './lib/utils';
import type { Venue, SimulatedOrder, AnyInstrument } from './types/domain';
import LandingPage from './components/layout/landingPage';

// Default instruments for each exchange to pre-select on venue change
const DEFAULT_INSTRUMENTS: Record<Venue, string> = {
  OKX: 'BTC-USDT',
  Bybit: 'BTCUSDT',
  Deribit: 'BTC-PERPETUAL'
};

const Page = () => {
  // State for selected venue, instrument, and simulated order
  const [selectedVenue, setSelectedVenue] = useState<Venue>('OKX');
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string | null>(null);
  const [simulatedOrder, setSimulatedOrder] = useState<SimulatedOrder | null>(null);

  // Fetch available instruments for the selected venue
  const { instruments, isLoading: isLoadingInstruments } = useInstruments(selectedVenue);
  const { data: orderbookData } = useOrderbookData(selectedVenue, selectedInstrumentId);
  
  // Set the default instrument when instruments are loaded or venue changes
  useEffect(() => {
    if (!isLoadingInstruments && instruments.length > 0) {
      const defaultId = DEFAULT_INSTRUMENTS[selectedVenue];
      const defaultInstrument = instruments.find(inst => getInstrumentId(inst) === defaultId);
      setSelectedInstrumentId(defaultInstrument ? defaultId : getInstrumentId(instruments[0]));
    }
  }, [instruments, isLoadingInstruments, selectedVenue]);

  // Handle venue change - reset instrument and clear simulation
  const handleVenueChange = useCallback((venue: Venue) => {
    setSelectedVenue(venue);
    setSelectedInstrumentId(null); 
    setSimulatedOrder(null);
  }, []);
  
  // Handle instrument change - clear simulation
  const handleInstrumentChange = useCallback((instrumentId: string) => {
    setSelectedInstrumentId(instrumentId);
    setSimulatedOrder(null);
  }, []);

  // Handle order simulation
  const handleSimulate = useCallback((order: SimulatedOrder) => {
    console.log("Simulating order:", order);
    setSimulatedOrder(order);
  }, []);

  // Handle close simulation
  const handleCloseSimulation = useCallback(() => {
    setSimulatedOrder(null);
  }, []);

  // Find the currently selected instrument
  const selectedInstrument: AnyInstrument | undefined = instruments.find(
    inst => selectedInstrumentId && getInstrumentId(inst) === selectedInstrumentId
  );

  return (
    <div className='pt-5 min-h-screen gridbg flex flex-col'>
      <Navbar
        selectedVenue={selectedVenue}
        instruments={instruments}
        isLoadingInstruments={isLoadingInstruments}
        selectedInstrumentId={selectedInstrumentId}
        onVenueChange={handleVenueChange}
        onInstrumentChange={handleInstrumentChange}
      />
      <LandingPage />
      <main id="orderbook-section" className=' pt-20 flex flex-col lg:flex-row lg:gap-4 items-start justify-center px-4 md:px-[16vw] lg:px-24 xl:px-36 flex-1'>
        <div className='w-full lg:w-[380px] lg:max-w-[380px]'>
        <SimulationForm
          venue={selectedVenue}
          instruments={instruments}
          isLoadingInstruments={isLoadingInstruments}
          selectedInstrumentId={selectedInstrumentId}
          onVenueChange={handleVenueChange}
          onInstrumentChange={handleInstrumentChange}
          onSimulate={handleSimulate}
          onClose={handleCloseSimulation}
        />
        
        </div>
        <div className='flex flex-col w-full lg:flex-1'>

          <div className='flex flex-col xl:flex-row w-full'>
          {simulatedOrder && (
          <OrderImpactAnalysis
            simulatedOrder={simulatedOrder}
            orderbookData={orderbookData}
            venue={selectedVenue}
          />
        )}
        <DepthChart 
            venue={selectedVenue}
            instrumentId={selectedInstrumentId}
          />
          </div>
          <Orderbook 
            venue={selectedVenue}
            instrument={selectedInstrument}
            simulatedOrder={simulatedOrder}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Page;