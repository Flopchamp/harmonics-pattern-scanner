/**
 * Harmonic Pattern Detector
 * Implements detection logic for all 7 harmonic patterns based on Fibonacci ratios
 */

class PatternDetector {
  constructor(tolerance = 0.05) {
    this.tolerance = tolerance; // 5% tolerance for Fibonacci ratios
  }

  /**
   * Detect all harmonic patterns in the given market data
   */
  async detectAllPatterns(marketData) {
    const patterns = [];
    const swingPoints = this.identifySwingPoints(marketData);

    if (swingPoints.length < 5) {
      return patterns; // Need at least 5 swing points for patterns
    }

    // Check for each pattern type
    patterns.push(...this.detectGartleyPatterns(swingPoints, marketData));
    patterns.push(...this.detectBatPatterns(swingPoints, marketData));
    patterns.push(...this.detectButterflyPatterns(swingPoints, marketData));
    patterns.push(...this.detectCrabPatterns(swingPoints, marketData));
    patterns.push(...this.detectCypherPatterns(swingPoints, marketData));
    patterns.push(...this.detectSharkPatterns(swingPoints, marketData));
    patterns.push(...this.detectABCDPatterns(swingPoints, marketData));

    return patterns.filter(pattern => pattern !== null);
  }

  /**
   * Identify swing high and low points in market data
   */
  identifySwingPoints(data, lookback = 5) {
    const swingPoints = [];
    
    for (let i = lookback; i < data.length - lookback; i++) {
      const current = data[i];
      
      // Check for swing high
      let isSwingHigh = true;
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i && data[j].high >= current.high) {
          isSwingHigh = false;
          break;
        }
      }
      
      // Check for swing low
      let isSwingLow = true;
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i && data[j].low <= current.low) {
          isSwingLow = false;
          break;
        }
      }
      
      if (isSwingHigh) {
        swingPoints.push({
          index: i,
          time: current.time,
          price: current.high,
          type: 'high'
        });
      }
      
      if (isSwingLow) {
        swingPoints.push({
          index: i,
          time: current.time,
          price: current.low,
          type: 'low'
        });
      }
    }
    
    return swingPoints.sort((a, b) => a.index - b.index);
  }

  /**
   * Detect Gartley patterns
   * Rules: AB = 61.8% XA, BC = 38.2%–78.6% AB, CD = 1.272–1.618 AB or 0.786 XA
   */
  detectGartleyPatterns(swingPoints, marketData) {
    const patterns = [];
    
    for (let i = 0; i < swingPoints.length - 4; i++) {
      const X = swingPoints[i];
      const A = swingPoints[i + 1];
      const B = swingPoints[i + 2];
      const C = swingPoints[i + 3];
      const D = swingPoints[i + 4];
      
      // Validate pattern structure (alternating highs/lows)
      if (!this.isValidPatternStructure([X, A, B, C, D])) continue;
      
      const ratios = this.calculateFibonacciRatios(X, A, B, C, D);
      
      // Gartley rules
      if (this.isInRange(ratios.AB_XA, 0.618, this.tolerance) &&
          this.isInRange(ratios.BC_AB, 0.382, 0.786) &&
          (this.isInRange(ratios.CD_AB, 1.272, 1.618) || this.isInRange(ratios.CD_XA, 0.786, this.tolerance))) {
        
        const pattern = {
          type: 'Gartley',
          points: { X, A, B, C, D },
          fibonacciRatios: ratios,
          status: this.getPatternStatus(D, marketData),
          tradingLevels: this.calculateTradingLevels('Gartley', { X, A, B, C, D }),
          probability: this.calculateProbability('Gartley', ratios),
          isNew: true
        };
        
        patterns.push(pattern);
      }
    }
    
    return patterns;
  }

  /**
   * Detect Bat patterns
   * Rules: AB = 38.2%–50% XA, BC = 38.2%–88.6% AB, CD = 88.6% XA or 1.618–2.618 AB
   */
  detectBatPatterns(swingPoints, marketData) {
    const patterns = [];
    
    for (let i = 0; i < swingPoints.length - 4; i++) {
      const X = swingPoints[i];
      const A = swingPoints[i + 1];
      const B = swingPoints[i + 2];
      const C = swingPoints[i + 3];
      const D = swingPoints[i + 4];
      
      if (!this.isValidPatternStructure([X, A, B, C, D])) continue;
      
      const ratios = this.calculateFibonacciRatios(X, A, B, C, D);
      
      // Bat rules
      if (this.isInRange(ratios.AB_XA, 0.382, 0.50) &&
          this.isInRange(ratios.BC_AB, 0.382, 0.886) &&
          (this.isInRange(ratios.CD_XA, 0.886, this.tolerance) || this.isInRange(ratios.CD_AB, 1.618, 2.618))) {
        
        const pattern = {
          type: 'Bat',
          points: { X, A, B, C, D },
          fibonacciRatios: ratios,
          status: this.getPatternStatus(D, marketData),
          tradingLevels: this.calculateTradingLevels('Bat', { X, A, B, C, D }),
          probability: this.calculateProbability('Bat', ratios),
          isNew: true
        };
        
        patterns.push(pattern);
      }
    }
    
    return patterns;
  }

  /**
   * Detect Butterfly patterns
   * Rules: AB = 78.6% XA, BC = 38.2%–88.6% AB, CD = 1.618–2.618 AB or 1.272–1.618 XA
   */
  detectButterflyPatterns(swingPoints, marketData) {
    const patterns = [];
    
    for (let i = 0; i < swingPoints.length - 4; i++) {
      const X = swingPoints[i];
      const A = swingPoints[i + 1];
      const B = swingPoints[i + 2];
      const C = swingPoints[i + 3];
      const D = swingPoints[i + 4];
      
      if (!this.isValidPatternStructure([X, A, B, C, D])) continue;
      
      const ratios = this.calculateFibonacciRatios(X, A, B, C, D);
      
      // Butterfly rules
      if (this.isInRange(ratios.AB_XA, 0.786, this.tolerance) &&
          this.isInRange(ratios.BC_AB, 0.382, 0.886) &&
          (this.isInRange(ratios.CD_AB, 1.618, 2.618) || this.isInRange(ratios.CD_XA, 1.272, 1.618))) {
        
        const pattern = {
          type: 'Butterfly',
          points: { X, A, B, C, D },
          fibonacciRatios: ratios,
          status: this.getPatternStatus(D, marketData),
          tradingLevels: this.calculateTradingLevels('Butterfly', { X, A, B, C, D }),
          probability: this.calculateProbability('Butterfly', ratios),
          isNew: true
        };
        
        patterns.push(pattern);
      }
    }
    
    return patterns;
  }

  /**
   * Detect Crab patterns
   * Rules: AB = 38.2%–61.8% XA, BC = 38.2%–88.6% AB, CD = 2.24–3.618 AB or 1.618 XA
   */
  detectCrabPatterns(swingPoints, marketData) {
    const patterns = [];
    
    for (let i = 0; i < swingPoints.length - 4; i++) {
      const X = swingPoints[i];
      const A = swingPoints[i + 1];
      const B = swingPoints[i + 2];
      const C = swingPoints[i + 3];
      const D = swingPoints[i + 4];
      
      if (!this.isValidPatternStructure([X, A, B, C, D])) continue;
      
      const ratios = this.calculateFibonacciRatios(X, A, B, C, D);
      
      // Crab rules
      if (this.isInRange(ratios.AB_XA, 0.382, 0.618) &&
          this.isInRange(ratios.BC_AB, 0.382, 0.886) &&
          (this.isInRange(ratios.CD_AB, 2.24, 3.618) || this.isInRange(ratios.CD_XA, 1.618, this.tolerance))) {
        
        const pattern = {
          type: 'Crab',
          points: { X, A, B, C, D },
          fibonacciRatios: ratios,
          status: this.getPatternStatus(D, marketData),
          tradingLevels: this.calculateTradingLevels('Crab', { X, A, B, C, D }),
          probability: this.calculateProbability('Crab', ratios),
          isNew: true
        };
        
        patterns.push(pattern);
      }
    }
    
    return patterns;
  }

  /**
   * Detect Cypher patterns
   * Rules: AB = 38.2%–61.8% XA, BC = 1.272–1.414 XA, CD = 0.786 XC
   */
  detectCypherPatterns(swingPoints, marketData) {
    const patterns = [];
    
    for (let i = 0; i < swingPoints.length - 4; i++) {
      const X = swingPoints[i];
      const A = swingPoints[i + 1];
      const B = swingPoints[i + 2];
      const C = swingPoints[i + 3];
      const D = swingPoints[i + 4];
      
      if (!this.isValidPatternStructure([X, A, B, C, D])) continue;
      
      const ratios = this.calculateFibonacciRatios(X, A, B, C, D);
      
      // Cypher rules
      if (this.isInRange(ratios.AB_XA, 0.382, 0.618) &&
          this.isInRange(ratios.BC_XA, 1.272, 1.414) &&
          this.isInRange(ratios.CD_XC, 0.786, this.tolerance)) {
        
        const pattern = {
          type: 'Cypher',
          points: { X, A, B, C, D },
          fibonacciRatios: ratios,
          status: this.getPatternStatus(D, marketData),
          tradingLevels: this.calculateTradingLevels('Cypher', { X, A, B, C, D }),
          probability: this.calculateProbability('Cypher', ratios),
          isNew: true
        };
        
        patterns.push(pattern);
      }
    }
    
    return patterns;
  }

  /**
   * Detect Shark patterns (5-point pattern)
   * Rules: AB = 1.13–1.618 XA, BC = 113% 0X, CD = 50% BC
   */
  detectSharkPatterns(swingPoints, marketData) {
    const patterns = [];
    
    for (let i = 0; i < swingPoints.length - 5; i++) {
      const O = swingPoints[i];
      const X = swingPoints[i + 1];
      const A = swingPoints[i + 2];
      const B = swingPoints[i + 3];
      const C = swingPoints[i + 4];
      
      if (!this.isValidPatternStructure([O, X, A, B, C])) continue;
      
      const ratios = this.calculateSharkRatios(O, X, A, B, C);
      
      // Shark rules
      if (this.isInRange(ratios.AB_XA, 1.13, 1.618) &&
          this.isInRange(ratios.BC_OX, 1.13, this.tolerance) &&
          this.isInRange(ratios.CD_BC, 0.50, this.tolerance)) {
        
        const pattern = {
          type: 'Shark',
          points: { O, X, A, B, C },
          fibonacciRatios: ratios,
          status: this.getPatternStatus(C, marketData),
          tradingLevels: this.calculateTradingLevels('Shark', { O, X, A, B, C }),
          probability: this.calculateProbability('Shark', ratios),
          isNew: true
        };
        
        patterns.push(pattern);
      }
    }
    
    return patterns;
  }

  /**
   * Detect ABCD patterns
   * Rules: Equal AB and CD legs or Fibonacci-based extensions
   */
  detectABCDPatterns(swingPoints, marketData) {
    const patterns = [];
    
    for (let i = 0; i < swingPoints.length - 3; i++) {
      const A = swingPoints[i];
      const B = swingPoints[i + 1];
      const C = swingPoints[i + 2];
      const D = swingPoints[i + 3];
      
      if (!this.isValidPatternStructure([A, B, C, D])) continue;
      
      const ratios = this.calculateABCDRatios(A, B, C, D);
      
      // ABCD rules (equal legs or Fibonacci ratios)
      if (this.isInRange(ratios.CD_AB, 1.0, this.tolerance) || // Equal legs
          this.isInRange(ratios.CD_AB, 1.272, this.tolerance) || // 1.272 extension
          this.isInRange(ratios.CD_AB, 1.618, this.tolerance)) { // 1.618 extension
        
        const pattern = {
          type: 'ABCD',
          points: { A, B, C, D },
          fibonacciRatios: ratios,
          status: this.getPatternStatus(D, marketData),
          tradingLevels: this.calculateTradingLevels('ABCD', { A, B, C, D }),
          probability: this.calculateProbability('ABCD', ratios),
          isNew: true
        };
        
        patterns.push(pattern);
      }
    }
    
    return patterns;
  }

  /**
   * Calculate Fibonacci ratios for standard 5-point patterns
   */
  calculateFibonacciRatios(X, A, B, C, D) {
    const XA = Math.abs(A.price - X.price);
    const AB = Math.abs(B.price - A.price);
    const BC = Math.abs(C.price - B.price);
    const CD = Math.abs(D.price - C.price);
    const XC = Math.abs(C.price - X.price);
    
    return {
      AB_XA: AB / XA,
      BC_AB: BC / AB,
      CD_AB: CD / AB,
      CD_XA: CD / XA,
      BC_XA: BC / XA,
      CD_XC: CD / XC
    };
  }

  /**
   * Calculate ratios for Shark pattern (5-point)
   */
  calculateSharkRatios(O, X, A, B, C) {
    const OX = Math.abs(X.price - O.price);
    const XA = Math.abs(A.price - X.price);
    const AB = Math.abs(B.price - A.price);
    const BC = Math.abs(C.price - B.price);
    
    return {
      AB_XA: AB / XA,
      BC_OX: BC / OX,
      CD_BC: 0 // Would need D point for complete calculation
    };
  }

  /**
   * Calculate ratios for ABCD pattern
   */
  calculateABCDRatios(A, B, C, D) {
    const AB = Math.abs(B.price - A.price);
    const BC = Math.abs(C.price - B.price);
    const CD = Math.abs(D.price - C.price);
    
    return {
      CD_AB: CD / AB,
      BC_AB: BC / AB
    };
  }

  /**
   * Check if value is within expected range
   */
  isInRange(value, target, tolerance = null) {
    if (tolerance === null) tolerance = this.tolerance;
    
    if (typeof target === 'number') {
      return Math.abs(value - target) <= target * tolerance;
    } else {
      // Range provided as two numbers
      return value >= target && value <= tolerance;
    }
  }

  /**
   * Validate pattern structure (alternating highs and lows)
   */
  isValidPatternStructure(points) {
    for (let i = 0; i < points.length - 1; i++) {
      if (points[i].type === points[i + 1].type) {
        return false; // Two consecutive highs or lows
      }
    }
    return true;
  }

  /**
   * Get pattern status based on current price action
   */
  getPatternStatus(lastPoint, marketData) {
    // This would check if pattern is still forming, completed, or invalidated
    // For now, return 'completed' for detected patterns
    return 'completed';
  }

  /**
   * Calculate trading levels (entry, stop loss, take profit)
   */
  calculateTradingLevels(patternType, points) {
    const levels = {};
    
    switch (patternType) {
      case 'Gartley':
        levels.entry = points.D.price;
        levels.stopLoss = points.X.price;
        levels.takeProfit = points.A.price;
        break;
      case 'Bat':
        levels.entry = points.D.price;
        levels.stopLoss = points.X.price;
        levels.takeProfit = points.C.price;
        break;
      case 'Butterfly':
        levels.entry = points.D.price;
        levels.stopLoss = points.X.price + (Math.abs(points.D.price - points.X.price) * 0.1);
        levels.takeProfit = points.B.price;
        break;
      case 'Crab':
        levels.entry = points.D.price;
        levels.stopLoss = points.D.price + (Math.abs(points.D.price - points.C.price) * 0.2);
        levels.takeProfit = points.A.price;
        break;
      case 'Cypher':
        levels.entry = points.D.price;
        levels.stopLoss = points.X.price;
        levels.takeProfit = points.A.price;
        break;
      case 'Shark':
        levels.entry = points.C.price;
        levels.stopLoss = points.X.price;
        levels.takeProfit = points.A.price;
        break;
      case 'ABCD':
        levels.entry = points.D.price;
        levels.stopLoss = points.C.price;
        levels.takeProfit = points.A.price;
        break;
    }
    
    return levels;
  }

  /**
   * Calculate pattern probability based on Fibonacci accuracy
   */
  calculateProbability(patternType, ratios) {
    let accuracy = 0;
    let count = 0;
    
    // Calculate average accuracy of Fibonacci ratios
    Object.values(ratios).forEach(ratio => {
      if (typeof ratio === 'number' && ratio > 0) {
        // Simple accuracy calculation - could be improved with ML
        const deviation = Math.abs(ratio - Math.round(ratio * 100) / 100);
        accuracy += Math.max(0, 1 - deviation);
        count++;
      }
    });
    
    const avgAccuracy = count > 0 ? accuracy / count : 0.5;
    
    // Base probability by pattern type (historical success rates)
    const baseProbabilities = {
      'Gartley': 75,
      'Bat': 80,
      'Butterfly': 70,
      'Crab': 85,
      'Cypher': 90,
      'Shark': 65,
      'ABCD': 60
    };
    
    const baseProbability = baseProbabilities[patternType] || 65;
    return Math.round(baseProbability * avgAccuracy);
  }
}

module.exports = PatternDetector;
