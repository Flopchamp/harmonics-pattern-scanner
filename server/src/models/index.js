const { Sequelize } = require('sequelize');
const Pattern = require('./Pattern');
const User = require('./User');

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

// Define associations
// Users can have many patterns (if implementing user-specific pattern tracking)
// For now, patterns are public, so no direct association needed

module.exports = {
  sequelize,
  Pattern,
  User
};
