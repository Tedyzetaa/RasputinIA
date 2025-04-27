// logger.js
const { createLogger, transports, format } = require('winston');

// Logger JSON estruturado com timestamp
const logger = createLogger({
  level: 'debug',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [new transports.Console()]
});

module.exports = logger;
