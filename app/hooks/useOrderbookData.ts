import { useState, useEffect, useRef, useCallback } from 'react';
import { getSubscriptionMessage, getPingMessage, WEBSOCKET_URLS } from '../lib/exchange-clients';
import type { Venue, ConnectionStatus, OrderbookData, OrderbookEntry } from '../types/domain';

const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 10000;
const HEARTBEAT_INTERVAL = 25000;

const UPDATE_THROTTLE_MS = 100; // Reduced from 500ms to 100ms for faster updates
const FIXED_LEVELS = 15; // Number of levels to maintain
const SNAPSHOT_LEVELS = 50; // Process more levels in initial snapshot

interface WebSocketMessage {
  arg?: { channel?: string };
  data?: Array<{ bids?: Array<[string, string]>; asks?: Array<[string, string]> }> | { b?: Array<[string, string]>; a?: Array<[string, string]> };
  topic?: string;
  method?: string;
  params?: { data?: { bids?: Array<[string, string]>; asks?: Array<[string, string]> } };
}

function transformWebSocketMessage(message: WebSocketMessage, venue: Venue): OrderbookData | null {
  try {
    let rawBids: Array<[string, string]> = [];
    let rawAsks: Array<[string, string]> = [];
    
    if (venue === 'OKX' && message.arg?.channel === 'books' && Array.isArray(message.data) && message.data[0]) {
      rawBids = message.data[0].bids || [];
      rawAsks = message.data[0].asks || [];
    } else if (venue === 'Bybit' && message.topic?.includes('orderbook') && message.data && !Array.isArray(message.data)) {
      rawBids = message.data.b || [];
      rawAsks = message.data.a || [];
    } else if (venue === 'Deribit' && message.method === 'subscription' && message.params?.data) {
      rawBids = message.params.data.bids || [];
      rawAsks = message.params.data.asks || [];
    }
    
    if (rawBids.length === 0 || rawAsks.length === 0) return null;
    
    // Process more levels for better initial snapshot
    const levelsToProcess = Math.max(rawBids.length, rawAsks.length, SNAPSHOT_LEVELS);
    
    let total = 0;
    const bids = rawBids.slice(0, levelsToProcess).map(entry => {
        const price = parseFloat(entry[0]);
        const amount = parseFloat(entry[1]);
        total += amount;
        return { price, amount, total };
    });
    
    total = 0;
    const asks = rawAsks.slice(0, levelsToProcess).map(entry => {
        const price = parseFloat(entry[0]);
        const amount = parseFloat(entry[1]);
        total += amount;
        return { price, amount, total };
    });
    
    if (bids.length > 0 && asks.length > 0) {
      const spread = asks[0].price - bids[0].price;
      const lastPrice = (bids[0].price + asks[0].price) / 2;
      return { bids, asks, spread, lastPrice };
    }
    return null;
  } catch {
    return null;
  }
}

export const useOrderbookData = (venue: Venue, instrumentId: string | null) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [orderbookData, setOrderbookData] = useState<OrderbookData | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const timers = useRef<NodeJS.Timeout[]>([]);
  const isMountedRef = useRef(true);
  
  // Refs to store the best bids and asks we've seen so far
  const bestBidsRef = useRef<OrderbookEntry[]>([]);
  const bestAsksRef = useRef<OrderbookEntry[]>([]);
  
  // Refs for throttling updates
  const lastUpdateTimeRef = useRef(0);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const clearAllTimers = useCallback(() => {
    timers.current.forEach(timer => clearTimeout(timer));
    timers.current = [];
  }, []);
  
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      
      if (wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.close(1000, 'Client disconnected');
        } catch (e) {
          console.warn(`⚠️ Error closing connection to ${venue}:`, e);
        }
      }
      wsRef.current = null;
    }
    clearAllTimers();
    if (isMountedRef.current) {
      setConnectionStatus('disconnected');
      setOrderbookData(null);
    }
    // Reset stored levels when disconnecting
    bestBidsRef.current = [];
    bestAsksRef.current = [];
    lastUpdateTimeRef.current = 0;
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
  }, [clearAllTimers, venue]);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [disconnect]);
  
  // Throttled state update function
  const throttledUpdateState = useCallback(() => {
    if (!isMountedRef.current) return;
    
    const spread = bestAsksRef.current[0]?.price - bestBidsRef.current[0]?.price || 0;
    const lastPrice = (bestBidsRef.current[0]?.price + bestAsksRef.current[0]?.price) / 2 || 0;
    
    setOrderbookData({
      bids: [...bestBidsRef.current],
      asks: [...bestAsksRef.current],
      spread,
      lastPrice
    });
    
    lastUpdateTimeRef.current = Date.now();
  }, []);
  
  // Function to update the best bids and asks
  const updateBestLevels = useCallback((newBids: OrderbookEntry[], newAsks: OrderbookEntry[]) => {
    // Create a map of existing bids by price for quick lookup
    const bidsMap = new Map(bestBidsRef.current.map(bid => [bid.price, bid]));
    
    // Update existing bids and add new ones
    newBids.forEach(bid => {
      bidsMap.set(bid.price, bid);
    });
    
    // Convert back to array, sort by price (descending), and take top FIXED_LEVELS
    const updatedBids = Array.from(bidsMap.values())
      .sort((a, b) => b.price - a.price)
      .slice(0, FIXED_LEVELS);
    
    // Do the same for asks
    const asksMap = new Map(bestAsksRef.current.map(ask => [ask.price, ask]));
    
    newAsks.forEach(ask => {
      asksMap.set(ask.price, ask);
    });
    
    const updatedAsks = Array.from(asksMap.values())
      .sort((a, b) => a.price - b.price)
      .slice(0, FIXED_LEVELS);
    
    // Update the refs
    bestBidsRef.current = updatedBids;
    bestAsksRef.current = updatedAsks;
    
    // Throttle state updates
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
    
    if (timeSinceLastUpdate >= UPDATE_THROTTLE_MS) {
      throttledUpdateState();
    } else if (!updateTimeoutRef.current) {
      const delay = UPDATE_THROTTLE_MS - timeSinceLastUpdate;
      updateTimeoutRef.current = setTimeout(() => {
        throttledUpdateState();
        updateTimeoutRef.current = null;
      }, delay);
    }
  }, [throttledUpdateState]);
  
  useEffect(() => {
    if (!instrumentId) {
      disconnect();
      return;
    }
    
    let isCancelled = false;
    
    const connect = () => {
      if (isCancelled || !isMountedRef.current) return;
      
      if (wsRef.current) {
        disconnect();
      }
      
      setConnectionStatus('connecting');
      
      try {
        const ws = new WebSocket(WEBSOCKET_URLS[venue]);
        wsRef.current = ws;
        
        ws.onopen = () => {
          if (isCancelled || !isMountedRef.current) return;
          setConnectionStatus('connected');
          console.log(`✅ WebSocket connected to ${venue} for ${instrumentId}.`);
          reconnectAttempts.current = 0;
          
          try {
            ws.send(getSubscriptionMessage(venue, instrumentId));
          } catch (sendError) {
            console.warn(`⚠️ Failed to send subscription to ${venue}:`, sendError);
            ws.close();
            return;
          }
          
          const heartbeat = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              try {
                const pingMsg = getPingMessage(venue);
                if (pingMsg) ws.send(pingMsg);
              } catch (pingError) {
                console.warn(`⚠️ Failed to send ping to ${venue}:`, pingError);
              }
            }
          }, HEARTBEAT_INTERVAL);
          timers.current.push(heartbeat);
        };
        
        ws.onerror = (event) => {
          if (isCancelled || !isMountedRef.current) return;
          if (event && event.type !== 'error') {
            console.warn(`⚠️ WebSocket error on ${venue}:`, event);
          }
        };
        
        ws.onclose = (event) => {
          if (isCancelled || !isMountedRef.current) return;
          if (event.code === 1000) return;
          
          console.warn(`🔌 Connection to ${venue} closed. Code: ${event.code}, Reason: ${event.reason || 'unknown'}`);
          clearAllTimers();
          
          reconnectAttempts.current++;
          if (reconnectAttempts.current <= MAX_RECONNECT_ATTEMPTS) {
            const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, reconnectAttempts.current - 1), MAX_RETRY_DELAY);
            const reconnectTimer = setTimeout(() => {
              if (!isCancelled && isMountedRef.current) connect();
            }, delay);
            timers.current.push(reconnectTimer);
          } else {
            console.warn(`⚠️ Max reconnects for ${venue}. Stopping.`);
            if (isMountedRef.current) setConnectionStatus('error');
          }
        };
        
        ws.onmessage = (event) => {
          if (isCancelled || !isMountedRef.current) return;
          if (event.data === 'pong' || event.data.includes('pong')) return;
          
          try {
            const message = JSON.parse(event.data);
            const transformed = transformWebSocketMessage(message, venue);
            if (transformed) {
              // Update the best levels with new data
              updateBestLevels(transformed.bids, transformed.asks);
            }
          } catch (parseError) {
            console.warn(`⚠️ Failed to parse message from ${venue}:`, parseError);
          }
        };
      } catch (initialError) {
        console.error(`❌ Failed to create WebSocket for ${venue}:`, initialError);
        if (isMountedRef.current) setConnectionStatus('error');
      }
    };
    
    connect();
    
    return () => {
      isCancelled = true;
      disconnect();
    };
  }, [venue, instrumentId, disconnect, clearAllTimers, updateBestLevels]);
  
  return { connectionStatus, data: orderbookData };
};