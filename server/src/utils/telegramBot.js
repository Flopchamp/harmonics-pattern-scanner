const TelegramBot = require('node-telegram-bot-api');

class TelegramBotService {
  constructor() {
    this.bot = null;
    this.chatIds = [];
    this.isInitialized = false;
    
    if (process.env.TELEGRAM_BOT_TOKEN) {
      this.initialize();
    }
  }

  /**
   * Initialize Telegram bot
   */
  initialize() {
    try {
      this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
      
      if (process.env.TELEGRAM_CHAT_ID) {
        this.chatIds = process.env.TELEGRAM_CHAT_ID.split(',').map(id => id.trim());
      }
      
      this.isInitialized = true;
      console.log('Telegram bot initialized successfully');
      
      // Test connection
      this.bot.getMe().then(info => {
        console.log(`Telegram bot connected: @${info.username}`);
      }).catch(err => {
        console.error('Telegram bot connection failed:', err.message);
        this.isInitialized = false;
      });
      
    } catch (error) {
      console.error('Failed to initialize Telegram bot:', error.message);
      this.isInitialized = false;
    }
  }

  /**
   * Check if bot is enabled and ready
   */
  isEnabled() {
    return this.isInitialized && this.bot && this.chatIds.length > 0;
  }

  /**
   * Send pattern alert to Telegram
   */
  async sendPatternAlert(pattern) {
    if (!this.isEnabled()) {
      return false;
    }

    try {
      const message = this.formatPatternMessage(pattern);
      
      for (const chatId of this.chatIds) {
        await this.bot.sendMessage(chatId, message, {
          parse_mode: 'HTML',
          disable_web_page_preview: true
        });
      }
      
      console.log(`Telegram alert sent for ${pattern.type} pattern on ${pattern.symbol}`);
      return true;
      
    } catch (error) {
      console.error('Failed to send Telegram alert:', error.message);
      return false;
    }
  }

  /**
   * Send custom message to Telegram
   */
  async sendMessage(message, chatId = null) {
    if (!this.isEnabled()) {
      return false;
    }

    try {
      const targets = chatId ? [chatId] : this.chatIds;
      
      for (const target of targets) {
        await this.bot.sendMessage(target, message, {
          parse_mode: 'HTML'
        });
      }
      
      return true;
      
    } catch (error) {
      console.error('Failed to send Telegram message:', error.message);
      return false;
    }
  }

  /**
   * Test Telegram connection
   */
  async testConnection(botToken = null, chatId = null) {
    try {
      const testBot = new TelegramBot(botToken || process.env.TELEGRAM_BOT_TOKEN, { polling: false });
      const testChatId = chatId || this.chatIds[0];
      
      if (!testChatId) {
        throw new Error('No chat ID provided for testing');
      }
      
      await testBot.sendMessage(testChatId, '🧪 <b>Harmonic Scanner Test Message</b>\n\nTelegram notifications are working correctly!', {
        parse_mode: 'HTML'
      });
      
      return { success: true, message: 'Test message sent successfully' };
      
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Format pattern data into a readable message
   */
  formatPatternMessage(pattern) {
    const { type, symbol, timeframe, status, probability, tradingLevels } = pattern;
    
    // Pattern emoji mapping
    const patternEmojis = {
      'Gartley': '🟢',
      'Bat': '🔵',
      'Butterfly': '🟠',
      'Crab': '🔴',
      'Cypher': '🟣',
      'Shark': '⚪',
      'ABCD': '🟡'
    };
    
    const emoji = patternEmojis[type] || '📈';
    const statusEmoji = status === 'completed' ? '✅' : status === 'forming' ? '🔄' : '❌';
    
    let message = `${emoji} <b>${type} Pattern Detected</b> ${statusEmoji}\n\n`;
    message += `📊 <b>Symbol:</b> ${symbol}\n`;
    message += `⏰ <b>Timeframe:</b> ${timeframe}\n`;
    message += `📈 <b>Status:</b> ${status.charAt(0).toUpperCase() + status.slice(1)}\n`;
    
    if (probability) {
      message += `🎯 <b>Probability:</b> ${probability}%\n`;
    }
    
    if (tradingLevels) {
      message += `\n<b>📋 Trading Levels:</b>\n`;
      
      if (tradingLevels.entry) {
        message += `🎯 Entry: ${tradingLevels.entry.toFixed(5)}\n`;
      }
      
      if (tradingLevels.stopLoss) {
        message += `🛑 Stop Loss: ${tradingLevels.stopLoss.toFixed(5)}\n`;
      }
      
      if (tradingLevels.takeProfit) {
        message += `💰 Take Profit: ${tradingLevels.takeProfit.toFixed(5)}\n`;
      }
    }
    
    // Add pattern completion points
    if (pattern.points) {
      message += `\n<b>📐 Pattern Points:</b>\n`;
      
      Object.entries(pattern.points).forEach(([point, data]) => {
        if (data && data.price) {
          message += `${point}: ${data.price.toFixed(5)}\n`;
        }
      });
    }
    
    // Add Fibonacci ratios
    if (pattern.fibonacciRatios) {
      message += `\n<b>🌀 Key Ratios:</b>\n`;
      
      Object.entries(pattern.fibonacciRatios).slice(0, 3).forEach(([ratio, value]) => {
        if (typeof value === 'number') {
          message += `${ratio}: ${value.toFixed(3)}\n`;
        }
      });
    }
    
    message += `\n⏰ <i>Detected at ${new Date().toLocaleString()}</i>`;
    message += `\n\n🔗 <a href="https://harmonicscanner.app?symbol=${symbol}&timeframe=${timeframe}">View on Chart</a>`;
    
    return message;
  }

  /**
   * Send daily summary
   */
  async sendDailySummary(patterns) {
    if (!this.isEnabled() || patterns.length === 0) {
      return false;
    }

    try {
      let message = `📊 <b>Daily Harmonic Patterns Summary</b>\n`;
      message += `📅 ${new Date().toLocaleDateString()}\n\n`;
      
      // Count patterns by type
      const patternCounts = {};
      patterns.forEach(pattern => {
        patternCounts[pattern.type] = (patternCounts[pattern.type] || 0) + 1;
      });
      
      message += `<b>Patterns Detected:</b> ${patterns.length}\n\n`;
      
      Object.entries(patternCounts).forEach(([type, count]) => {
        const emoji = {
          'Gartley': '🟢',
          'Bat': '🔵',
          'Butterfly': '🟠',
          'Crab': '🔴',
          'Cypher': '🟣',
          'Shark': '⚪',
          'ABCD': '🟡'
        }[type] || '📈';
        
        message += `${emoji} ${type}: ${count}\n`;
      });
      
      // Top performing symbols
      const symbolCounts = {};
      patterns.forEach(pattern => {
        symbolCounts[pattern.symbol] = (symbolCounts[pattern.symbol] || 0) + 1;
      });
      
      const topSymbols = Object.entries(symbolCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      
      if (topSymbols.length > 0) {
        message += `\n<b>🏆 Most Active Symbols:</b>\n`;
        topSymbols.forEach(([symbol, count]) => {
          message += `• ${symbol}: ${count} patterns\n`;
        });
      }
      
      message += `\n📱 <i>Harmonic Pattern Scanner</i>`;
      
      await this.sendMessage(message);
      return true;
      
    } catch (error) {
      console.error('Failed to send daily summary:', error.message);
      return false;
    }
  }

  /**
   * Send server status update
   */
  async sendStatusUpdate(status) {
    if (!this.isEnabled()) {
      return false;
    }

    try {
      const emoji = status === 'online' ? '🟢' : status === 'maintenance' ? '🟡' : '🔴';
      
      let message = `${emoji} <b>Scanner Status Update</b>\n\n`;
      message += `Status: ${status.charAt(0).toUpperCase() + status.slice(1)}\n`;
      message += `Timestamp: ${new Date().toLocaleString()}\n`;
      
      if (status === 'online') {
        message += `\n✅ All systems operational`;
      } else if (status === 'maintenance') {
        message += `\n🔧 Scheduled maintenance in progress`;
      } else {
        message += `\n❌ System offline - investigating issue`;
      }
      
      await this.sendMessage(message);
      return true;
      
    } catch (error) {
      console.error('Failed to send status update:', error.message);
      return false;
    }
  }

  /**
   * Add new chat ID for notifications
   */
  addChatId(chatId) {
    if (!this.chatIds.includes(chatId)) {
      this.chatIds.push(chatId);
      console.log(`Added new Telegram chat ID: ${chatId}`);
    }
  }

  /**
   * Remove chat ID from notifications
   */
  removeChatId(chatId) {
    const index = this.chatIds.indexOf(chatId);
    if (index > -1) {
      this.chatIds.splice(index, 1);
      console.log(`Removed Telegram chat ID: ${chatId}`);
    }
  }

  /**
   * Get bot info
   */
  async getBotInfo() {
    if (!this.bot) {
      return null;
    }

    try {
      return await this.bot.getMe();
    } catch (error) {
      console.error('Failed to get bot info:', error.message);
      return null;
    }
  }
}

module.exports = TelegramBotService;
