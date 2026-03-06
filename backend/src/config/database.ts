import { Pool } from 'pg';
import { config } from './index';
import { logger } from './logger';

let pool: Pool | null = null;

/** Strip sslmode from URL so our Pool ssl config (rejectUnauthorized) is not overridden by pg-connection-string. */
function stripSslModeFromUrl(url: string): string {
  return url
    .replace(/[?&]sslmode=[^&]*/gi, '')
    .replace(/[?&]ssl=[^&]*/gi, '')
    .replace(/\?&/, '?')
    .replace(/&&+/, '&')
    .replace(/\?$/, '');
}

export function getPool(): Pool {
  if (!pool) {
    const rawUrl = config.database.url || '';
    const urlHasSsl = /sslmode=/i.test(rawUrl);
    const useSsl = process.env.DATABASE_SSL === 'true' || urlHasSsl;
    const isLocalhost = /localhost|127\.0\.0\.1/.test(rawUrl);
    const explicit = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED;
    const rejectUnauthorized =
      explicit === 'true' ? true
      : explicit === 'false' ? false
      : !isLocalhost ? false  // cloud (Render, Supabase): default no cert verify
      : true;
    const connectionString = useSsl ? stripSslModeFromUrl(rawUrl) : rawUrl;
    const ssl = useSsl ? { rejectUnauthorized } : undefined;
    const isCloud = !/localhost|127\.0\.0\.1/.test(rawUrl);
    const defaultPoolSize = isCloud ? 10 : 20; // Supabase free tier ~15 conn limit
    pool = new Pool({
      connectionString,
      max: parseInt(process.env.DATABASE_POOL_SIZE || String(defaultPoolSize), 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: isCloud ? 60000 : 10000, // cloud: 60s for cold start / network latency
      keepAlive: isCloud,
      keepAliveInitialDelayMillis: 10000,
      ...(ssl && { ssl }),
    });

    pool.on('error', (err) => {
      logger.error({ err }, 'Unexpected PostgreSQL pool error');
    });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/** Reset pool so next getPool() creates a fresh one. Use for connection retries. */
export function resetPool(): void {
  if (pool) {
    pool.end().catch(() => {});
    pool = null;
  }
}

export async function query(text: string, params?: unknown[]) {
  const start = Date.now();
  const result = await getPool().query(text, params);
  const duration = Date.now() - start;
  logger.debug({ text: text.substring(0, 80), duration, rows: result.rowCount }, 'query');
  return result;
}
