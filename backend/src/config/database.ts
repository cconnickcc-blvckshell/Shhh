import { Pool } from 'pg';
import { config } from './index';
import { logger } from './logger';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const ssl = process.env.DATABASE_SSL === 'true'
      ? { rejectUnauthorized: true }
      : undefined;
    pool = new Pool({
      connectionString: config.database.url,
      max: parseInt(process.env.DATABASE_POOL_SIZE || '20', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
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

export async function query(text: string, params?: unknown[]) {
  const start = Date.now();
  const result = await getPool().query(text, params);
  const duration = Date.now() - start;
  logger.debug({ text: text.substring(0, 80), duration, rows: result.rowCount }, 'query');
  return result;
}
