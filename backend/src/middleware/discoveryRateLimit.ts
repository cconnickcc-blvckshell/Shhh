/**
 * Per-user discovery rate limit — throttle GET /v1/discover to prevent abuse.
 * Configurable via DISCOVERY_RATE_LIMIT_PER_MIN.
 * When RATE_LIMIT_MODE=capacity (test env), uses 10000/min to test infra without policy.
 */
import { Request, Response, NextFunction } from 'express';
import { getRedis } from '../config/redis';

function getLimit(): number {
  const explicit = process.env.DISCOVERY_RATE_LIMIT_PER_MIN;
  if (explicit) return parseInt(explicit, 10);
  if (process.env.RATE_LIMIT_MODE === 'capacity') return 10000;
  if (process.env.TEST_MODE === 'true' || process.env.NODE_ENV === 'test') return 500;
  return 60;
}
const LIMIT = getLimit();
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
