// Clean TradingView Datafeed API implementation for harmonic pattern scanner
(function() {
  'use strict';

  // Ensure we don't redeclare if already exists
  if (window.HarmonicDatafeed) {
    console.log('HarmonicDatafeed already exists, skipping redeclaration');
    return;
  }

  class HarmonicDatafeed {
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
      
      console.log('HarmonicDatafeed initialized');
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
      
      // Mock symbol info
      const symbolInfo = {
        name: symbolName,
        ticker: symbolName,
        description: this.getSymbolDescription(symbolName),
        type: 'forex',
        session: '24x7',
        timezone: 'Etc/UTC',
        exchange: 'Forex',
        minmov: 1,
        pricescale: 100000,
        has_intraday: true,
        intraday_multipliers: ['1', '5', '15', '30', '60', '240'],
        supported_resolutions: this._configuration.supported_resolutions,
        volume_precision: 8,
        data_status: 'streaming'
      };
      
      setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0);
    }

    getBars(symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) {
      console.log('[getBars]: Method call', symbolInfo.name, resolution, periodParams);
      
      try {
        // Generate mock historical data
        const bars = this.generateMockBars(symbolInfo.name, resolution, periodParams);
        
        setTimeout(() => {
          onHistoryCallback(bars, { noData: bars.length === 0 });
        }, 100);
      } catch (error) {
        console.error('[getBars]: Error', error);
        onErrorCallback('Failed to get bars');
      }
    }

    subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) {
      console.log('[subscribeBars]: Method call with subscriberUID:', subscriberUID);
      
      // Store the subscription for real-time updates
      this._subscriptions = this._subscriptions || new Map();
      this._subscriptions.set(subscriberUID, {
        symbolInfo,
        resolution,
        callback: onRealtimeCallback
      });

      // Simulate real-time updates
      const updateInterval = setInterval(() => {
        const lastBar = this.getLastBar(symbolInfo.name);
        if (lastBar && onRealtimeCallback) {
          // Update the last bar with small price changes
          const change = (Math.random() - 0.5) * 0.001;
          const updatedBar = {
            ...lastBar,
            close: lastBar.close + change,
            high: Math.max(lastBar.high, lastBar.close + change),
            low: Math.min(lastBar.low, lastBar.close + change),
            time: Date.now()
          };
          
          onRealtimeCallback(updatedBar);
        }
      }, 5000); // Update every 5 seconds

      // Store interval for cleanup
      if (!this._intervals) this._intervals = new Map();
      this._intervals.set(subscriberUID, updateInterval);
    }

    unsubscribeBars(subscriberUID) {
      console.log('[unsubscribeBars]: Method call with subscriberUID:', subscriberUID);
      
      if (this._subscriptions) {
        this._subscriptions.delete(subscriberUID);
      }
      
      if (this._intervals && this._intervals.has(subscriberUID)) {
        clearInterval(this._intervals.get(subscriberUID));
        this._intervals.delete(subscriberUID);
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
      
      const interval = this.getIntervalInMinutes(resolution) * 60 * 1000; // Convert to milliseconds
      const basePrice = this.getBasePrice(symbol);
      let currentPrice = basePrice;
      let currentTime = from * 1000; // Convert to milliseconds
      
      while (currentTime < to * 1000 && bars.length < (countBack || 300)) {
        const open = currentPrice;
        const change = (Math.random() - 0.5) * 0.002; // Random change up to 0.2%
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * 0.0005;
        const low = Math.min(open, close) - Math.random() * 0.0005;
        const volume = Math.floor(Math.random() * 1000) + 100;
        
        bars.push({
          time: currentTime,
          open: parseFloat(open.toFixed(5)),
          high: parseFloat(high.toFixed(5)),
          low: parseFloat(low.toFixed(5)),
          close: parseFloat(close.toFixed(5)),
          volume: volume
        });
        
        currentPrice = close;
        currentTime += interval;
      }
      
      return bars;
    }

    getLastBar(symbol) {
      const basePrice = this.getBasePrice(symbol);
      const now = Date.now();
      return {
        time: now,
        open: basePrice,
        high: basePrice + 0.001,
        low: basePrice - 0.001,
        close: basePrice + (Math.random() - 0.5) * 0.001,
        volume: 1000
      };
    }

    getBasePrice(symbol) {
      const basePrices = {
        'EURUSD': 1.0850,
        'GBPUSD': 1.2750,
        'USDJPY': 148.50,
        'AUDUSD': 0.6650,
        'USDCAD': 1.3550,
        'NZDUSD': 0.6150
      };
      return basePrices[symbol] || 1.0000;
    }

    getIntervalInMinutes(resolution) {
      const intervals = {
        '1': 1,
        '5': 5,
        '15': 15,
        '30': 30,
        '60': 60,
        '240': 240,
        '1D': 1440
      };
      return intervals[resolution] || 60;
    }
  }

  // Export for use in the Chart component
  window.HarmonicDatafeed = HarmonicDatafeed;
  
  console.log('HarmonicDatafeed class loaded successfully');
})();
