// database.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

// Usa DATABASE_URL ou SQLite local para dev
const sequelize = new Sequelize(process.env.DATABASE_URL || 'sqlite:./database.sqlite', {
  logging: false,
});

module.exports = sequelize;

