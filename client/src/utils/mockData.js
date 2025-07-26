// Mock data generator for harmonic patterns
export const generateMockPatterns = (symbol = 'EURUSD') => {
  const now = Date.now();
  const patterns = [];
  
  // Generate some example patterns
  const patternTypes = ['Gartley', 'Bat', 'Butterfly', 'Crab', 'Cypher', 'Shark', 'ABCD'];
  const statuses = ['completed', 'forming', 'invalid'];
  
  for (let i = 0; i < 5; i++) {
    const type = patternTypes[Math.floor(Math.random() * patternTypes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    patterns.push({
      id: `pattern_${i}`,
      type,
      status,
      symbol,
      timeframe: '1H',
      confidence: Math.random() * 0.4 + 0.6, // 60-100%
      detectedAt: new Date(now - Math.random() * 86400000), // Within last 24h
      points: generatePatternPoints(type),
      priceTargets: {
        target1: 1.0850 + Math.random() * 0.01,
        target2: 1.0900 + Math.random() * 0.01,
        stopLoss: 1.0750 + Math.random() * 0.005
      },
      ratios: generateFibRatios(type)
    });
  }
  
  return patterns;
};

const generatePatternPoints = (type) => {
  const baseTime = Date.now() - 86400000; // 24 hours ago
  const basePrice = 1.0800;
  
  return {
    X: {
      time: baseTime,
      price: basePrice + Math.random() * 0.01
    },
    A: {
      time: baseTime + 21600000, // 6 hours later
      price: basePrice + 0.02 + Math.random() * 0.01
    },
    B: {
      time: baseTime + 43200000, // 12 hours later
      price: basePrice + 0.005 + Math.random() * 0.01
    },
    C: {
      time: baseTime + 64800000, // 18 hours later
      price: basePrice + 0.015 + Math.random() * 0.01
    },
    D: {
      time: baseTime + 86400000, // 24 hours later
      price: basePrice + 0.008 + Math.random() * 0.005
    }
  };
};

const generateFibRatios = (type) => {
  // Generate appropriate Fibonacci ratios based on pattern type
  const ratios = {
    'Gartley': {
      XA_AB: 0.618,
      AB_BC: 0.382 + Math.random() * 0.504, // 0.382-0.886
      BC_CD: 1.13 + Math.random() * 0.488,   // 1.13-1.618
      XA_AD: 0.786
    },
    'Bat': {
      XA_AB: 0.382 + Math.random() * 0.118,  // 0.382-0.5
      AB_BC: 0.382 + Math.random() * 0.504,  // 0.382-0.886
      BC_CD: 1.618 + Math.random() * 1.0,    // 1.618-2.618
      XA_AD: 0.886
    },
    'Butterfly': {
      XA_AB: 0.786,
      AB_BC: 0.382 + Math.random() * 0.504,  // 0.382-0.886
      BC_CD: 1.618 + Math.random() * 1.0,    // 1.618-2.618
      XA_AD: 1.27 + Math.random() * 0.348    // 1.27-1.618
    }
  };
  
  return ratios[type] || ratios['Gartley'];
};

export const mockPriceData = {
  symbol: 'EURUSD',
  timeframe: '1H',
  data: [
    { time: Date.now() - 86400000, open: 1.0800, high: 1.0820, low: 1.0790, close: 1.0810, volume: 1000 },
    { time: Date.now() - 82800000, open: 1.0810, high: 1.0830, low: 1.0800, close: 1.0825, volume: 1200 },
    { time: Date.now() - 79200000, open: 1.0825, high: 1.0840, low: 1.0815, close: 1.0835, volume: 1100 },
    { time: Date.now() - 75600000, open: 1.0835, high: 1.0850, low: 1.0825, close: 1.0845, volume: 1300 },
    { time: Date.now() - 72000000, open: 1.0845, high: 1.0860, low: 1.0835, close: 1.0855, volume: 1400 },
  ]
};
