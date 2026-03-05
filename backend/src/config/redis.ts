import Redis from 'ioredis';
import { config } from './index';
import { logger } from './logger';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    // Upstash and other cloud Redis require TLS. Strip redis-cli cruft (e.g. "--tls -u ") if pasted by mistake.
    let url = (config.redis.url || '').trim().replace(/^\s*--tls\s+-u\s+/i, '');
    // Upstash requires rediss:// (TLS); if URL has redis:// and host is *.upstash.io, upgrade to rediss
    if (url.startsWith('redis://') && url.includes('upstash.io')) {
      url = 'rediss://' + url.slice(7);
    }
    redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redis.on('error', (err) => {
      logger.error({ err }, 'Redis connection error');
    });

    redis.on('connect', () => {
      logger.info('Redis connected');
    });
  }
  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
