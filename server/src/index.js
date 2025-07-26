const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/build')));

// Import routes
const patternRoutes = require('./routes/patterns');
const userRoutes = require('./routes/users');

// Import real Butterfly pattern scanner
const ButterflyPatternScanner = require('./services/butterflyScanner');

// Initialize real Butterfly pattern scanner
const butterflyScanner = new ButterflyPatternScanner(io);

// Database connection
const { sequelize } = require('./models');

// Routes
app.use('/api/patterns', patternRoutes);
app.use('/api/users', userRoutes);

// Real Butterfly pattern endpoints
app.get('/api/butterfly/patterns', (req, res) => {
  try {
    const patterns = butterflyScanner.getAllPatterns();
    res.json(patterns);
  } catch (error) {
    console.error('Error fetching patterns:', error);
    res.status(500).json({ error: 'Failed to fetch patterns' });
  }
});

app.get('/api/butterfly/patterns/:symbol', (req, res) => {
  try {
    const { symbol } = req.params;
    const patterns = butterflyScanner.getPatternsForSymbol(symbol.toUpperCase());
    res.json(patterns);
  } catch (error) {
    console.error('Error fetching patterns for symbol:', error);
    res.status(500).json({ error: 'Failed to fetch patterns for symbol' });
  }
});

// Scanner control endpoints
app.post('/api/butterfly/start', (req, res) => {
  try {
    butterflyScanner.startScanning();
    res.json({ message: 'Butterfly pattern scanning started' });
  } catch (error) {
    console.error('Error starting scanner:', error);
    res.status(500).json({ error: 'Failed to start scanner' });
  }
});

app.post('/api/butterfly/stop', (req, res) => {
  try {
    butterflyScanner.stopScanning();
    res.json({ message: 'Butterfly pattern scanning stopped' });
  } catch (error) {
    console.error('Error stopping scanner:', error);
    res.status(500).json({ error: 'Failed to stop scanner' });
  }
});

// TradingView datafeed API
app.get('/api/tradingview/config', (req, res) => {
  res.json({
    supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D', '1W', '1M'],
    supports_group_request: false,
    supports_marks: false,
    supports_search: true,
    supports_timescale_marks: false
  });
});

app.get('/api/tradingview/symbols', (req, res) => {
  const symbol = req.query.symbol;
  res.json({
    name: symbol,
    ticker: symbol,
    description: symbol,
    type: 'forex',
    session: '24x7',
    timezone: 'Etc/UTC',
    exchange: 'FX',
    minmov: 1,
    pricescale: 100000,
    has_intraday: true,
    has_no_volume: true,
    supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D', '1W', '1M']
  });
});

app.get('/api/tradingview/history', async (req, res) => {
  try {
    const { symbol, resolution, from, to } = req.query;
    
    // Here you would fetch real market data
    // For now, generating sample data
    const bars = generateSampleData(symbol, resolution, parseInt(from), parseInt(to));
    
    res.json({
      s: 'ok',
      t: bars.map(bar => bar.time),
      c: bars.map(bar => bar.close),
      o: bars.map(bar => bar.open),
      h: bars.map(bar => bar.high),
      l: bars.map(bar => bar.low),
      v: bars.map(bar => bar.volume)
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.json({ s: 'error', errmsg: 'Failed to fetch data' });
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('subscribeToSymbol', ({ symbol, timeframe }) => {
    console.log(`User ${socket.id} subscribed to ${symbol} ${timeframe}`);
    socket.join(`${symbol}_${timeframe}`);
    
    // Send existing patterns for this symbol
    const existingPatterns = butterflyScanner.getPatternsForSymbol(symbol);
    socket.emit('existingPatterns', existingPatterns);
  });

  socket.on('getPatterns', (callback) => {
    try {
      const patterns = butterflyScanner.getAllPatterns();
      callback(patterns);
    } catch (error) {
      console.error('Error getting patterns:', error);
      callback([]);
    }
  });

  socket.on('updateSettings', (settings) => {
    console.log(`User ${socket.id} updated settings:`, settings);
    // Store user settings in database
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Pattern detection and broadcasting
async function startPatternDetection(symbol, timeframe, socket) {
  try {
    // Fetch market data
    const marketData = await fetchMarketData(symbol, timeframe);
    
    // Detect patterns
    const patterns = await patternDetector.detectAllPatterns(marketData);
    
    // Broadcast new patterns
    patterns.forEach(pattern => {
      if (pattern.isNew) {
        const patternData = {
          id: Date.now() + Math.random(),
          symbol,
          timeframe,
          type: pattern.type,
          status: pattern.status,
          points: pattern.points,
          fibonacciRatios: pattern.fibonacciRatios,
          tradingLevels: pattern.tradingLevels,
          probability: pattern.probability,
          timestamp: new Date()
        };

        // Broadcast to all clients watching this symbol/timeframe
        io.to(`${symbol}_${timeframe}`).emit('newPattern', patternData);
        
        // Send Telegram notification
        if (telegramBot.isEnabled()) {
          telegramBot.sendPatternAlert(patternData);
        }
      }
    });
  } catch (error) {
    console.error('Error in pattern detection:', error);
  }
}

// Sample data generator (replace with real market data API)
function generateSampleData(symbol, resolution, from, to) {
  const bars = [];
  const timeInterval = getTimeInterval(resolution);
  let currentTime = from;
  let price = 1.1000 + Math.random() * 0.1; // Starting price around 1.1000

  while (currentTime <= to) {
    const open = price;
    const change = (Math.random() - 0.5) * 0.002; // ±0.002 price change
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
      volume
    });

    price = close;
    currentTime += timeInterval;
  }

  return bars;
}

function getTimeInterval(resolution) {
  const intervals = {
    '1': 60,
    '5': 300,
    '15': 900,
    '30': 1800,
    '60': 3600,
    '240': 14400,
    '1D': 86400,
    '1W': 604800,
    '1M': 2592000
  };
  return intervals[resolution] || 3600;
}

// Fetch real market data (implement with your preferred data provider)
async function fetchMarketData(symbol, timeframe) {
  // This is where you would integrate with real market data APIs
  // For example: Binance, Alpha Vantage, TradingView, etc.
  
  // For now, return sample data
  const now = Math.floor(Date.now() / 1000);
  const from = now - (100 * getTimeInterval(timeframe)); // Last 100 bars
  
  return generateSampleData(symbol, timeframe, from, now);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;

sequelize.sync({ force: false }).then(async () => {
  console.log('📊 Database connection established successfully');
  
  // Initialize and start the Butterfly pattern scanner
  try {
    await butterflyScanner.initialize();
    await butterflyScanner.startScanning();
    console.log('🦋 Real Butterfly pattern detection initialized and running');
  } catch (error) {
    console.error('❌ Failed to initialize Butterfly scanner:', error);
  }
  
  server.listen(PORT, () => {
    console.log(`🚀 Harmonic Pattern Scanner Server running on port ${PORT}`);
    console.log(`🔗 WebSocket server ready for real-time pattern updates`);
    console.log(`📈 Visit http://localhost:${PORT} to access the application`);
  });
}).catch(err => {
  console.error('❌ Unable to connect to database:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Gracefully shutting down Butterfly pattern scanner...');
  butterflyScanner.stopScanning();
  process.exit(0);
});

module.exports = { app, server, io };
