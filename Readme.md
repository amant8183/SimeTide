# SimeTide - Real-Time Orderbook Viewer with Order Simulation

A Next.js application that visualizes orderbooks from OKX, Bybit, and Deribit. It simulates order placement to show market impact and optimal timing.

## 🚀 Key Features

- **Multi-Exchange Support**: Real-time data from OKX, Bybit, and Deribit
- **Order Simulation**: Test trading strategies with realistic market impact analysis
- **Live Orderbook Visualization**: Real-time depth charts and orderbook data
- **Responsive Design**: Seamless experience across all devices
- **WebSocket Integration**: Live data streaming with auto-reconnection

## 🛠 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd go_quant
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the development server:**
```bash
npm run dev
```

4. **Open your browser:**
```
http://localhost:3000
```

## 📊 Supported Exchanges

| Exchange | Asset Types | Price Precision | Special Features |
|----------|-------------|-----------------|------------------|
| **OKX** | Spot pairs | $0.10 increments | Satoshi precision |
| **Bybit** | Spot + Derivatives | $0.10 increments | High liquidity pairs |
| **Deribit** | BTC/ETH Futures | $0.50 increments | Options + Perpetuals |

## 🎯 Core Functionality

### Order Simulation
- **Market Orders**: Real-time execution simulation
- **Limit Orders**: Price impact analysis
- **Order Impact Analysis**: Detailed breakdown of execution costs
- **Fill Percentage**: Realistic order completion estimates

### Real-time Data
- **Live Orderbooks**: WebSocket connections to all exchanges
- **Market Depth Charts**: Visual representation of liquidity
- **Connection Status**: Real-time monitoring with auto-reconnection
- **Exchange Switching**: Seamless venue selection

## 🏗 Architecture

### Tech Stack
- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Data**: WebSocket connections, REST APIs
- **Charts**: Recharts for market depth visualization

### Key Components
- `SimulationForm`: Order entry and configuration
- `Orderbook`: Real-time orderbook display
- `DepthChart`: Market depth visualization
- `OrderImpactAnalysis`: Execution analysis
- `Navbar`: Exchange and instrument selection




## 📈 Data Flow

```
User Input → Order Simulation → Market Impact Analysis → Real-time Display
     ↓              ↓                    ↓                    ↓
Exchange APIs → WebSocket Data → Orderbook Processing → UI Updates
```

## 🎨 UI/UX Features

### Design System
- **Dark Theme**: Professional trading interface
- **Color Coding**: Exchange-specific indicators
- **Responsive Layout**: Mobile-first design
- **Real-time Indicators**: Connection status and live data

### Interactive Elements
- **Exchange Selector**: Switch between OKX, Bybit, Deribit
- **Instrument Dropdown**: Real instrument specifications
- **Order Type Toggle**: Market vs Limit orders
- **Side Selection**: Buy/Sell with visual indicators



## 📚 API Documentation

- **OKX**: [Public API Docs](https://www.okx.com/docs-v5/en/#public-data-rest-api)
- **Bybit**: [Market Data API](https://bybit-exchange.github.io/docs/v5/market/instrument)
- **Deribit**: [Public API Docs](https://docs.deribit.com/#public-get_instruments)



---

**Built using Next.js, TypeScript, and Tailwind CSS**