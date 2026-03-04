/**
 * Per-user discovery rate limit — throttle GET /v1/discover to prevent abuse.
 * Default: 60 requests per minute per user. Configurable via DISCOVERY_RATE_LIMIT_PER_MIN.
 */
import { Request, Response, NextFunction } from 'express';
import { getRedis } from '../config/redis';

const LIMIT = parseInt(process.env.DISCOVERY_RATE_LIMIT_PER_MIN || '60', 10);
const WINDOW_SEC = 60;
const PREFIX = 'discovery_rate:';

export async function discoveryRateLimit(req: Request, res: Response, next: NextFunction) {
  const userId = req.user?.userId;
  if (!userId) return next();

  const redis = getRedis();
  const key = `${PREFIX}${userId}`;

  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, WINDOW_SEC);

    res.set('X-RateLimit-Limit', String(LIMIT));
    res.set('X-RateLimit-Remaining', String(Math.max(0, LIMIT - count)));

    if (count > LIMIT) {
      res.status(429).json({
        error: {
          message: 'Discovery rate limit exceeded. Try again in a minute.',
          code: 'RATE_LIMIT',
          retryAfter: WINDOW_SEC,
        },
      });
      return;
    }
  } catch {
    next();
    return;
  }

  next();
}
