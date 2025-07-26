import React, { useState } from 'react';

const PatternList = ({ patterns, onPatternSelect }) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');

  const patternTypes = ['all', 'Gartley', 'Bat', 'Butterfly', 'Crab', 'Cypher', 'Shark', 'ABCD'];
  
  const filteredPatterns = patterns.filter(pattern => 
    filter === 'all' || pattern.type === filter
  );

  const sortedPatterns = [...filteredPatterns].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'timestamp') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getPatternColor = (type) => {
    const colors = {
      'Gartley': 'text-green-400',
      'Bat': 'text-blue-400',
      'Butterfly': 'text-orange-400',
      'Crab': 'text-red-400',
      'Cypher': 'text-purple-400',
      'Shark': 'text-gray-400',
      'ABCD': 'text-yellow-400'
    };
    return colors[type] || 'text-white';
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      'forming': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'completed': 'bg-green-500/20 text-green-400 border-green-500/30',
      'invalidated': 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    
    return statusStyles[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateProbability = (pattern) => {
    // Simple probability calculation based on pattern completion and Fibonacci accuracy
    if (!pattern.fibonacciRatios) return 65;
    
    const ratios = pattern.fibonacciRatios;
    let accuracy = 0;
    let count = 0;
    
    Object.values(ratios).forEach(ratio => {
      if (ratio.actual && ratio.expected) {
        const deviation = Math.abs(ratio.actual - ratio.expected) / ratio.expected;
        accuracy += Math.max(0, 1 - deviation);
        count++;
      }
    });
    
    const avgAccuracy = count > 0 ? accuracy / count : 0.5;
    return Math.round(avgAccuracy * 100);
  };

  return (
    <div className="h-full flex flex-col bg-bg-secondary">
      {/* Header */}
      <div className="p-4 border-b border-border-color">
        <h2 className="text-lg font-semibold mb-4">Detected Patterns</h2>
        
        {/* Filters */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-text-secondary mb-1">Filter by Type</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-bg-tertiary border border-border-color rounded px-2 py-1 text-sm"
            >
              {patternTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Patterns' : type}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex space-x-2">
            <div className="flex-1">
              <label className="block text-xs text-text-secondary mb-1">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-bg-tertiary border border-border-color rounded px-2 py-1 text-sm"
              >
                <option value="timestamp">Time</option>
                <option value="type">Type</option>
                <option value="symbol">Symbol</option>
                <option value="probability">Probability</option>
              </select>
            </div>
            
            <div className="flex-1">
              <label className="block text-xs text-text-secondary mb-1">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full bg-bg-tertiary border border-border-color rounded px-2 py-1 text-sm"
              >
                <option value="desc">Newest</option>
                <option value="asc">Oldest</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Pattern Count */}
      <div className="px-4 py-2 bg-bg-tertiary border-b border-border-color">
        <div className="text-xs text-text-secondary">
          {sortedPatterns.length} pattern{sortedPatterns.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Pattern List */}
      <div className="flex-1 overflow-y-auto">
        {sortedPatterns.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-secondary">
            <div className="text-center">
              <div className="text-4xl mb-2">📈</div>
              <div>No patterns detected</div>
              <div className="text-xs mt-1">Patterns will appear here when detected</div>
            </div>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {sortedPatterns.map((pattern, index) => (
              <div
                key={`${pattern.id}-${index}`}
                onClick={() => onPatternSelect(pattern)}
                className="bg-bg-tertiary border border-border-color rounded-lg p-3 hover:bg-bg-primary cursor-pointer transition-colors"
              >
                {/* Pattern Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`font-semibold ${getPatternColor(pattern.type)}`}>
                      {pattern.type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs border ${getStatusBadge(pattern.status)}`}>
                      {pattern.status}
                    </span>
                  </div>
                  <div className="text-xs text-text-secondary">
                    {calculateProbability(pattern)}%
                  </div>
                </div>

                {/* Pattern Details */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-text-secondary">Symbol:</span>
                    <span className="ml-1 font-medium">{pattern.symbol}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Timeframe:</span>
                    <span className="ml-1 font-medium">{pattern.timeframe}</span>
                  </div>
                </div>

                {/* Fibonacci Ratios */}
                {pattern.fibonacciRatios && (
                  <div className="mt-2 pt-2 border-t border-border-color">
                    <div className="text-xs text-text-secondary mb-1">Fibonacci Ratios</div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {Object.entries(pattern.fibonacciRatios).slice(0, 4).map(([key, ratio]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-text-secondary">{key}:</span>
                          <span className={ratio.isValid ? 'text-accent-green' : 'text-accent-red'}>
                            {ratio.actual?.toFixed(3) || 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                <div className="mt-2 pt-2 border-t border-border-color">
                  <div className="text-xs text-text-secondary">
                    Detected: {formatTime(pattern.timestamp)}
                  </div>
                </div>

                {/* Trading Levels */}
                {pattern.tradingLevels && (
                  <div className="mt-2 pt-2 border-t border-border-color">
                    <div className="text-xs text-text-secondary mb-1">Trading Levels</div>
                    <div className="grid grid-cols-3 gap-1 text-xs">
                      <div>
                        <span className="text-text-secondary">Entry:</span>
                        <div className="font-medium text-accent-blue">
                          {pattern.tradingLevels.entry?.toFixed(5)}
                        </div>
                      </div>
                      <div>
                        <span className="text-text-secondary">SL:</span>
                        <div className="font-medium text-accent-red">
                          {pattern.tradingLevels.stopLoss?.toFixed(5)}
                        </div>
                      </div>
                      <div>
                        <span className="text-text-secondary">TP:</span>
                        <div className="font-medium text-accent-green">
                          {pattern.tradingLevels.takeProfit?.toFixed(5)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-border-color bg-bg-tertiary">
        <div className="grid grid-cols-3 gap-2 text-xs text-center">
          <div>
            <div className="font-semibold text-accent-green">
              {patterns.filter(p => p.status === 'completed').length}
            </div>
            <div className="text-text-secondary">Completed</div>
          </div>
          <div>
            <div className="font-semibold text-yellow-400">
              {patterns.filter(p => p.status === 'forming').length}
            </div>
            <div className="text-text-secondary">Forming</div>
          </div>
          <div>
            <div className="font-semibold text-accent-red">
              {patterns.filter(p => p.status === 'invalidated').length}
            </div>
            <div className="text-text-secondary">Invalid</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatternList;
