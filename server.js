require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const env = require('./src/config/env');
const logger = require('./src/utils/logger.util');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...');
  logger.error(err.name, err.message);
  process.exit(1);
});

// Connect to MongoDB then start server
connectDB().then(() => {
  const server = app.listen(env.PORT, () => {
    logger.info(`WMS Backend running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! Shutting down...');
    logger.error(err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });
});
