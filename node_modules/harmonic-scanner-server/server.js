const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const { Sequelize } = require('sequelize');

// Load environment variables
dotenv.config();

// Import routes
const patternsRoutes = require('./src/routes/patterns');
const usersRoutes = require('./src/routes/users');

// Import models
const { sequelize } = require('./src/models');

// Import services
const PatternDetector = require('./src/services/patternDetector');
const MarketDataService = require('./src/services/marketDataService');
const TelegramBot = require('./src/utils/telegramBot');

// Initialize services
const marketDataService = new MarketDataService();
const patternDetector = new PatternDetector();
const telegramBot = new TelegramBot();

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

// API Routes
app.use('/api/patterns', patternsRoutes);
app.use('/api/users', usersRoutes);

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
  console.log(`Client connected: ${socket.id}`);
  
  // Store user information
  socket.on('user_connect', (userData) => {
    connectedClients.set(socket.id, {
      userId: userData.userId,
      username: userData.username,
      connectedAt: new Date()
    });
    
    console.log(`User ${userData.username} connected with socket ${socket.id}`);
    
    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to Harmonic Pattern Scanner',
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle pattern subscription
  socket.on('subscribe_patterns', (data) => {
    const { symbols, patterns } = data;
    
    // Join rooms for specific symbols and patterns
    if (symbols && Array.isArray(symbols)) {
      symbols.forEach(symbol => {
        socket.join(`patterns_${symbol}`);
      });
    }
    
    if (patterns && Array.isArray(patterns)) {
      patterns.forEach(pattern => {
        socket.join(`pattern_type_${pattern}`);
      });
    }
    
    console.log(`Socket ${socket.id} subscribed to patterns:`, { symbols, patterns });
    
    socket.emit('subscription_confirmed', {
      symbols,
      patterns,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle unsubscription
  socket.on('unsubscribe_patterns', (data) => {
    const { symbols, patterns } = data;
    
    if (symbols && Array.isArray(symbols)) {
      symbols.forEach(symbol => {
        socket.leave(`patterns_${symbol}`);
      });
    }
    
    if (patterns && Array.isArray(patterns)) {
      patterns.forEach(pattern => {
        socket.leave(`pattern_type_${pattern}`);
      });
    }
    
    console.log(`Socket ${socket.id} unsubscribed from patterns:`, { symbols, patterns });
  });
  
  // Handle real-time pattern detection request
  socket.on('detect_patterns_realtime', async (data) => {
    try {
      const { symbol, timeframe } = data;
      console.log(`🔍 Real-time pattern detection requested for ${symbol} (${timeframe})`);
      
      if (!symbol) {
        socket.emit('error', {
          message: 'Symbol is required for pattern detection'
        });
        return;
      }
      
      // Join the symbol-specific room for updates
      socket.join(`patterns_${symbol}`);
      
      // Get real market data
      const marketData = await marketDataService.getHistoricalData(symbol, timeframe || '1H', 200);
      
      if (!marketData || marketData.length < 50) {
        socket.emit('error', {
          message: 'Insufficient market data for pattern detection',
          symbol,
          timeframe
        });
        return;
      }
      
      // Detect patterns using real data
      const detectedPatterns = await patternDetector.detectAllPatterns(marketData, {
        symbol,
        timeframe: timeframe || '1H'
      });
      
      // Send patterns back to client
      socket.emit('patterns_detected', {
        symbol,
        timeframe,
        patterns: detectedPatterns,
        dataSource: marketDataService.isSimulation ? 'simulated' : 'real',
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ Detected ${detectedPatterns.length} patterns for ${symbol} (${timeframe})`);
      
    } catch (error) {
      console.error('❌ Error in pattern detection:', error);
      socket.emit('error', {
        message: 'Failed to detect patterns',
        error: error.message,
        symbol: data.symbol,
        timeframe: data.timeframe
      });
    }
  });
      
      // Initialize pattern detector
      const detector = new PatternDetector();
      
      // Detect patterns
      const detectedPatterns = await detector.detectAllPatterns(priceData, {
        symbol,
        timeframe: timeframe || '1H'
      });
      
      // Emit detected patterns to the requesting client
      socket.emit('patterns_detected', {
        symbol,
        timeframe,
        patterns: detectedPatterns,
        timestamp: new Date().toISOString()
      });
      
      // Broadcast to other subscribers of this symbol
      socket.to(`patterns_${symbol}`).emit('pattern_update', {
        symbol,
        patterns: detectedPatterns,
        timestamp: new Date().toISOString()
      });
      
      console.log(`Real-time pattern detection completed for ${symbol}: ${detectedPatterns.length} patterns found`);
      
    } catch (error) {
      console.error('Error in real-time pattern detection:', error);
      socket.emit('error', {
        message: 'Failed to detect patterns',
        error: error.message
      });
    }
  });
  
  // Handle client disconnect
  socket.on('disconnect', (reason) => {
    const clientInfo = connectedClients.get(socket.id);
    if (clientInfo) {
      console.log(`User ${clientInfo.username} disconnected: ${reason}`);
      connectedClients.delete(socket.id);
    } else {
      console.log(`Client ${socket.id} disconnected: ${reason}`);
    }
  });
  
  // Handle errors
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

// Broadcast functions for pattern notifications
const broadcastPatternDetected = (pattern) => {
  io.to(`patterns_${pattern.symbol}`).emit('pattern_detected', {
    pattern,
    timestamp: new Date().toISOString()
  });
  
  io.to(`pattern_type_${pattern.type}`).emit('pattern_detected', {
    pattern,
    timestamp: new Date().toISOString()
  });
  
  console.log(`Broadcasted pattern detection: ${pattern.type} on ${pattern.symbol}`);
};

const broadcastPatternUpdated = (pattern) => {
  io.to(`patterns_${pattern.symbol}`).emit('pattern_updated', {
    pattern,
    timestamp: new Date().toISOString()
  });
  
  console.log(`Broadcasted pattern update: ${pattern.id} status changed to ${pattern.status}`);
};

// Make broadcast functions available globally
global.io = io;
global.broadcastPatternDetected = broadcastPatternDetected;
global.broadcastPatternUpdated = broadcastPatternUpdated;

const initializeServices = async () => {
  try {
    // Initialize market data service
    await marketDataService.initialize();
    console.log('✅ Market data service initialized');
    
    // Initialize pattern detector
    console.log('✅ Pattern detector initialized');
    
    // Initialize Telegram bot if token is provided
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN !== 'your_telegram_bot_token_from_botfather') {
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
                    io.to(`patterns_${symbol}`).emit('newPattern', {
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
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully');
    
    // Sync database models
    await sequelize.sync({ 
      alter: process.env.NODE_ENV === 'development',
      force: false // Set to true only for development if you want to recreate tables
    });
    console.log('Database models synchronized');
    
    // Initialize services
    await initializeServices();
    
    // Start server
    server.listen(PORT, () => {
      console.log(`\n🚀 Harmonic Pattern Scanner Server`);
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🔗 WebSocket endpoint: ws://localhost:${PORT}`);
      console.log(`🌐 API endpoint: http://localhost:${PORT}/api`);
      console.log(`💾 Database: ${process.env.DB_NAME} on ${process.env.DB_HOST}`);
      console.log(`📊 Connected clients: ${connectedClients.size}`);
      console.log(`🕐 Started at: ${new Date().toISOString()}\n`);
    });
    
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  // Close WebSocket connections
  io.close();
  
  // Close database connection
  await sequelize.close();
  
  // Close HTTP server
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  
  // Close WebSocket connections
  io.close();
  
  // Close database connection
  await sequelize.close();
  
  // Close HTTP server
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
