const app = require('./src/app');
const env = require('./src/config/env');
const db = require('./src/config/database');
const { startScheduler, stopScheduler } = require('./src/services/scheduler');
const logger = require('./src/utils/logger');

const server = app.listen(env.PORT, async () => {
  try {
    // Verify database connectivity
    await db.raw('SELECT 1+1 AS result');
    logger.info(`Skyline Backend running on port ${env.PORT} [Environment: ${env.NODE_ENV}]`);
    logger.info(`Connected to database: ${env.DB_NAME}`);

    // Start background cron scheduler
    startScheduler();
  } catch (err) {
    logger.error(`Database connection failed on startup: ${err.message}`);
    process.exit(1);
  }
});

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed.');

    stopScheduler();

    try {
      await db.destroy();
      logger.info('Knex connection pool closed.');
      process.exit(0);
    } catch (err) {
      logger.error(`Error closing Knex connection pool: ${err.message}`);
      process.exit(1);
    }
  });

  // Force exit if shutdown hangs beyond 10s
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = server;
