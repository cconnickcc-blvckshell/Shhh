import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { config } from '../config';
import { logger } from '../config/logger';

/** Uses DATABASE_MIGRATION_URL (direct) if set, else DATABASE_URL. Supabase: use direct for migrations. */
function getMigrationPool(): Pool {
  const url = config.database.migrationUrl;
  const needsSsl = process.env.DATABASE_SSL === 'true' || url?.includes('sslmode=require');
  return new Pool({
    connectionString: url,
    max: 1,
    ...(needsSsl && { ssl: { rejectUnauthorized: false } }),
  });
}

async function migrate() {
  const pool = getMigrationPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const { rows } = await pool.query(
      'SELECT 1 FROM schema_migrations WHERE filename = $1',
      [file]
    );

    if (rows.length > 0) {
      logger.info(`Skipping ${file} (already applied)`);
      continue;
    }

    logger.info(`Applying migration: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1)',
        [file]
      );
      await client.query('COMMIT');
      logger.info(`Applied migration: ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error({ err }, `Failed to apply migration: ${file}`);
      throw err;
    } finally {
      client.release();
    }
  }

  logger.info('All migrations applied');
  await pool.end();
}

migrate().catch((err) => {
  logger.error({ err }, 'Migration failed');
  process.exit(1);
});
