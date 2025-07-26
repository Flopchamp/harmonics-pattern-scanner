import React, { useState } from 'react';

const Settings = ({ settings, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    ...settings,
    telegramBotToken: '',
    telegramChatId: ''
  });

  const handleInputChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleArrayInputChange = (key, value) => {
    const array = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({
      ...prev,
      [key]: array
    }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleTestTelegram = async () => {
    try {
      const response = await fetch('/api/test-telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botToken: formData.telegramBotToken,
          chatId: formData.telegramChatId
        })
      });
      
      if (response.ok) {
        alert('Telegram test message sent successfully!');
      } else {
        alert('Failed to send test message. Please check your credentials.');
      }
    } catch (error) {
      alert('Error testing Telegram connection.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-bg-secondary border border-border-color rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-border-color">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Settings</h2>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Pattern Detection Settings */}
          <div>
            <h3 className="text-lg font-medium mb-4">Pattern Detection</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Fibonacci Tolerance (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={formData.fibonacciTolerance * 100}
                  onChange={(e) => handleInputChange('fibonacciTolerance', parseFloat(e.target.value) / 100)}
                  className="w-full bg-bg-tertiary border border-border-color rounded px-3 py-2 text-sm"
                />
                <p className="text-xs text-text-secondary mt-1">
                  Allowable deviation from perfect Fibonacci ratios (recommended: 3-7%)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Minimum Pattern Bars
                </label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={formData.minPatternBars || 20}
                  onChange={(e) => handleInputChange('minPatternBars', parseInt(e.target.value))}
                  className="w-full bg-bg-tertiary border border-border-color rounded px-3 py-2 text-sm"
                />
                <p className="text-xs text-text-secondary mt-1">
                  Minimum number of bars required for pattern formation
                </p>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.enableMlFilter || false}
                    onChange={(e) => handleInputChange('enableMlFilter', e.target.checked)}
                    className="rounded border-border-color bg-bg-tertiary"
                  />
                  <span className="text-sm">Enable ML Pattern Filter</span>
                </label>
                <p className="text-xs text-text-secondary mt-1 ml-6">
                  Use machine learning to reduce false positive patterns
                </p>
              </div>
            </div>
          </div>

          {/* Timeframes */}
          <div>
            <h3 className="text-lg font-medium mb-4">Timeframes</h3>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Enabled Timeframes (comma-separated)
              </label>
              <input
                type="text"
                value={formData.timeframes.join(', ')}
                onChange={(e) => handleArrayInputChange('timeframes', e.target.value)}
                placeholder="5M, 15M, 1H, 4H, 1D"
                className="w-full bg-bg-tertiary border border-border-color rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Symbols */}
          <div>
            <h3 className="text-lg font-medium mb-4">Trading Symbols</h3>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Watched Symbols (comma-separated)
              </label>
              <textarea
                value={formData.symbols.join(', ')}
                onChange={(e) => handleArrayInputChange('symbols', e.target.value)}
                placeholder="EURUSD, GBPUSD, USDJPY, AUDUSD, USDCAD, NZDUSD"
                rows="3"
                className="w-full bg-bg-tertiary border border-border-color rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Telegram Notifications */}
          <div>
            <h3 className="text-lg font-medium mb-4">Telegram Notifications</h3>
            <div className="space-y-4">
              <div>
                <label className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    checked={formData.enableTelegram}
                    onChange={(e) => handleInputChange('enableTelegram', e.target.checked)}
                    className="rounded border-border-color bg-bg-tertiary"
                  />
                  <span className="text-sm">Enable Telegram Notifications</span>
                </label>
              </div>

              {formData.enableTelegram && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Bot Token
                    </label>
                    <input
                      type="password"
                      value={formData.telegramBotToken}
                      onChange={(e) => handleInputChange('telegramBotToken', e.target.value)}
                      placeholder="Enter your Telegram bot token"
                      className="w-full bg-bg-tertiary border border-border-color rounded px-3 py-2 text-sm"
                    />
                    <p className="text-xs text-text-secondary mt-1">
                      Get this from @BotFather on Telegram
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Chat ID
                    </label>
                    <input
                      type="text"
                      value={formData.telegramChatId}
                      onChange={(e) => handleInputChange('telegramChatId', e.target.value)}
                      placeholder="Enter your chat ID"
                      className="w-full bg-bg-tertiary border border-border-color rounded px-3 py-2 text-sm"
                    />
                    <p className="text-xs text-text-secondary mt-1">
                      Your user ID or group chat ID
                    </p>
                  </div>

                  <button
                    onClick={handleTestTelegram}
                    className="bg-accent-blue hover:bg-blue-600 text-white px-4 py-2 rounded text-sm transition-colors"
                  >
                    Test Connection
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Alert Settings */}
          <div>
            <h3 className="text-lg font-medium mb-4">Alert Preferences</h3>
            <div className="space-y-4">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.alertOnPatternFormation || true}
                    onChange={(e) => handleInputChange('alertOnPatternFormation', e.target.checked)}
                    className="rounded border-border-color bg-bg-tertiary"
                  />
                  <span className="text-sm">Alert on pattern formation</span>
                </label>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.alertOnPatternCompletion || true}
                    onChange={(e) => handleInputChange('alertOnPatternCompletion', e.target.checked)}
                    className="rounded border-border-color bg-bg-tertiary"
                  />
                  <span className="text-sm">Alert on pattern completion</span>
                </label>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.alertOnPatternInvalidation || false}
                    onChange={(e) => handleInputChange('alertOnPatternInvalidation', e.target.checked)}
                    className="rounded border-border-color bg-bg-tertiary"
                  />
                  <span className="text-sm">Alert on pattern invalidation</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Minimum Probability for Alerts (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.minAlertProbability || 70}
                  onChange={(e) => handleInputChange('minAlertProbability', parseInt(e.target.value))}
                  className="w-full bg-bg-tertiary border border-border-color rounded px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Data Source */}
          <div>
            <h3 className="text-lg font-medium mb-4">Data Source</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Price Data Provider
                </label>
                <select
                  value={formData.dataProvider || 'binance'}
                  onChange={(e) => handleInputChange('dataProvider', e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-color rounded px-3 py-2 text-sm"
                >
                  <option value="binance">Binance</option>
                  <option value="alphavantage">Alpha Vantage</option>
                  <option value="tradingview">TradingView</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Update Interval (seconds)
                </label>
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={formData.updateInterval || 5}
                  onChange={(e) => handleInputChange('updateInterval', parseInt(e.target.value))}
                  className="w-full bg-bg-tertiary border border-border-color rounded px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-color flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-text-secondary hover:text-text-primary border border-border-color rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-accent-green hover:bg-green-600 text-white rounded transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
