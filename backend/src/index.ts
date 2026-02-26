import http from 'http';
import { createApp } from './app';
import { config } from './config';
import { logger } from './config/logger';
import { getPool } from './config/database';
import { getRedis } from './config/redis';
import { connectMongoDB } from './config/mongodb';
import { setupWebSocket } from './websocket';
import { startWorkers } from './workers';

async function main() {
  logger.info({ env: config.nodeEnv }, 'Starting Shhh API server...');

  try {
    const pool = getPool();
    await pool.query('SELECT 1');
    logger.info('PostgreSQL connected');
  } catch (err) {
    logger.error({ err }, 'Failed to connect to PostgreSQL');
    process.exit(1);
  }

  try {
    getRedis();
  } catch (err) {
    logger.error({ err }, 'Failed to connect to Redis');
    process.exit(1);
  }

  try {
    await connectMongoDB();
  } catch (err) {
    logger.error({ err }, 'Failed to connect to MongoDB');
    process.exit(1);
  }

  const app = createApp();
  const server = http.createServer(app);

  const io = setupWebSocket(server);
  app.set('io', io);

  server.listen(config.port, async () => {
    logger.info({ port: config.port }, `Shhh API running on port ${config.port}`);

    try {
      await startWorkers();
    } catch (err) {
      logger.warn({ err }, 'Background workers failed to start (non-fatal)');
    }
  });

  const shutdown = async () => {
    logger.info('Shutting down gracefully...');
    server.close();
    io.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main();
