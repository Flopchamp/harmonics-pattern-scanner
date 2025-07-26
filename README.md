# Harmonic Pattern Scanner

A real-time harmonic pattern scanner application with TradingView integration that detects and analyzes harmonic patterns in financial markets.

## Features

- **Real-time Pattern Detection**: Automatically detect 7 harmonic patterns (ABCD, Gartley, Bat, Butterfly, Crab, Cypher, Shark)
- **TradingView Integration**: Interactive charts with pattern overlays
- **Responsive Design**: Optimized for desktop and mobile devices
- **Live Notifications**: Real-time alerts via web and Telegram
- **Pattern Analysis**: Comprehensive statistics and validation
- **User Management**: Account creation and preference management

## Harmonic Patterns Supported

1. **ABCD Pattern** - Classic harmonic structure
2. **Gartley Pattern** - 222 pattern with specific Fibonacci ratios
3. **Bat Pattern** - Deep retracement pattern
4. **Butterfly Pattern** - Extension pattern beyond X point
5. **Crab Pattern** - Extreme harmonic pattern
6. **Cypher Pattern** - Advanced harmonic structure
7. **Shark Pattern** - Deep harmonic retracement

## Technology Stack

### Frontend
- React 18.2.0
- Tailwind CSS 3.3.2
- TradingView Charting Library
- Socket.io Client

### Backend
- Node.js with Express.js 4.18.2
- MySQL with Sequelize ORM
- Socket.io for WebSocket communication
- Telegram Bot API integration

## Installation

### Prerequisites
- Node.js 18+ and npm
- MySQL 8.0+
- TradingView Charting Library access

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd harmonic-scanner
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Database Setup**
   ```bash
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE harmonic_scanner;
   ```

4. **Environment Configuration**
   ```bash
   # Copy environment templates
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

5. **Configure Environment Variables**

   **Server (.env):**
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=harmonic_scanner
   DB_USER=root
   DB_PASSWORD=your_password

   # JWT Secret
   JWT_SECRET=your_jwt_secret_key

   # Telegram Bot Configuration
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token

   # Server Configuration
   PORT=5000
   NODE_ENV=development
   ```

   **Client (.env):**
   ```env
   # API Configuration
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_WS_URL=http://localhost:5000

   # TradingView Configuration
   REACT_APP_TRADINGVIEW_LIBRARY_PATH=/charting_library/
   ```

6. **Start the Application**
   ```bash
   # Start server (from server directory)
   npm run dev

   # Start client (from client directory)
   npm start
   ```

## Usage

### Web Interface

1. **Access the application**: http://localhost:3000
2. **Register an account** or log in with existing credentials
3. **Configure preferences** in the Settings panel
4. **Monitor patterns** in real-time on the dashboard
5. **Analyze patterns** using the interactive TradingView charts

### Pattern Detection

The application automatically scans for harmonic patterns based on:
- **Fibonacci ratios** specific to each pattern type
- **Price action validation** with configurable tolerances
- **Real-time market data** from TradingView feeds

### Telegram Notifications

1. **Create a Telegram bot** via @BotFather
2. **Get your chat ID** by messaging @userinfobot
3. **Configure in Settings** with bot token and chat ID
4. **Receive instant alerts** when patterns are detected

## API Documentation

### Authentication Endpoints

- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile (auth required)
- `PUT /api/users/preferences` - Update preferences (auth required)

### Pattern Endpoints

- `GET /api/patterns` - Get patterns with filtering
- `POST /api/patterns/detect` - Trigger pattern detection
- `PUT /api/patterns/:id/status` - Update pattern status
- `DELETE /api/patterns/:id` - Delete pattern
- `GET /api/patterns/stats/summary` - Get pattern statistics

### WebSocket Events

- `pattern_detected` - New pattern found
- `pattern_updated` - Pattern status changed
- `user_connected` - User connection established
- `error` - Error notifications

## Pattern Detection Algorithm

### Fibonacci Ratios

Each harmonic pattern uses specific Fibonacci ratios:

```javascript
// Gartley Pattern
const gartleyRatios = {
  XA_AB: { min: 0.618, max: 0.618 },
  AB_BC: { min: 0.382, max: 0.886 },
  BC_CD: { min: 1.13, max: 1.618 },
  XA_AD: { min: 0.786, max: 0.786 }
};
```

### Validation Process

1. **Point identification** using swing highs/lows
2. **Ratio calculation** between pattern legs
3. **Tolerance checking** within acceptable ranges
4. **Pattern completion** validation
5. **Trend analysis** and projection

## Configuration

### Pattern Detection Settings

```javascript
const patternConfig = {
  tolerance: 0.05,        // 5% tolerance for Fibonacci ratios
  minBars: 10,           // Minimum bars between points
  maxBars: 100,          // Maximum bars for pattern completion
  enabledPatterns: [     // Patterns to detect
    'gartley', 'bat', 'butterfly', 'crab', 
    'cypher', 'shark', 'abcd'
  ]
};
```

### Notification Settings

```javascript
const notificationConfig = {
  enableWeb: true,       // Browser notifications
  enableTelegram: true,  // Telegram alerts
  enableEmail: false,    // Email notifications (future)
  minConfidence: 0.8,    // Minimum pattern confidence
  enableSound: true      // Audio alerts
};
```

## Development

### Project Structure

```
harmonic-scanner/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── utils/         # Utility functions
│   ├── public/            # Static assets
│   └── package.json
├── server/                # Node.js backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── models/        # Database models
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utility functions
│   └── package.json
└── README.md
```

### Testing

```bash
# Run server tests
cd server
npm test

# Run client tests
cd client
npm test
```

### Building for Production

```bash
# Build client
cd client
npm run build

# Start production server
cd server
npm start
```

## Pine Script Integration

The application includes Pine Script files for TradingView indicators:

- `harmonic_patterns.pine` - Main pattern detection script
- `pattern_overlay.pine` - Chart overlay for patterns
- `pattern_alerts.pine` - Alert system integration

2. **Set up environment variables:**
   Create `.env` files in both client and server directories with your configuration.

3. **Start development servers:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Tech Stack

- **Frontend:** React, Tailwind CSS, TradingView Charting Library
- **Backend:** Node.js, Express.js, WebSocket
- **Database:** MySQL with Sequelize ORM
- **Notifications:** Telegram Bot API
- **Pattern Detection:** JavaScript with Fibonacci calculations

## Harmonic Patterns Supported

1. **ABCD Pattern:** Equal AB and CD legs or Fibonacci-based extensions
2. **Gartley Pattern:** AB = 61.8% XA, BC = 38.2%–78.6% AB, CD = 1.272–1.618 AB
3. **Bat Pattern:** AB = 38.2%–50% XA, BC = 38.2%–88.6% AB, CD = 88.6% XA
4. **Butterfly Pattern:** AB = 78.6% XA, BC = 38.2%–88.6% AB, CD = 1.618–2.618 AB
5. **Crab Pattern:** AB = 38.2%–61.8% XA, BC = 38.2%–88.6% AB, CD = 2.24–3.618 AB
6. **Cypher Pattern:** AB = 38.2%–61.8% XA, BC = 1.272–1.414 XA, CD = 0.786 XC
7. **Shark Pattern:** AB = 1.13–1.618 XA, BC = 113% 0X, CD = 50% BC (five-leg pattern)

## Configuration

### Environment Variables

**Client (.env):**
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=ws://localhost:5000
```

**Server (.env):**
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=harmonic_scanner
TELEGRAM_BOT_TOKEN=your_telegram_token
TELEGRAM_CHAT_ID=your_chat_id
JWT_SECRET=your_jwt_secret
```

## API Endpoints

- `GET /api/price-data?symbol={}&timeframe={}` - Fetch real-time price data
- `GET /api/patterns?symbol={}&timeframe={}` - Get detected patterns
- `POST /api/users` - User management
- `WebSocket /ws` - Real-time data updates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details.
