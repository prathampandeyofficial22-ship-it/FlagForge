import { createApp } from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  try {
    // Connect to database
    await connectDB();

    const app = createApp();

    const server = app.listen(config.PORT, () => {
      logger.info(`FlagForge API server running on port ${config.PORT} [${config.NODE_ENV}]`);
      logger.info(`Health check: http://localhost:${config.PORT}/health`);
    });

    // Graceful shutdown handling
    const handleShutdown = (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  } catch (error) {
    logger.error('Failed to start FlagForge server:', error);
    process.exit(1);
  }
}

bootstrap();
