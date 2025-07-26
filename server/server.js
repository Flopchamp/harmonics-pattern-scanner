const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import services
const PatternDetector = require('./src/services/patternDetector');
const MarketDataService = require('./src/services/marketDataService');
const TelegramBot = require('./src/utils/telegramBot');

// Initialize services
const marketDataService = new MarketDataService();
const patternDetector = new PatternDetector();
let telegramBot;

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS configuration
const io = socketIo(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Harmonic Pattern Scanner API',
    version: '1.0.0'
  });
});

// Market data API endpoints
app.get('/api/market-data/:symbol/:timeframe', async (req, res) => {
  try {
    const { symbol, timeframe } = req.params;
    const { limit } = req.query;
    
    const data = await marketDataService.getHistoricalData(
      symbol.toUpperCase(), 
      timeframe, 
      parseInt(limit) || 200
    );
    
    res.json({
      success: true,
      symbol,
      timeframe,
      data,
      count: data.length,
      dataSource: marketDataService.isSimulation ? 'simulated' : 'real',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      symbol: req.params.symbol,
      timeframe: req.params.timeframe
    });
  }
});

// Real-time price endpoint
app.get('/api/realtime/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const priceData = await marketDataService.getRealTimeData(symbol.toUpperCase());
    
    res.json({
      success: true,
      symbol,
      data: priceData,
      dataSource: marketDataService.isSimulation ? 'simulated' : 'real',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      symbol: req.params.symbol
    });
  }
});

// Available symbols endpoint
app.get('/api/symbols', (req, res) => {
  res.json({
    success: true,
    symbols: marketDataService.getAvailableSymbols(),
    timeframes: marketDataService.getAvailableTimeframes(),
    dataSource: marketDataService.isSimulation ? 'simulated' : 'real'
  });
});

// WebSocket connection handling
const connectedClients = new Map();

io.on('connection', (socket) => {
  console.log(`📡 Client connected: ${socket.id}`);
  
  // Handle pattern detection requests
  socket.on('getPatterns', async (data, callback) => {
    try {
      const { symbol, timeframe, limit } = data;
      console.log(`🔍 Pattern request: ${symbol} ${timeframe}`);
      
      // Get market data and detect patterns
      const marketData = await marketDataService.getHistoricalData(
        symbol, 
        timeframe || '1H', 
        limit || 200
      );
      
      if (marketData && marketData.length >= 50) {
        const patterns = await patternDetector.detectAllPatterns(marketData, { 
          symbol, 
          timeframe: timeframe || '1H' 
        });
        
        if (callback) {
          callback({
            success: true,
            patterns: patterns,
            count: patterns.length,
            dataSource: marketDataService.isSimulation ? 'simulated' : 'real'
          });
        }
        
        console.log(`✅ Found ${patterns.length} patterns for ${symbol}`);
      } else {
        if (callback) {
          callback({
            success: false,
            error: 'Insufficient market data',
            patterns: []
          });
        }
      }
    } catch (error) {
      console.error('❌ Error getting patterns:', error);
      if (callback) {
        callback({
          success: false,
          error: error.message,
          patterns: []
        });
      }
    }
  });

  // Handle symbol subscription
  socket.on('joinSymbol', (data) => {
    const { symbol, timeframe } = data;
    const roomName = `${symbol}_${timeframe}`;
    socket.join(roomName);
    console.log(`📊 Client ${socket.id} joined ${roomName}`);
  });

  // Handle settings updates
  socket.on('updateSettings', (settings) => {
    console.log(`⚙️ Settings updated for ${socket.id}:`, settings);
  });

  // Handle client disconnect
  socket.on('disconnect', (reason) => {
    console.log(`📡 Client ${socket.id} disconnected: ${reason}`);
    connectedClients.delete(socket.id);
  });
});

// Initialize services
const initializeServices = async () => {
  try {
    // Initialize market data service
    await marketDataService.initialize();
    console.log('✅ Market data service initialized');
    
    // Initialize Telegram bot if token is provided
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN !== 'your_telegram_bot_token_from_botfather') {
      telegramBot = new TelegramBot();
      console.log('✅ Telegram bot initialized');
    } else {
      console.log('⚠️  Telegram bot disabled (no valid token configured)');
    }
    
    // Start real-time pattern detection
    startRealTimePatternDetection();
    
  } catch (error) {
    console.error('❌ Error initializing services:', error);
  }
};

// Real-time pattern detection system
const startRealTimePatternDetection = () => {
  const detectionInterval = parseInt(process.env.PATTERN_DETECTION_INTERVAL) || 30000; // 30 seconds
  
  console.log(`🔍 Starting real-time pattern detection (interval: ${detectionInterval}ms)`);
  
  setInterval(async () => {
    try {
      const symbols = marketDataService.getAvailableSymbols();
      const timeframes = ['1H', '4H']; // Focus on key timeframes
      
      for (const symbol of symbols) {
        for (const timeframe of timeframes) {
          try {
            // Get latest market data
            const marketData = await marketDataService.getHistoricalData(symbol, timeframe, 200);
            
            if (marketData && marketData.length >= 50) {
              // Detect patterns
              const patterns = await patternDetector.detectAllPatterns(marketData, {
                symbol,
                timeframe
              });
              
              // Broadcast new patterns
              if (patterns && patterns.length > 0) {
                patterns.forEach(pattern => {
                  // Only broadcast if pattern is newly completed
                  if (pattern.status === 'completed' && pattern.confidence > 0.7) {
                    io.to(`${symbol}_${timeframe}`).emit('newPattern', {
                      ...pattern,
                      timestamp: new Date().toISOString()
                    });
                    
                    // Send Telegram notification if configured
                    if (telegramBot && telegramBot.isEnabled()) {
                      telegramBot.sendPatternAlert(pattern);
                    }
                    
                    console.log(`🎯 New ${pattern.type} pattern detected: ${symbol} (${timeframe}) - ${(pattern.confidence * 100).toFixed(1)}%`);
                  }
                });
              }
            }
          } catch (error) {
            console.warn(`⚠️  Pattern detection failed for ${symbol} ${timeframe}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error in real-time pattern detection:', error);
    }
  }, detectionInterval);
};

// Database initialization and server startup
const startServer = async () => {
  try {
    // Initialize services
    await initializeServices();
    
    // Start server
    server.listen(PORT, () => {
      console.log(`\n🚀 Harmonic Pattern Scanner Server`);
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🔗 API Health Check: http://localhost:${PORT}/health`);
      console.log(`📊 Market Data API: http://localhost:${PORT}/api/symbols`);
      console.log(`💡 WebSocket ready for real-time pattern updates`);
      console.log(`📈 Data Source: ${marketDataService.isSimulation ? 'Simulated' : 'Real Market Data'}\n`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer().catch(console.error);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
