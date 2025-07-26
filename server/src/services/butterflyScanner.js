/**
 * Real Butterfly Pattern Scanner Service
 * Continuously scans market data for Butterfly harmonic patterns
 */

const PatternDetector = require('./patternDetector');
const MarketDataService = require('./marketDataService');

class ButterflyPatternScanner {
  constructor(io) {
    this.io = io;
    this.patternDetector = new PatternDetector({
      tolerance: 0.03, // 3% tolerance for more accurate detection
      minBars: 50,
      maxBars: 200
    });
    this.marketDataService = new MarketDataService();
    this.isScanning = false;
    this.scanInterval = null;
    this.detectedPatterns = new Map();
    
    console.log('🦋 Butterfly Pattern Scanner initialized');
  }

  /**
   * Initialize the scanner
   */
  async initialize() {
    try {
      await this.marketDataService.initialize();
      console.log('✅ Market data service ready');
      console.log('🔍 Real Butterfly pattern detection active');
    } catch (error) {
      console.error('❌ Failed to initialize Butterfly scanner:', error);
      throw error;
    }
  }

  /**
   * Start scanning for Butterfly patterns
   */
  async startScanning() {
    if (this.isScanning) {
      console.log('⚠️ Scanner already running');
      return;
    }

    this.isScanning = true;
    console.log('🚀 Starting real Butterfly pattern scanning...');

    // Scan every 5 seconds (configurable)
    this.scanInterval = setInterval(async () => {
      await this.scanAllSymbols();
    }, 5000);

    // Initial scan
    await this.scanAllSymbols();
  }

  /**
   * Stop scanning
   */
  stopScanning() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    this.isScanning = false;
    console.log('⏹️ Butterfly pattern scanning stopped');
  }

  /**
   * Scan all symbols for Butterfly patterns
   */
  async scanAllSymbols() {
    const symbols = this.marketDataService.getAvailableSymbols();
    const timeframes = this.marketDataService.getAvailableTimeframes();

    for (const symbol of symbols) {
      for (const timeframe of timeframes) {
        try {
          await this.scanSymbolTimeframe(symbol, timeframe);
        } catch (error) {
          console.error(`❌ Error scanning ${symbol} ${timeframe}:`, error.message);
        }
      }
    }
  }

  /**
   * Scan specific symbol and timeframe for Butterfly patterns
   */
  async scanSymbolTimeframe(symbol, timeframe) {
    try {
      // Get historical data
      const historicalData = await this.marketDataService.getHistoricalData(symbol, timeframe, 200);
      
      if (!historicalData || historicalData.length < 50) {
        return;
      }

      // Detect Butterfly patterns only
      const butterflyPatterns = this.patternDetector.detectButterflyPatterns(historicalData, {
        symbol,
        timeframe
      });

      // Process detected patterns
      for (const pattern of butterflyPatterns) {
        await this.processDetectedPattern(pattern, symbol, timeframe);
      }

    } catch (error) {
      console.error(`Error scanning ${symbol} ${timeframe}:`, error);
    }
  }

  /**
   * Process a newly detected pattern
   */
  async processDetectedPattern(pattern, symbol, timeframe) {
    const patternKey = `${pattern.type}_${pattern.direction}_${symbol}_${timeframe}_${pattern.points.D.timestamp}`;
    
    // Check if we've already detected this pattern
    if (this.detectedPatterns.has(patternKey)) {
      return;
    }

    // Add metadata
    pattern.id = patternKey;
    pattern.symbol = symbol;
    pattern.timeframe = timeframe;
    pattern.detectedAt = new Date().toISOString();
    pattern.status = pattern.completed ? 'completed' : 'forming';

    // Calculate trading signals based on documentation
    pattern.tradingSignal = this.generateTradingSignal(pattern);

    // Store pattern
    this.detectedPatterns.set(patternKey, pattern);

    // Log detection
    console.log(`🦋 New ${pattern.direction} Butterfly detected: ${symbol} ${timeframe}`);
    console.log(`   Entry: ${pattern.entry.toFixed(5)}`);
    console.log(`   Target 1: ${pattern.targets.target1.toFixed(5)}`);
    console.log(`   Target 2: ${pattern.targets.target2.toFixed(5)}`);
    console.log(`   Stop Loss: ${pattern.targets.stopLoss.toFixed(5)}`);
    console.log(`   Confidence: ${(pattern.confidence * 100).toFixed(1)}%`);

    // Emit to connected clients
    this.io.emit('newPattern', pattern);

    // Send notification
    this.io.emit('notification', {
      id: Date.now(),
      type: 'pattern',
      title: 'New Butterfly Pattern',
      message: `${pattern.direction.toUpperCase()} Butterfly detected on ${symbol} (${timeframe})`,
      pattern: pattern,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Generate trading signal based on documentation rules
   */
  generateTradingSignal(pattern) {
    const signal = {
      action: pattern.direction === 'bullish' ? 'BUY' : 'SELL',
      entry: pattern.entry,
      stopLoss: pattern.targets.stopLoss,
      targets: [pattern.targets.target1, pattern.targets.target2],
      riskReward: this.calculateRiskReward(pattern),
      confidence: pattern.confidence
    };

    // Add entry recommendations based on documentation
    if (pattern.direction === 'bullish') {
      signal.entryZone = {
        primary: pattern.entry, // 1.272 extension
        maximum: pattern.points.X.price - (Math.abs(pattern.points.A.price - pattern.points.X.price) * 1.618)
      };
      signal.recommendation = `Enter BUY at ${signal.entry.toFixed(5)} (1.272 Fib extension)`;
    } else {
      signal.entryZone = {
        primary: pattern.entry, // 1.272 extension  
        maximum: pattern.points.X.price + (Math.abs(pattern.points.A.price - pattern.points.X.price) * 1.618)
      };
      signal.recommendation = `Enter SELL at ${signal.entry.toFixed(5)} (1.272 Fib extension)`;
    }

    return signal;
  }

  /**
   * Calculate risk-reward ratio
   */
  calculateRiskReward(pattern) {
    const entryPrice = pattern.entry;
    const stopLoss = pattern.targets.stopLoss;
    const target1 = pattern.targets.target1;
    
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(target1 - entryPrice);
    
    return reward / risk;
  }

  /**
   * Get all detected patterns
   */
  getAllPatterns() {
    return Array.from(this.detectedPatterns.values()).sort((a, b) => 
      new Date(b.detectedAt) - new Date(a.detectedAt)
    );
  }

  /**
   * Get patterns for specific symbol
   */
  getPatternsForSymbol(symbol) {
    return this.getAllPatterns().filter(pattern => pattern.symbol === symbol);
  }

  /**
   * Clear old patterns (keep last 100)
   */
  cleanupOldPatterns() {
    const patterns = this.getAllPatterns();
    if (patterns.length > 100) {
      const toRemove = patterns.slice(100);
      toRemove.forEach(pattern => {
        this.detectedPatterns.delete(pattern.id);
      });
    }
  }
}

module.exports = ButterflyPatternScanner;
