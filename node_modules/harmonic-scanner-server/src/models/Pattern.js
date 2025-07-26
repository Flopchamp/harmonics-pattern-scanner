const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'harmonic_scanner',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const Pattern = sequelize.define('Pattern', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  symbol: {
    type: DataTypes.STRING(10),
    allowNull: false,
    index: true
  },
  timeframe: {
    type: DataTypes.STRING(5),
    allowNull: false,
    index: true
  },
  type: {
    type: DataTypes.ENUM('Gartley', 'Bat', 'Butterfly', 'Crab', 'Cypher', 'Shark', 'ABCD'),
    allowNull: false,
    index: true
  },
  status: {
    type: DataTypes.ENUM('forming', 'completed', 'invalidated'),
    allowNull: false,
    defaultValue: 'forming',
    index: true
  },
  points: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'X, A, B, C, D points with time and price'
  },
  fibonacciRatios: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Calculated Fibonacci ratios for validation'
  },
  tradingLevels: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Entry, stop loss, take profit levels'
  },
  probability: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Pattern probability score (0-100)'
  },
  detectedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  invalidatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'patterns',
  indexes: [
    {
      name: 'symbol_timeframe_idx',
      fields: ['symbol', 'timeframe']
    },
    {
      name: 'type_status_idx',
      fields: ['type', 'status']
    },
    {
      name: 'detected_at_idx',
      fields: ['detectedAt']
    }
  ]
});

module.exports = Pattern;
