"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { Venue, AnyInstrument } from '../../types/domain';
import { getInstrumentId } from '../../lib/utils';

interface NavbarProps {
  selectedVenue: Venue;
  instruments: AnyInstrument[];
  isLoadingInstruments: boolean;
  selectedInstrumentId: string | null;
  onVenueChange: (venue: Venue) => void;
  onInstrumentChange: (instrumentId: string) => void;
}

// Available trading venues
const VENUES: Venue[] = ["OKX", "Bybit", "Deribit"];

const Navbar = ({ 
  selectedVenue, 
  instruments, 
  isLoadingInstruments, 
  selectedInstrumentId, 
  onVenueChange, 
  onInstrumentChange 
}: NavbarProps) => {
  const [symbolDropdownOpen, setSymbolDropdownOpen] = useState(false);

  // Get the appropriate icon for a given symbol
  const getIconForSymbol = (symbolId: string) => {
    const asset = symbolId.split(/[-_]/)[0].toLowerCase();
    if (asset.includes('eth')) return '/eth.png';
    if (asset.includes('sol')) return '/sol.png';
    if (asset.includes('btc'))return '/btc.png';
    return '/default.png';
  };

  return (
    <header className="bg-bgMain/25 p-1 backdrop-blur-sm fixed top-0 w-full z-50 border-b-4 border-b-bgPanel shadow shadow-bginput px-24">
      <nav className="container mx-auto flex justify-between items-center py-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center space-x-2">
          <Image 
            src="/logo.png" 
            alt="Go Quant Logo" 
            width={120}
            height={30}
            priority
          />
        </Link>

        <div className="flex items-center space-x-2 bg-bgMain rounded-md">
          {VENUES.map((venue) => (
            <button
              key={venue}
              className={`navBtn w-auto text-xs sm:text-sm justify-center duration-200 ${
                selectedVenue === venue 
                  ? "btnGradient text-black shadow-md" 
                  : "bg-transparent text-txtPrimary"
              }`}
              onClick={() => onVenueChange(venue)}
            >
              {venue}
            </button>
          ))}
        </div>

        <div className="relative">
          <button
            className="navBtn bg-bgMain text-white justify-between gap-2 w-auto text-xs sm:text-sm"
            onClick={() => setSymbolDropdownOpen(!symbolDropdownOpen)}
            disabled={isLoadingInstruments}
          >
            <div className="flex items-center gap-2">
              {isLoadingInstruments ? (
                <span className="text-xs">Loading...</span>
              ) : (
                <>
                  <Image
                    src={getIconForSymbol(selectedInstrumentId || '')}
                    alt=""
                    width={24}
                    height={24}
                    className="w-4 h-auto sm:w-6 sm:h-auto"
                  />
                  <span className="text-xs sm:text-sm truncate max-w-20">
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
            <div className="absolute right-0 mt-2 w-48 bg-bgMain rounded shadow-lg z-10 border border-border-primary max-h-60 overflow-y-auto">
              {instruments.map((instrument) => {
                const id = getInstrumentId(instrument);
                return (
                  <button
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
      </nav>
    </header>
  );
};

export default Navbar;