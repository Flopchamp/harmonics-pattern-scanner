import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Chart from './components/Chart';
import PatternList from './components/PatternList';
import Settings from './components/Settings';
import Notifications from './components/Notifications';

const App = () => {
  const [socket, setSocket] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState('EURUSD');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1H');
  const [patterns, setPatterns] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({
    fibonacciTolerance: 0.05,
    enableTelegram: false,
    timeframes: ['5M', '15M', '1H', '4H', '1D'],
    symbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD']
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    // Connect to WebSocket for real-time pattern updates
    if (socket) {
      socket.emit('joinSymbol', { symbol: selectedSymbol, timeframe: selectedTimeframe });
      
      // Request historical patterns for the symbol
      socket.emit('getPatterns', { symbol: selectedSymbol, timeframe: selectedTimeframe }, (response) => {
        if (response && response.patterns) {
          setPatterns(response.patterns);
          setNotifications(prev => [...prev, {
            id: Date.now(),
            type: 'info',
            message: `Loaded ${response.patterns.length} patterns for ${selectedSymbol}`,
            timestamp: new Date()
          }]);
        }
      });
    }
  }, [selectedSymbol, selectedTimeframe, socket]);

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = io(process.env.REACT_APP_WS_URL || 'ws://localhost:5000');
    
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    newSocket.on('newPattern', (pattern) => {
      setPatterns(prev => [pattern, ...prev].slice(0, 100)); // Keep last 100 patterns
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'pattern',
        message: `New ${pattern.type} pattern detected on ${pattern.symbol} (${pattern.timeframe})`,
        timestamp: new Date(),
        pattern
      }]);
    });

    newSocket.on('priceUpdate', (data) => {
      // Handle real-time price updates
      console.log('Price update:', data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const updateSettings = (newSettings) => {
    setSettings(newSettings);
    // Send settings to backend
    if (socket) {
      socket.emit('updateSettings', newSettings);
    }
  };

  const handleSymbolChange = (symbol) => {
    setSelectedSymbol(symbol);
    if (socket) {
      socket.emit('subscribeToSymbol', { symbol, timeframe: selectedTimeframe });
    }
  };

  const handleTimeframeChange = (timeframe) => {
    setSelectedTimeframe(timeframe);
    if (socket) {
      socket.emit('subscribeToSymbol', { symbol: selectedSymbol, timeframe });
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Header */}
      <header className="bg-bg-secondary border-b border-border-color p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-accent-green">Harmonic Scanner</h1>
            <div className="flex items-center space-x-2">
              <select 
                value={selectedSymbol}
                onChange={(e) => handleSymbolChange(e.target.value)}
                className="bg-bg-tertiary border border-border-color rounded px-3 py-1 text-sm"
              >
                {settings.symbols.map(symbol => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </select>
              <select 
                value={selectedTimeframe}
                onChange={(e) => handleTimeframeChange(e.target.value)}
                className="bg-bg-tertiary border border-border-color rounded px-3 py-1 text-sm"
              >
                {settings.timeframes.map(tf => (
                  <option key={tf} value={tf}>{tf}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="bg-bg-tertiary hover:bg-border-color border border-border-color rounded px-4 py-2 text-sm transition-colors"
            >
              Settings
            </button>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${socket?.connected ? 'bg-accent-green' : 'bg-accent-red'}`}></div>
              <span className="text-xs text-text-secondary">
                {socket?.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-screen-minus-header">
        {/* Chart Area */}
        <div className="flex-1 p-4">
          <Chart 
            symbol={selectedSymbol}
            timeframe={selectedTimeframe}
            patterns={patterns.filter(p => p.symbol === selectedSymbol && p.timeframe === selectedTimeframe)}
          />
        </div>

        {/* Sidebar */}
        <div className="w-88 bg-bg-secondary border-l border-border-color">
          <PatternList 
            patterns={patterns}
            onPatternSelect={(pattern) => {
              setSelectedSymbol(pattern.symbol);
              setSelectedTimeframe(pattern.timeframe);
            }}
          />
        </div>
      </div>

      {/* Notifications */}
      <Notifications 
        notifications={notifications}
        onDismiss={dismissNotification}
      />

      {/* Settings Modal */}
      {isSettingsOpen && (
        <Settings 
          settings={settings}
          onClose={() => setIsSettingsOpen(false)}
          onSave={updateSettings}
        />
      )}
    </div>
  );
};

export default App;
