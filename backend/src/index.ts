import http from 'http';
import { createApp } from './app';
import { config } from './config';
import { logger } from './config/logger';
import { getPool, resetPool } from './config/database';
import { getRedis } from './config/redis';
import { connectMongoDB } from './config/mongodb';
import { setupWebSocket } from './websocket';
import { startWorkers } from './workers';

const UNSAFE_DEFAULTS = [
  'dev-jwt-secret',
  'dev-refresh-secret',
  'shhh-dev-pepper-change-in-production',
];

function validateProductionSecrets() {
  if (config.nodeEnv !== 'production') return;

  const jwtSecret = process.env.JWT_SECRET || 'dev-jwt-secret';
  const jwtRefresh = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
  const pepper = process.env.PHONE_HASH_PEPPER || 'shhh-dev-pepper-change-in-production';
  const corsOrigins = process.env.CORS_ORIGINS;

  const bad: string[] = [];
  if (UNSAFE_DEFAULTS.includes(jwtSecret)) bad.push('JWT_SECRET');
  if (UNSAFE_DEFAULTS.includes(jwtRefresh)) bad.push('JWT_REFRESH_SECRET');
  if (UNSAFE_DEFAULTS.includes(pepper)) bad.push('PHONE_HASH_PEPPER');
  if (!corsOrigins || corsOrigins.trim() === '') bad.push('CORS_ORIGINS');

  if (bad.length > 0) {
    logger.error({ missing: bad }, 'Production requires: JWT_SECRET, JWT_REFRESH_SECRET, PHONE_HASH_PEPPER, CORS_ORIGINS (comma-separated).');
    process.exit(1);
  }
}

/** Fail fast in production if DB/Redis URLs point to localhost (Render, Railway, etc. have no local services). */
function validateProductionDataServices() {
  if (config.nodeEnv !== 'production') return;

  const dbUrl = process.env.DATABASE_URL || '';
  const redisUrl = process.env.REDIS_URL || '';
  const mongoUrl = process.env.MONGODB_URL || '';
  const localhostPattern = /localhost|127\.0\.0\.1|::1/;

  const missing: string[] = [];
  if (!dbUrl || localhostPattern.test(dbUrl)) missing.push('DATABASE_URL (use Supabase pooler or Render PostgreSQL)');
  if (!redisUrl || localhostPattern.test(redisUrl)) missing.push('REDIS_URL (use Upstash or Redis Cloud)');
  if (!mongoUrl || localhostPattern.test(mongoUrl)) missing.push('MONGODB_URL (use MongoDB Atlas)');

  if (missing.length > 0) {
    logger.error(
      { missing },
      'Production requires cloud data services. In Render Dashboard → Environment, set: ' +
        missing.join('; ') +
        '. See docs/GET_ONLINE.md'
    );
    process.exit(1);
  }
}

async function main() {
  validateProductionSecrets();
  validateProductionDataServices();
  logger.info({ env: config.nodeEnv }, 'Starting Shhh API server...');

  const maxRetries = 5;
  const retryDelayMs = 15000;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const pool = getPool();
      await pool.query('SELECT 1');
      logger.info('PostgreSQL connected');
      break;
    } catch (err) {
      logger.warn({ err, attempt, maxRetries }, 'PostgreSQL connection failed');
      resetPool();
      if (attempt === maxRetries) {
        logger.error(
          { err },
          'Failed to connect to PostgreSQL. Check: DATABASE_URL (use Supabase pooler port 6543), DATABASE_SSL=true, Supabase project not paused, IP allowed.'
        );
        process.exit(1);
      }
      logger.info({ delayMs: retryDelayMs, nextAttempt: attempt + 1 }, 'Retrying PostgreSQL connection...');
      await new Promise((r) => setTimeout(r, retryDelayMs));
    }
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
