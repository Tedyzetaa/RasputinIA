const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Conversation = sequelize.define('Conversation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    messages: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    sessionId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    tableName: 'conversations',
});

module.exports = Conversation;