const env = require('../config/env');

const formatMessage = (level, message, meta) => {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}]: ${message}${metaStr}`;
};

const logger = {
  info: (message, meta) => {
    if (env.NODE_ENV !== 'test') {
      console.log(formatMessage('info', message, meta));
    }
  },
  warn: (message, meta) => {
    if (env.NODE_ENV !== 'test') {
      console.warn(formatMessage('warn', message, meta));
    }
  },
  error: (message, meta) => {
    if (env.NODE_ENV !== 'test') {
      console.error(formatMessage('error', message, meta));
    }
  }
};

module.exports = logger;
