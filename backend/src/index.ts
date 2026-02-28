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

  const maxPortAttempts = 10;
  let portAttempt = 0;
  let listening = false;

  function tryListen(port: number) {
    server.listen(port, async () => {
      if (listening) return;
      listening = true;
      const bound = server.address();
      const actualPort = typeof bound === 'object' && bound !== null && 'port' in bound ? bound.port : port;
      logger.info({ port: actualPort }, `Shhh API running on port ${actualPort}`);

      try {
        await startWorkers();
      } catch (err) {
        logger.warn({ err }, 'Background workers failed to start (non-fatal)');
      }
    });
  }

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE' && portAttempt < maxPortAttempts) {
      portAttempt += 1;
      const nextPort = config.port + portAttempt;
      logger.warn({ previous: config.port + portAttempt - 1, next: nextPort }, 'Port in use, trying next');
      tryListen(nextPort);
    } else {
      logger.error({ err }, 'Server failed to start');
      process.exit(1);
    }
  });

  tryListen(config.port);

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
