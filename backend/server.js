import http from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
// Registers every model so its indexes are created against the live connection.
import './models/index.js';
import { logger } from './utils/logger.js';

async function start() {
  // Connect before listening: the API should never answer requests it cannot serve.
  await connectDatabase();

  if (env.generatedSessionSecret) {
    logger.warn(
      'SESSION_SECRET is not set; using a random per-process secret. Sessions will not survive a restart.',
    );
  }

  // Sessions live in MongoDB, so the app is built only after the connection exists.
  const app = createApp();
  const server = http.createServer(app);

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(
        `Port ${env.port} is already in use. Stop the other process or set PORT in backend/.env.`,
      );
    } else {
      logger.error(`HTTP server error: ${error.message}`);
    }
    process.exit(1);
  });

  server.listen(env.port, () => {
    logger.info(`OpenCare API listening on http://localhost:${env.port} (${env.nodeEnv})`);
    logger.info(`Allowed browser origin(s): ${env.allowedOrigins.join(', ')}`);
    logger.info(`Health check: http://localhost:${env.port}/api/health`);
  });

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`${signal} received — shutting down.`);

    server.close(async (closeError) => {
      if (closeError) logger.error(`Error while closing HTTP server: ${closeError.message}`);
      try {
        await disconnectDatabase();
      } catch (dbError) {
        logger.error(`Error while closing MongoDB: ${dbError.message}`);
      }
      process.exit(closeError ? 1 : 0);
    });

    // Do not hang forever on stuck connections.
    setTimeout(() => {
      logger.warn('Shutdown timed out; exiting.');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((error) => {
  logger.error('OpenCare API failed to start.');
  logger.debug(error?.stack ?? String(error));
  process.exit(1);
});
