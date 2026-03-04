/**
 * Test reset controller — clears Redis keys used by discovery rate limit and cache.
 * Only enabled when TEST_MODE=true or NODE_ENV=test.
 */
import { Request, Response, NextFunction } from 'express';
import { getRedis } from '../../config/redis';
import { config } from '../../config';

function isTestMode(): boolean {
  return process.env.TEST_MODE === 'true' || config.nodeEnv === 'test';
}

export async function reset(_req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!isTestMode()) {
    res.status(404).send();
    return;
  }

  try {
    const redis = getRedis();
    const discoveryRateKeys = await redis.keys('discovery_rate:*');
    const discoverCacheKeys = await redis.keys('discover:*');
    const adCooldownKeys = await redis.keys('ad_cooldown:*');
    const keys = discoveryRateKeys.concat(discoverCacheKeys).concat(adCooldownKeys);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    res.json({ data: { cleared: keys.length } });
  } catch (err) {
    next(err);
  }
}
