// TradingView Datafeed API implementation for harmonic pattern scanner
class Datafeed {
  constructor(backendUrl = 'http://localhost:5000/api') {
    this.backendUrl = backendUrl;
    this._configuration = {
      supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D'],
      exchanges: [
        {
          value: 'Forex',
          name: 'Forex',
          desc: 'Foreign Exchange Market'
        }
      ],
      symbols_types: [
        {
          name: 'forex',
          value: 'forex'
        }
      ],
      supports_marks: false,
      supports_timescale_marks: false,
      supports_time: true
    };
  }

  onReady(callback) {
    console.log('[onReady]: Method call');
    setTimeout(() => callback(this._configuration));
  }

  searchSymbols(userInput, exchange, symbolType, callback) {
    console.log('[searchSymbols]: Method call');
    // Mock search results for forex pairs
    const symbols = [
      { symbol: 'EURUSD', full_name: 'EUR/USD', description: 'Euro vs US Dollar', exchange: 'Forex', type: 'forex' },
      { symbol: 'GBPUSD', full_name: 'GBP/USD', description: 'British Pound vs US Dollar', exchange: 'Forex', type: 'forex' },
      { symbol: 'USDJPY', full_name: 'USD/JPY', description: 'US Dollar vs Japanese Yen', exchange: 'Forex', type: 'forex' },
      { symbol: 'AUDUSD', full_name: 'AUD/USD', description: 'Australian Dollar vs US Dollar', exchange: 'Forex', type: 'forex' },
      { symbol: 'USDCAD', full_name: 'USD/CAD', description: 'US Dollar vs Canadian Dollar', exchange: 'Forex', type: 'forex' },
      { symbol: 'NZDUSD', full_name: 'NZD/USD', description: 'New Zealand Dollar vs US Dollar', exchange: 'Forex', type: 'forex' }
    ];
    
    const filteredSymbols = symbols.filter(s => 
      s.symbol.toLowerCase().includes(userInput.toLowerCase()) ||
      s.description.toLowerCase().includes(userInput.toLowerCase())
    );
    
    callback(filteredSymbols);
  }

  resolveSymbol(symbolName, onSymbolResolvedCallback, onResolveErrorCallback) {
    console.log('[resolveSymbol]: Method call', symbolName);
    
    const symbolInfo = {
      name: symbolName,
      description: this.getSymbolDescription(symbolName),
      type: 'forex',
      session: '24x7',
      timezone: 'Etc/UTC',
      ticker: symbolName,
      exchange: 'Forex',
      minmov: 1,
      pricescale: 100000,
      has_intraday: true,
      has_no_volume: false,
      has_weekly_and_monthly: true,
      supported_resolutions: this._configuration.supported_resolutions,
      volume_precision: 2,
      data_status: 'streaming'
    };

    setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0);
  }

  getBars(symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) {
    console.log('[getBars]: Method call', symbolInfo, resolution, periodParams);
    
    // Generate mock historical data
    const bars = this.generateMockBars(symbolInfo.name, resolution, periodParams);
    
    setTimeout(() => {
      onHistoryCallback(bars, { noData: bars.length === 0 });
    }, 100);
  }

  subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) {
    console.log('[subscribeBars]: Method call with subscriberUID:', subscriberUID);
    
    // Simulate real-time data updates
    this._realtimeSubscription = setInterval(() => {
      const lastBar = this.getLastBar(symbolInfo.name);
      if (lastBar) {
        // Update the last bar with new tick data
        const updatedBar = {
          ...lastBar,
          close: lastBar.close + (Math.random() - 0.5) * 0.001,
          high: Math.max(lastBar.high, lastBar.close + Math.random() * 0.0005),
          low: Math.min(lastBar.low, lastBar.close - Math.random() * 0.0005),
          volume: lastBar.volume + Math.random() * 1000
        };
        onRealtimeCallback(updatedBar);
      }
    }, 1000);
  }

  unsubscribeBars(subscriberUID) {
    console.log('[unsubscribeBars]: Method call with subscriberUID:', subscriberUID);
    if (this._realtimeSubscription) {
      clearInterval(this._realtimeSubscription);
      this._realtimeSubscription = null;
    }
  }

  // Helper methods
  getSymbolDescription(symbol) {
    const descriptions = {
      'EURUSD': 'Euro vs US Dollar',
      'GBPUSD': 'British Pound vs US Dollar',
      'USDJPY': 'US Dollar vs Japanese Yen',
      'AUDUSD': 'Australian Dollar vs US Dollar',
      'USDCAD': 'US Dollar vs Canadian Dollar',
      'NZDUSD': 'New Zealand Dollar vs US Dollar'
    };
    return descriptions[symbol] || symbol;
  }

  generateMockBars(symbol, resolution, periodParams) {
    const { from, to, countBack } = periodParams;
    const bars = [];
    const barCount = countBack || 500;
    const timeframe = this.getTimeframeInMinutes(resolution);
    
    let basePrice = this.getBasePrice(symbol);
    let currentTime = to * 1000;
    
    for (let i = barCount - 1; i >= 0; i--) {
      const barTime = Math.floor((currentTime - (i * timeframe * 60 * 1000)) / 1000);
      
      if (barTime < from) continue;
      
      const open = basePrice + (Math.random() - 0.5) * 0.01;
      const close = open + (Math.random() - 0.5) * 0.005;
      const high = Math.max(open, close) + Math.random() * 0.003;
      const low = Math.min(open, close) - Math.random() * 0.003;
      const volume = Math.random() * 10000;
      
      bars.push({
        time: barTime * 1000,
        open: Number(open.toFixed(5)),
        high: Number(high.toFixed(5)),
        low: Number(low.toFixed(5)),
        close: Number(close.toFixed(5)),
        volume: Math.floor(volume)
      });
      
      basePrice = close;
    }
    
    return bars.sort((a, b) => a.time - b.time);
  }

  getLastBar(symbol) {
    // Return the last bar for real-time updates
    const basePrice = this.getBasePrice(symbol);
    const now = Date.now();
    
    return {
      time: now,
      open: basePrice,
      high: basePrice + Math.random() * 0.002,
      low: basePrice - Math.random() * 0.002,
      close: basePrice + (Math.random() - 0.5) * 0.001,
      volume: Math.random() * 5000
    };
  }

  getBasePrice(symbol) {
    const basePrices = {
      'EURUSD': 1.0850,
      'GBPUSD': 1.2750,
      'USDJPY': 148.50,
      'AUDUSD': 0.6650,
      'USDCAD': 1.3450,
      'NZDUSD': 0.6150
    };
    return basePrices[symbol] || 1.0000;
  }

  getTimeframeInMinutes(resolution) {
    if (resolution === '1D') return 1440;
    if (resolution === '1W') return 10080;
    if (resolution === '1M') return 43200;
    return parseInt(resolution) || 60;
  }
}

// Export for use in the Chart component
window.Datafeed = Datafeed;
