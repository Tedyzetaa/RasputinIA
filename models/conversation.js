// models/conversation.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Conversation = sequelize.define('Conversation', {
  sessionId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  messages: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  }
}, {
  tableName: 'conversations'
});

module.exports = Conversation;
