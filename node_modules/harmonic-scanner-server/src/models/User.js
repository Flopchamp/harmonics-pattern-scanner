const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'harmonic_scanner',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false
  }
);

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  preferences: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      fibonacciTolerance: 0.05,
      enableTelegram: false,
      timeframes: ['5M', '15M', '1H', '4H', '1D'],
      symbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD'],
      alertOnPatternFormation: true,
      alertOnPatternCompletion: true,
      alertOnPatternInvalidation: false,
      minAlertProbability: 70,
      dataProvider: 'binance',
      updateInterval: 5
    }
  },
  telegramChatId: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  indexes: [
    {
      name: 'username_idx',
      unique: true,
      fields: ['username']
    },
    {
      name: 'email_idx',
      unique: true,
      fields: ['email']
    }
  ]
});

module.exports = User;
