"use client";
import React from 'react';
import Image from 'next/image';

const LandingPage = () => {
  const exchanges = [
    {
      name: "OKX", 
      color: "text-status-positive",
      bgColor: "bg-status-positive/20",
      borderColor: "border-status-positive",
      features: ["Spot Pairs", "Satoshi Precision", "847+ Instruments"],
      precision: "$0.10 increments"
    },
    {
      name: "Bybit", 
      color: "text-orange-400",
      bgColor: "bg-orange-400/20",
      borderColor: "border-orange-400",
      features: ["High Liquidity", "Micro-BTC", "423+ Instruments"],
      precision: "0.000001 BTC min"
    },
    {
      name: "Deribit",
      color: "text-blue-400", 
      bgColor: "bg-blue-400/20",
      borderColor: "border-blue-400",
      features: ["Futures/Options", "USD Pairs", "156+ Instruments"],
      precision: "$0.50 increments"
    }
  ];



  return (
    <div className="min-h-screen bg-black/5 gridbg">
      <div className="relative min-h-screen">
        <section className="relative pt-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="flex justify-center mb-8">
                <Image
                  src="/logo.png"
                  alt="Go Quant"
                  width={200}
                  height={50}
                  priority
                  className="h-12 w-auto"
                />
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-txtPrimary mb-6">
                Real-Time Orderbook Viewer with
                <span className="block">
                  <span className="bg-gradient-to-r from-status-positive via-txtOnAccent to-accent-primary bg-clip-text text-transparent">
                    Order Simulation
                  </span>
                </span>
              </h1>
              
              <p className="text-xl text-txtSecondary max-w-3xl mx-auto mb-8">
                A Next.js application that visualizes orderbooks from OKX, Bybit, and Deribit. It simulates order placement to show market impact and optimal timing.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                             <button 
                 onClick={() => {
                   const orderbookSection = document.getElementById('orderbook-section');
                   if (orderbookSection) {
                     orderbookSection.scrollIntoView({ 
                       behavior: 'smooth',
                       block: 'start'
                     });
                   }
                 }}
                 className="btnGradient text-black font-bold py-4 px-8 rounded-lg text-lg hover:opacity-90 transition-opacity inline-block"
               >
                 Launch Application
               </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
              {exchanges.map((exchange) => (
                <div
                  key={exchange.name}
                  className={`innerContainer bg-bgPanel p-6 border-l-4 ${exchange.borderColor} ${exchange.bgColor}`}
                >
                  <div className="flex items-center mb-4">
                    <h3 className={`text-2xl font-bold ${exchange.color}`}>
                      {exchange.name}
                    </h3>
                  </div>
                  
                  <div className="space-y-3">
                    {exchange.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-txtSecondary">
                        <div className="w-2 h-2 bg-txtOnAccent rounded-full mr-3"></div>
                        {feature}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border-primary">
                    <p className="text-sm text-txtSecondary">
                      <span className="font-semibold">Precision:</span> {exchange.precision}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>
      </div>
    </div>
  );
};

export default LandingPage;