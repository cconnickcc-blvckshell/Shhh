import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../..', '.env') });

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',

  database: {
    url: process.env.DATABASE_URL || 'postgresql://shhh_dev:shhh_dev_password@localhost:5432/shhh',
    /** Optional. Use for migrations when pooler blocks DDL (e.g. Supabase). Falls back to DATABASE_URL. */
    migrationUrl: process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL || 'postgresql://shhh_dev:shhh_dev_password@localhost:5432/shhh',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  mongodb: {
    url: process.env.MONGODB_URL || 'mongodb://shhh_dev:shhh_dev_password@localhost:27017/shhh_messages?authSource=admin',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-jwt-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || (process.env.NODE_ENV === 'development' ? '2h' : '15m'),
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(
      process.env.RATE_LIMIT_MAX_REQUESTS ||
        (process.env.TEST_MODE === 'true' || process.env.NODE_ENV === 'test' ? '100000' : '100'),
      10
    ),
  },

  geo: {
    defaultFuzzMeters: parseInt(process.env.DEFAULT_LOCATION_FUZZ_METERS || '300', 10),
    maxDiscoveryRadiusKm: parseInt(process.env.MAX_DISCOVERY_RADIUS_KM || '100', 10),
    discoveryCapFree: parseInt(process.env.DISCOVERY_CAP_FREE || '30', 10),
    discoveryCapPremium: parseInt(process.env.DISCOVERY_CAP_PREMIUM || '50', 10),
  },

  cors: {
    origins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
      : (process.env.NODE_ENV === 'production' ? [] : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8081', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:8081']),
  },
} as const;
