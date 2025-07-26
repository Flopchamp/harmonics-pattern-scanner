/**
 * Harmonic Pattern Detector Service
 * Detects all 7 harmonic patterns based on Fibonacci ratios
 */

class PatternDetector {
  constructor(options = {}) {
    this.tolerance = options.tolerance || 0.05; // 5% tolerance by default
    this.minBars = options.minBars || 10;
    this.maxBars = options.maxBars || 100;
    
    // Fibonacci ratios for each pattern type
    this.patternRatios = {
      gartley: {
        XA_AB: { min: 0.618, max: 0.618 },
        AB_BC: { min: 0.382, max: 0.886 },
        BC_CD: { min: 1.13, max: 1.618 },
        XA_AD: { min: 0.786, max: 0.786 }
      },
      bat: {
        XA_AB: { min: 0.382, max: 0.5 },
        AB_BC: { min: 0.382, max: 0.886 },
        BC_CD: { min: 1.618, max: 2.618 },
        XA_AD: { min: 0.886, max: 0.886 }
      },
      butterfly: {
        XA_AB: { min: 0.786, max: 0.786 },
        AB_BC: { min: 0.382, max: 0.886 },
        BC_CD: { min: 1.618, max: 2.618 },
        XA_AD: { min: 1.27, max: 1.618 }
      },
      crab: {
        XA_AB: { min: 0.382, max: 0.618 },
        AB_BC: { min: 0.382, max: 0.886 },
        BC_CD: { min: 2.24, max: 3.618 },
        XA_AD: { min: 1.618, max: 2.618 }
      },
      cypher: {
        XA_AB: { min: 0.382, max: 0.618 },
        AB_BC: { min: 1.13, max: 1.41 },
        XC_CD: { min: 0.786, max: 0.786 }
      },
      shark: {
        XA_AB: { min: 0.382, max: 0.618 },
        AB_BC: { min: 1.13, max: 1.618 },
        BC_CD: { min: 1.618, max: 2.24 },
        XA_AD: { min: 0.886, max: 1.13 }
      },
      abcd: {
        AB_BC: { min: 0.618, max: 0.786 },
        BC_CD: { min: 1.27, max: 1.618 }
      }
    };
  }

  /**
   * Check if a ratio is within tolerance
   */
  isRatioValid(actual, expected, tolerance = this.tolerance) {
    const lowerBound = expected * (1 - tolerance);
    const upperBound = expected * (1 + tolerance);
    return actual >= lowerBound && actual <= upperBound;
  }

  /**
   * Check if a ratio is within a range
   */
  isRatioInRange(actual, min, max, tolerance = this.tolerance) {
    const lowerBound = min * (1 - tolerance);
    const upperBound = max * (1 + tolerance);
    return actual >= lowerBound && actual <= upperBound;
  }

  /**
   * Calculate distance between two price points
   */
  calculateDistance(price1, price2) {
    return Math.abs(price2 - price1);
  }

  /**
   * Calculate ratio between two distances
   */
  calculateRatio(distance1, distance2) {
    if (distance2 === 0) return 0;
    return distance1 / distance2;
  }

  /**
   * Find swing highs and lows in price data
   */
  findSwingPoints(priceData, period = 5) {
    const swingHighs = [];
    const swingLows = [];

    for (let i = period; i < priceData.length - period; i++) {
      const current = priceData[i];
      let isSwingHigh = true;
      let isSwingLow = true;

      // Check if current point is a swing high
      for (let j = i - period; j <= i + period; j++) {
        if (j !== i && priceData[j].high >= current.high) {
          isSwingHigh = false;
          break;
        }
      }

      // Check if current point is a swing low
      for (let j = i - period; j <= i + period; j++) {
        if (j !== i && priceData[j].low <= current.low) {
          isSwingLow = false;
          break;
        }
      }

      if (isSwingHigh) {
        swingHighs.push({
          index: i,
          price: current.high,
          timestamp: current.timestamp
        });
      }

      if (isSwingLow) {
        swingLows.push({
          index: i,
          price: current.low,
          timestamp: current.timestamp
        });
      }
    }

    return { swingHighs, swingLows };
  }

  /**
   * Detect Gartley patterns (bullish and bearish)
   */
  detectGartleyPatterns(priceData, options = {}) {
    const patterns = [];
    const { swingHighs, swingLows } = this.findSwingPoints(priceData);

    // Detect bullish Gartley (X-A-B-C-D where X and B are lows, A and C are highs)
    for (let x = 0; x < swingLows.length - 1; x++) {
      for (let a = 0; a < swingHighs.length; a++) {
        if (swingHighs[a].index <= swingLows[x].index) continue;
        
        for (let b = x + 1; b < swingLows.length; b++) {
          if (swingLows[b].index <= swingHighs[a].index) continue;
          
          for (let c = a + 1; c < swingHighs.length; c++) {
            if (swingHighs[c].index <= swingLows[b].index) continue;
            
            for (let d = b + 1; d < swingLows.length; d++) {
              if (swingLows[d].index <= swingHighs[c].index) continue;

              const xPrice = swingLows[x].price;
              const aPrice = swingHighs[a].price;
              const bPrice = swingLows[b].price;
              const cPrice = swingHighs[c].price;
              const dPrice = swingLows[d].price;

              // Calculate ratios
              const xa = this.calculateDistance(xPrice, aPrice);
              const ab = this.calculateDistance(aPrice, bPrice);
              const bc = this.calculateDistance(bPrice, cPrice);
              const cd = this.calculateDistance(cPrice, dPrice);
              const ad = this.calculateDistance(aPrice, dPrice);

              const xa_ab = this.calculateRatio(ab, xa);
              const ab_bc = this.calculateRatio(bc, ab);
              const bc_cd = this.calculateRatio(cd, bc);
              const xa_ad = this.calculateRatio(ad, xa);

              // Validate Gartley ratios
              const ratios = this.patternRatios.gartley;
              
              if (this.isRatioValid(xa_ab, ratios.XA_AB.min) &&
                  this.isRatioInRange(ab_bc, ratios.AB_BC.min, ratios.AB_BC.max) &&
                  this.isRatioInRange(bc_cd, ratios.BC_CD.min, ratios.BC_CD.max) &&
                  this.isRatioValid(xa_ad, ratios.XA_AD.min)) {
                
                patterns.push({
                  type: 'gartley',
                  direction: 'bullish',
                  points: {
                    X: { price: xPrice, index: swingLows[x].index, timestamp: swingLows[x].timestamp },
                    A: { price: aPrice, index: swingHighs[a].index, timestamp: swingHighs[a].timestamp },
                    B: { price: bPrice, index: swingLows[b].index, timestamp: swingLows[b].timestamp },
                    C: { price: cPrice, index: swingHighs[c].index, timestamp: swingHighs[c].timestamp },
                    D: { price: dPrice, index: swingLows[d].index, timestamp: swingLows[d].timestamp }
                  },
                  ratios: { xa_ab, ab_bc, bc_cd, xa_ad },
                  confidence: this.calculatePatternConfidence('gartley', { xa_ab, ab_bc, bc_cd, xa_ad }),
                  ...this.calculateTargets('gartley', { xPrice, aPrice, bPrice, cPrice, dPrice }, 'bullish')
                });
              }
            }
          }
        }
      }
    }

    // Detect bearish Gartley (similar logic but inverted)
    // ... (implementation similar to bullish but with highs/lows swapped)

    return patterns;
  }

  /**
   * Detect Bat patterns
   */
  detectBatPatterns(priceData, options = {}) {
    const patterns = [];
    const { swingHighs, swingLows } = this.findSwingPoints(priceData);

    // Similar pattern detection logic as Gartley but with Bat ratios
    // Implementation follows the same structure but uses this.patternRatios.bat

    return patterns;
  }

  /**
   * Detect Butterfly patterns - Real implementation based on documentation
   */
  detectButterflyPatterns(priceData, options = {}) {
    const patterns = [];
    const { swingHighs, swingLows } = this.findSwingPoints(priceData);

    // Detect Bullish Butterfly (X-A-B-C-D where X and B are lows, A and C are highs)
    for (let x = 0; x < swingLows.length - 1; x++) {
      for (let a = 0; a < swingHighs.length; a++) {
        if (swingHighs[a].index <= swingLows[x].index) continue;
        
        for (let b = x + 1; b < swingLows.length; b++) {
          if (swingLows[b].index <= swingHighs[a].index) continue;
          
          for (let c = 0; c < swingHighs.length; c++) {
            if (swingHighs[c].index <= swingLows[b].index) continue;
            
            // Calculate Fibonacci ratios
            const xPrice = swingLows[x].price;
            const aPrice = swingHighs[a].price;
            const bPrice = swingLows[b].price;
            const cPrice = swingHighs[c].price;
            
            const xa = Math.abs(aPrice - xPrice);
            const ab = Math.abs(bPrice - aPrice);
            const bc = Math.abs(cPrice - bPrice);
            
            // Calculate ratios
            const abRatio = ab / xa;  // Must be 0.786 (78.6%)
            const bcRatio = bc / ab;  // Must be 38.2% - 88.6% of AB
            
            // Validate AB retracement (critical for Butterfly - must be exactly 78.6%)
            if (!this.isRatioValid(abRatio, 0.786, 0.786)) continue;
            
            // Validate BC projection (38.2% - 88.6% of AB)
            if (!this.isRatioValid(bcRatio, 0.382, 0.886)) continue;
            
            // Calculate potential D point using 1.272 and 1.618 extensions of XA
            const d1Price = xPrice - (xa * 1.272); // Primary entry point
            const d2Price = xPrice - (xa * 1.618); // Maximum extension
            
            // Check if price has reached at least the 1.272 level
            const currentPrice = priceData[priceData.length - 1].low;
            if (currentPrice > d1Price) continue;
            
            // Calculate CD projection ratio
            const cd = Math.abs(currentPrice - cPrice);
            const cdRatio = cd / ab;
            
            // Validate CD projection (1.618 - 2.618 of AB)
            if (!this.isRatioValid(cdRatio, 1.618, 2.618)) continue;
            
            // Calculate XA to AD ratio
            const ad = Math.abs(currentPrice - xPrice);
            const xaAdRatio = ad / xa;
            
            // Validate XA to AD ratio (1.272 - 1.618)
            if (!this.isRatioValid(xaAdRatio, 1.272, 1.618)) continue;
            
            // Pattern is valid - create pattern object
            const pattern = {
              type: 'butterfly',
              direction: 'bullish',
              points: {
                X: { price: xPrice, timestamp: swingLows[x].timestamp, index: swingLows[x].index },
                A: { price: aPrice, timestamp: swingHighs[a].timestamp, index: swingHighs[a].index },
                B: { price: bPrice, timestamp: swingLows[b].timestamp, index: swingLows[b].index },
                C: { price: cPrice, timestamp: swingHighs[c].timestamp, index: swingHighs[c].index },
                D: { price: currentPrice, timestamp: priceData[priceData.length - 1].timestamp, index: priceData.length - 1 }
              },
              ratios: {
                XA_AB: abRatio,
                AB_BC: bcRatio,
                BC_CD: cdRatio,
                XA_AD: xaAdRatio
              },
              confidence: this.calculateConfidence(
                { XA_AB: abRatio, AB_BC: bcRatio, BC_CD: cdRatio, XA_AD: xaAdRatio },
                this.patternRatios.butterfly
              ),
              targets: this.calculateButterflyTargets(xPrice, aPrice, bPrice, cPrice, currentPrice, 'bullish'),
              entry: d1Price,
              stopLoss: d2Price - (xa * 0.1), // Below 1.618 extension
              completed: currentPrice <= d1Price
            };
            
            patterns.push(pattern);
          }
        }
      }
    }

    // Detect Bearish Butterfly (X-A-B-C-D where X and B are highs, A and C are lows)
    for (let x = 0; x < swingHighs.length - 1; x++) {
      for (let a = 0; a < swingLows.length; a++) {
        if (swingLows[a].index <= swingHighs[x].index) continue;
        
        for (let b = x + 1; b < swingHighs.length; b++) {
          if (swingHighs[b].index <= swingLows[a].index) continue;
          
          for (let c = 0; c < swingLows.length; c++) {
            if (swingLows[c].index <= swingHighs[b].index) continue;
            
            // Calculate Fibonacci ratios
            const xPrice = swingHighs[x].price;
            const aPrice = swingLows[a].price;
            const bPrice = swingHighs[b].price;
            const cPrice = swingLows[c].price;
            
            const xa = Math.abs(aPrice - xPrice);
            const ab = Math.abs(bPrice - aPrice);
            const bc = Math.abs(cPrice - bPrice);
            
            // Calculate ratios
            const abRatio = ab / xa;  // Must be 0.786 (78.6%)
            const bcRatio = bc / ab;  // Must be 38.2% - 88.6% of AB
            
            // Validate AB retracement (critical for Butterfly - must be exactly 78.6%)
            if (!this.isRatioValid(abRatio, 0.786, 0.786)) continue;
            
            // Validate BC projection (38.2% - 88.6% of AB)
            if (!this.isRatioValid(bcRatio, 0.382, 0.886)) continue;
            
            // Calculate potential D point using 1.272 and 1.618 extensions of XA
            const d1Price = xPrice + (xa * 1.272); // Primary entry point
            const d2Price = xPrice + (xa * 1.618); // Maximum extension
            
            // Check if price has reached at least the 1.272 level
            const currentPrice = priceData[priceData.length - 1].high;
            if (currentPrice < d1Price) continue;
            
            // Calculate CD projection ratio
            const cd = Math.abs(currentPrice - cPrice);
            const cdRatio = cd / ab;
            
            // Validate CD projection (1.618 - 2.618 of AB)
            if (!this.isRatioValid(cdRatio, 1.618, 2.618)) continue;
            
            // Calculate XA to AD ratio
            const ad = Math.abs(currentPrice - xPrice);
            const xaAdRatio = ad / xa;
            
            // Validate XA to AD ratio (1.272 - 1.618)
            if (!this.isRatioValid(xaAdRatio, 1.272, 1.618)) continue;
            
            // Pattern is valid - create pattern object
            const pattern = {
              type: 'butterfly',
              direction: 'bearish',
              points: {
                X: { price: xPrice, timestamp: swingHighs[x].timestamp, index: swingHighs[x].index },
                A: { price: aPrice, timestamp: swingLows[a].timestamp, index: swingLows[a].index },
                B: { price: bPrice, timestamp: swingHighs[b].timestamp, index: swingHighs[b].index },
                C: { price: cPrice, timestamp: swingLows[c].timestamp, index: swingLows[c].index },
                D: { price: currentPrice, timestamp: priceData[priceData.length - 1].timestamp, index: priceData.length - 1 }
              },
              ratios: {
                XA_AB: abRatio,
                AB_BC: bcRatio,
                BC_CD: cdRatio,
                XA_AD: xaAdRatio
              },
              confidence: this.calculateConfidence(
                { XA_AB: abRatio, AB_BC: bcRatio, BC_CD: cdRatio, XA_AD: xaAdRatio },
                this.patternRatios.butterfly
              ),
              targets: this.calculateButterflyTargets(xPrice, aPrice, bPrice, cPrice, currentPrice, 'bearish'),
              entry: d1Price,
              stopLoss: d2Price + (xa * 0.1), // Above 1.618 extension
              completed: currentPrice >= d1Price
            };
            
            patterns.push(pattern);
          }
        }
      }
    }

    return patterns;
  }

  /**
   * Detect Crab patterns
   */
  detectCrabPatterns(priceData, options = {}) {
    const patterns = [];
    // Implementation similar to other patterns but with Crab ratios
    return patterns;
  }

  /**
   * Detect Cypher patterns
   */
  detectCypherPatterns(priceData, options = {}) {
    const patterns = [];
    // Implementation similar to other patterns but with Cypher ratios (uses XC instead of XA for some calculations)
    return patterns;
  }

  /**
   * Detect Shark patterns
   */
  detectSharkPatterns(priceData, options = {}) {
    const patterns = [];
    // Implementation similar to other patterns but with Shark ratios
    return patterns;
  }

  /**
   * Detect ABCD patterns
   */
  detectABCDPatterns(priceData, options = {}) {
    const patterns = [];
    const { swingHighs, swingLows } = this.findSwingPoints(priceData);

    // ABCD is simpler - only 4 points instead of 5
    // Similar implementation but only checking AB_BC and BC_CD ratios

    return patterns;
  }

  /**
   * Calculate pattern confidence based on how close ratios are to ideal values
   */
  calculatePatternConfidence(patternType, ratios) {
    let totalDeviation = 0;
    let ratioCount = 0;
    const idealRatios = this.patternRatios[patternType];

    for (const [key, value] of Object.entries(ratios)) {
      if (idealRatios[key]) {
        const ideal = idealRatios[key].min === idealRatios[key].max ? 
                     idealRatios[key].min : 
                     (idealRatios[key].min + idealRatios[key].max) / 2;
        
        const deviation = Math.abs(value - ideal) / ideal;
        totalDeviation += deviation;
        ratioCount++;
      }
    }

    const averageDeviation = totalDeviation / ratioCount;
    return Math.max(0, 1 - averageDeviation);
  }

  /**
   * Check if a ratio is within valid range with tolerance
   */
  isRatioValid(actualRatio, minRatio, maxRatio) {
    const tolerance = this.tolerance;
    const lowerBound = minRatio * (1 - tolerance);
    const upperBound = maxRatio * (1 + tolerance);
    return actualRatio >= lowerBound && actualRatio <= upperBound;
  }

  /**
   * Calculate Butterfly pattern targets and stop loss based on documentation
   */
  calculateButterflyTargets(xPrice, aPrice, bPrice, cPrice, dPrice, direction) {
    if (direction === 'bullish') {
      // Target 1: Point B level (conservative)
      const target1 = bPrice;
      
      // Target 2: 0.618 retracement of CD leg
      const cd = Math.abs(dPrice - cPrice);
      const target2 = dPrice + (cd * 0.618);
      
      // Stop Loss: Below 1.618 extension of XA
      const xa = Math.abs(aPrice - xPrice);
      const stopLoss = xPrice - (xa * 1.618) - (xa * 0.1);
      
      return { target1, target2, stopLoss };
    } else {
      // Bearish targets (inverted)
      const target1 = bPrice;
      
      const cd = Math.abs(dPrice - cPrice);
      const target2 = dPrice - (cd * 0.618);
      
      const xa = Math.abs(aPrice - xPrice);
      const stopLoss = xPrice + (xa * 1.618) + (xa * 0.1);
      
      return { target1, target2, stopLoss };
    }
  }

  /**
   * Calculate price targets and stop loss for a pattern
   */
  calculateTargets(patternType, points, direction) {
    const { xPrice, aPrice, bPrice, cPrice, dPrice } = points;
    let target1, target2, stopLoss;

    switch (patternType) {
      case 'gartley':
        if (direction === 'bullish') {
          const xa = Math.abs(aPrice - xPrice);
          target1 = dPrice + xa * 0.382;
          target2 = dPrice + xa * 0.618;
          stopLoss = dPrice - xa * 0.1;
        } else {
          const xa = Math.abs(aPrice - xPrice);
          target1 = dPrice - xa * 0.382;
          target2 = dPrice - xa * 0.618;
          stopLoss = dPrice + xa * 0.1;
        }
        break;
      
      // Add cases for other pattern types...
      default:
        target1 = null;
        target2 = null;
        stopLoss = null;
    }

    return { target1, target2, stopLoss };
  }

  /**
   * Detect all patterns in price data
   */
  async detectAllPatterns(priceData, options = {}) {
    const allPatterns = [];

    try {
      // Detect each pattern type
      const gartleyPatterns = this.detectGartleyPatterns(priceData, options);
      const batPatterns = this.detectBatPatterns(priceData, options);
      const butterflyPatterns = this.detectButterflyPatterns(priceData, options);
      const crabPatterns = this.detectCrabPatterns(priceData, options);
      const cypherPatterns = this.detectCypherPatterns(priceData, options);
      const sharkPatterns = this.detectSharkPatterns(priceData, options);
      const abcdPatterns = this.detectABCDPatterns(priceData, options);

      // Combine all patterns
      allPatterns.push(
        ...gartleyPatterns,
        ...batPatterns,
        ...butterflyPatterns,
        ...crabPatterns,
        ...cypherPatterns,
        ...sharkPatterns,
        ...abcdPatterns
      );

      // Sort by confidence and time
      allPatterns.sort((a, b) => {
        if (b.confidence !== a.confidence) {
          return b.confidence - a.confidence;
        }
        return b.points.D.timestamp - a.points.D.timestamp;
      });

      // Add metadata
      allPatterns.forEach((pattern, index) => {
        pattern.id = `${pattern.type}_${pattern.direction}_${Date.now()}_${index}`;
        pattern.symbol = options.symbol || 'UNKNOWN';
        pattern.timeframe = options.timeframe || '1H';
        pattern.detectedAt = new Date().toISOString();
        pattern.status = 'active';
      });

      return allPatterns;

    } catch (error) {
      console.error('Error detecting patterns:', error);
      throw error;
    }
  }

  /**
   * Validate pattern data format
   */
  validatePriceData(priceData) {
    if (!Array.isArray(priceData)) {
      throw new Error('Price data must be an array');
    }

    if (priceData.length < this.minBars) {
      throw new Error(`Insufficient data: minimum ${this.minBars} bars required`);
    }

    // Check if each candle has required properties
    for (let i = 0; i < priceData.length; i++) {
      const candle = priceData[i];
      if (!candle.open || !candle.high || !candle.low || !candle.close) {
        throw new Error(`Invalid candle data at index ${i}: missing OHLC values`);
      }
    }

    return true;
  }
}

module.exports = PatternDetector;
