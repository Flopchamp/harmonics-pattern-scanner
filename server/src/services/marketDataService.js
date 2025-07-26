/**
 * Market Data Service
 * Provides real-time forex market data for pattern detection
 */

class MarketDataService {
  constructor() {
    this.symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD'];
    this.timeframes = ['5M', '15M', '1H', '4H', '1D'];
    this.historicalData = new Map();
    
    // Check if simulation mode is enabled
    this.isSimulation = process.env.USE_SIMULATION_DATA === 'true' || 
                       process.env.DATA_PROVIDER === 'simulation' ||
                       !process.env.MARKET_DATA_API_KEY ||
                       process.env.MARKET_DATA_API_KEY === 'your_api_key_here';
    
    this.apiKey = process.env.MARKET_DATA_API_KEY;
    this.dataProvider = process.env.DATA_PROVIDER || 'simulation';
    
    console.log(`📊 Market Data Service - Mode: ${this.isSimulation ? 'Simulation' : 'Real'}`);
  }

  /**
   * Initialize market data service
   */
  async initialize() {
    console.log('📊 Market Data Service initialized');
    
    // Generate initial historical data for all symbols
    for (const symbol of this.symbols) {
      for (const timeframe of this.timeframes) {
        const key = `${symbol}_${timeframe}`;
        this.historicalData.set(key, this.generateRealisticForexData(symbol, timeframe));
      }
    }
  }

  /**
   * Generate realistic forex market data for pattern detection
   */
  generateRealisticForexData(symbol, timeframe, bars = 500) {
    const data = [];
    const now = new Date();
    const msPerBar = this.getMillisecondsPerBar(timeframe);
    
    // Base prices for different forex pairs
    const basePrices = {
      'EURUSD': 1.0850,
      'GBPUSD': 1.2750,
      'USDJPY': 148.50,
      'AUDUSD': 0.6650,
      'USDCAD': 1.3550,
      'NZDUSD': 0.6150
    };
    
    let currentPrice = basePrices[symbol] || 1.0000;
    
    for (let i = bars - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * msPerBar));
      
      // Create realistic price movement with trends and reversals
      const volatility = this.getSymbolVolatility(symbol);
      const trendFactor = Math.sin(i / 50) * 0.3; // Long-term trend
      const noiseFactor = (Math.random() - 0.5) * volatility; // Random noise
      
      // Calculate price change
      const priceChange = (trendFactor + noiseFactor) * currentPrice * 0.01;
      currentPrice += priceChange;
      
      // Generate OHLC data
      const open = currentPrice;
      const volatilityRange = currentPrice * volatility * 0.005;
      
      const high = open + (Math.random() * volatilityRange);
      const low = open - (Math.random() * volatilityRange);
      const close = low + (Math.random() * (high - low));
      
      // Update current price for next iteration
      currentPrice = close;
      
      data.push({
        timestamp: timestamp.toISOString(),
        open: Number(open.toFixed(5)),
        high: Number(high.toFixed(5)),
        low: Number(low.toFixed(5)),
        close: Number(close.toFixed(5)),
        volume: Math.floor(Math.random() * 1000000) + 100000
      });
    }
    
    return data.reverse(); // Reverse to get chronological order
  }

  /**
   * Get milliseconds per bar based on timeframe
   */
  getMillisecondsPerBar(timeframe) {
    const timeframes = {
      '5M': 5 * 60 * 1000,
      '15M': 15 * 60 * 1000,
      '1H': 60 * 60 * 1000,
      '4H': 4 * 60 * 60 * 1000,
      '1D': 24 * 60 * 60 * 1000
    };
    
    return timeframes[timeframe] || timeframes['1H'];
  }

  /**
   * Get symbol volatility factor
   */
  getSymbolVolatility(symbol) {
    const volatilities = {
      'EURUSD': 0.8,
      'GBPUSD': 1.2,
      'USDJPY': 1.0,
      'AUDUSD': 1.1,
      'USDCAD': 0.9,
      'NZDUSD': 1.3
    };
    
    return volatilities[symbol] || 1.0;
  }

  /**
   * Get historical data for a symbol and timeframe
   */
  async getHistoricalData(symbol, timeframe, limit = 500) {
    const key = `${symbol}_${timeframe}`;
    
    if (this.isSimulation) {
      // Use simulated data for testing
      let data = this.historicalData.get(key);
      if (!data) {
        data = this.generateRealisticForexData(symbol, timeframe, limit);
        this.historicalData.set(key, data);
      }
      return data.slice(-limit);
    }
    
    try {
      // Attempt to fetch real market data
      if (!this.isSimulation) {
        console.log(`📡 Attempting to fetch real data for ${symbol} (${timeframe})`);
        const realData = await this.fetchRealMarketData(symbol, timeframe, limit);
        if (realData && realData.length > 0) {
          console.log(`✅ Real data fetched for ${symbol}: ${realData.length} candles`);
          this.historicalData.set(key, realData);
          return realData;
        }
      } else {
        console.log(`📊 Using simulation mode for ${symbol} (${timeframe})`);
      }
    } catch (error) {
      if (!this.isSimulation) {
        console.log(`❌ Failed to fetch real data for ${symbol}: ${error.message}. Falling back to simulation.`);
      }
    }
    
    // Fallback to simulated data
    let data = this.historicalData.get(key);
    if (!data) {
      data = this.generateRealisticForexData(symbol, timeframe, limit);
      this.historicalData.set(key, data);
    }
    return data.slice(-limit);
  }

  /**
   * Fetch real market data from external API
   */
  async fetchRealMarketData(symbol, timeframe, limit = 500) {
    if (!this.apiKey || this.apiKey === 'your_api_key_here') {
      throw new Error('Valid API key not configured');
    }

    switch (this.dataProvider) {
      case 'alpha_vantage':
        return await this.fetchFromAlphaVantage(symbol, timeframe, limit);
      case 'fxapi':
        return await this.fetchFromFXAPI(symbol, timeframe, limit);
      case 'polygon':
        return await this.fetchFromPolygon(symbol, timeframe, limit);
      default:
        throw new Error(`Unsupported data provider: ${this.dataProvider}`);
    }
  }

  /**
   * Fetch data from Alpha Vantage API
   */
  async fetchFromAlphaVantage(symbol, timeframe, limit) {
    const axios = require('axios');
    const interval = this.convertTimeframeToAlphaVantage(timeframe);
    
    const url = `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=${symbol.slice(0,3)}&to_symbol=${symbol.slice(3)}&interval=${interval}&apikey=${this.apiKey}&outputsize=full`;
    
    const response = await axios.get(url);
    const data = response.data;
    
    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }
    
    const timeSeries = data[`Time Series FX (${interval})`];
    if (!timeSeries) {
      throw new Error('No time series data found');
    }
    
    const bars = [];
    const timestamps = Object.keys(timeSeries).sort().slice(-limit);
    
    timestamps.forEach(timestamp => {
      const bar = timeSeries[timestamp];
      bars.push({
        timestamp: new Date(timestamp).toISOString(),
        open: parseFloat(bar['1. open']),
        high: parseFloat(bar['2. high']),
        low: parseFloat(bar['3. low']),
        close: parseFloat(bar['4. close']),
        volume: 100000 // Alpha Vantage doesn't provide forex volume
      });
    });
    
    return bars;
  }

  /**
   * Fetch data from FXAPI (alternative provider)
   */
  async fetchFromFXAPI(symbol, timeframe, limit) {
    const axios = require('axios');
    
    // This is a placeholder - implement based on your chosen FX API provider
    // Examples: Oanda, FXCM, FxMarketAPI, etc.
    throw new Error('FXAPI provider not implemented yet');
  }

  /**
   * Fetch data from Polygon.io
   */
  async fetchFromPolygon(symbol, timeframe, limit) {
    const axios = require('axios');
    
    // Format symbol for Polygon (e.g., C:EURUSD)
    const polygonSymbol = `C:${symbol}`;
    const multiplier = this.getPolygonMultiplier(timeframe);
    const timespan = this.getPolygonTimespan(timeframe);
    
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - (limit * this.getMillisecondsPerBar(timeframe))).toISOString().split('T')[0];
    
    const url = `https://api.polygon.io/v2/aggs/ticker/${polygonSymbol}/range/${multiplier}/${timespan}/${startDate}/${endDate}?adjusted=true&sort=asc&limit=${limit}&apikey=${this.apiKey}`;
    
    const response = await axios.get(url);
    const data = response.data;
    
    if (data.status !== 'OK') {
      throw new Error(data.error || 'Polygon API error');
    }
    
    const bars = data.results.map(bar => ({
      timestamp: new Date(bar.t).toISOString(),
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v || 100000
    }));
    
    return bars;
  }

  /**
   * Convert timeframe to Alpha Vantage format
   */
  convertTimeframeToAlphaVantage(timeframe) {
    const mapping = {
      '5M': '5min',
      '15M': '15min',
      '1H': '60min',
      '4H': '60min', // Will need to aggregate 4 bars
      '1D': 'daily'
    };
    return mapping[timeframe] || '60min';
  }

  /**
   * Get Polygon multiplier for timeframe
   */
  getPolygonMultiplier(timeframe) {
    const mapping = {
      '5M': 5,
      '15M': 15,
      '1H': 1,
      '4H': 4,
      '1D': 1
    };
    return mapping[timeframe] || 1;
  }

  /**
   * Get Polygon timespan for timeframe
   */
  getPolygonTimespan(timeframe) {
    const mapping = {
      '5M': 'minute',
      '15M': 'minute',
      '1H': 'hour',
      '4H': 'hour',
      '1D': 'day'
    };
    return mapping[timeframe] || 'hour';
  }

  /**
   * Get real-time price data
   */
  async getRealTimeData(symbol) {
    if (this.isSimulation) {
      // Generate simulated real-time update
      const key = `${symbol}_1M`;
      const historicalData = this.historicalData.get(`${symbol}_1H`) || [];
      
      if (historicalData.length === 0) {
        return null;
      }
      
      // Get latest price and simulate small movements
      const lastCandle = historicalData[historicalData.length - 1];
      const volatility = this.getSymbolVolatility(symbol);
      const priceChange = (Math.random() - 0.5) * lastCandle.close * volatility * 0.001;
      
      return {
        symbol,
        bid: Number((lastCandle.close + priceChange).toFixed(5)),
        ask: Number((lastCandle.close + priceChange + 0.0001).toFixed(5)),
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      // Fetch real-time data from API
      return await this.fetchRealTimePrice(symbol);
    } catch (error) {
      console.warn(`Failed to fetch real-time data for ${symbol}: ${error.message}`);
      return null;
    }
  }

  /**
   * Fetch real-time price from external API
   */
  async fetchRealTimePrice(symbol) {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    switch (this.dataProvider) {
      case 'alpha_vantage':
        return await this.fetchRealTimePriceAlphaVantage(symbol);
      case 'polygon':
        return await this.fetchRealTimePricePolygon(symbol);
      default:
        throw new Error(`Real-time data not implemented for ${this.dataProvider}`);
    }
  }

  /**
   * Fetch real-time price from Alpha Vantage
   */
  async fetchRealTimePriceAlphaVantage(symbol) {
    const axios = require('axios');
    const fromSymbol = symbol.slice(0, 3);
    const toSymbol = symbol.slice(3);
    
    const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromSymbol}&to_currency=${toSymbol}&apikey=${this.apiKey}`;
    
    const response = await axios.get(url);
    const data = response.data;
    
    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }
    
    const exchangeRate = data['Realtime Currency Exchange Rate'];
    if (!exchangeRate) {
      throw new Error('No exchange rate data found');
    }
    
    return {
      symbol,
      bid: parseFloat(exchangeRate['5. Exchange Rate']),
      ask: parseFloat(exchangeRate['5. Exchange Rate']) + 0.0001,
      timestamp: exchangeRate['6. Last Refreshed']
    };
  }

  /**
   * Fetch real-time price from Polygon
   */
  async fetchRealTimePricePolygon(symbol) {
    const axios = require('axios');
    const polygonSymbol = `C:${symbol}`;
    
    const url = `https://api.polygon.io/v1/last/currencies/${polygonSymbol}?apikey=${this.apiKey}`;
    
    const response = await axios.get(url);
    const data = response.data;
    
    if (data.status !== 'success') {
      throw new Error(data.error || 'Polygon real-time API error');
    }
    
    return {
      symbol,
      bid: data.last.exchange_rate,
      ask: data.last.exchange_rate + 0.0001,
      timestamp: new Date(data.last.timestamp).toISOString()
    };
  }

  /**
   * Update historical data with new bar (simulated real-time updates)
   */
  updateHistoricalData(symbol, timeframe, newBar) {
    const key = `${symbol}_${timeframe}`;
    const data = this.historicalData.get(key);
    
    if (data) {
      data.push(newBar);
      
      // Keep only last 1000 bars to prevent memory issues
      if (data.length > 1000) {
        data.shift();
      }
      
      this.historicalData.set(key, data);
    }
  }

  /**
   * Simulate real-time market updates
   */
  startRealTimeUpdates(callback) {
    setInterval(async () => {
      for (const symbol of this.symbols) {
        const realtimeData = await this.getRealTimeData(symbol);
        if (callback && realtimeData) {
          callback(realtimeData);
        }
      }
    }, 5000); // Update every 5 seconds
  }

  /**
   * Get all available symbols
   */
  getAvailableSymbols() {
    return this.symbols;
  }

  /**
   * Get all available timeframes
   */
  getAvailableTimeframes() {
    return this.timeframes;
  }
}

module.exports = MarketDataService;
