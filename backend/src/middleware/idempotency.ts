/**
 * Idempotency-Key middleware for duplicate-sensitive POST routes.
 * When client sends Idempotency-Key header, we cache the response in Redis
 * and return it on duplicate requests within the TTL window.
 */
import { Request, Response, NextFunction } from 'express';
import { getRedis } from '../config/redis';
import { logger } from '../config/logger';

const IDEMPOTENCY_TTL = 86400; // 24 hours
const IDEMPOTENCY_PREFIX = 'idempotency:';

function buildKey(userId: string, key: string, route: string): string {
  return `${IDEMPOTENCY_PREFIX}${userId}:${route}:${key}`;
}

export function idempotencyMiddleware(routeId: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = req.headers['idempotency-key'] as string | undefined;
    const userId = req.user?.userId;

    if (!key || !userId) {
      return next();
    }

    const k = key.trim();
    if (k.length < 16 || k.length > 128) {
      res.status(400).json({ error: { message: 'Idempotency-Key must be 16–128 chars' } });
      return;
    }

    const redis = getRedis();
    const cacheKey = buildKey(userId, k, routeId);

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as { status: number; body: string };
        res.status(parsed.status)
          .set({ 'Content-Type': 'application/json', 'X-Idempotency-Replayed': 'true' })
          .send(parsed.body);
        return;
      }
    } catch (err) {
      logger.warn({ err, routeId }, 'Idempotency cache read failed');
      return next();
    }

    const originalJson = res.json.bind(res);
    res.json = function (body: unknown) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
        redis.setex(cacheKey, IDEMPOTENCY_TTL, JSON.stringify({ status: res.statusCode, body: bodyStr })).catch(() => {});
      }
      return originalJson(body);
    };

    next();
  };
}
