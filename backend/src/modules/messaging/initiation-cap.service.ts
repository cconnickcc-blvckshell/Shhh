/**
 * Initiation cap per filter view.
 * Cap applies to NEW conversations only; replies exempt.
 * Refreshes when user changes filters or refreshes (filterHash changes).
 */
import { getRedis } from '../../config/redis';
import { SubscriptionService } from '../billing/subscription.service';
import { config } from '../../config';

const subscriptionService = new SubscriptionService();

const CAP_BY_TIER: Record<string, number> = {
  free: config.geo.discoveryCapFree,
  discreet: config.geo.discoveryCapFree,
  phantom: config.geo.discoveryCapPremium,
  elite: 9999, // effectively unlimited
};

/** Build a stable hash from filter context for Redis key. */
function filterHash(ctx: Record<string, unknown> | undefined): string {
  if (!ctx || Object.keys(ctx).length === 0) return 'default';
  const sorted = Object.keys(ctx)
    .sort()
    .map((k) => `${k}:${String(ctx[k] ?? '')}`)
    .join('|');
  return Buffer.from(sorted).toString('base64url').slice(0, 32);
}

export class InitiationCapService {
  async checkAndIncrement(
    userId: string,
    filterContext: Record<string, unknown> | undefined
  ): Promise<{ allowed: true } | { allowed: false; cap: number; used: number; tierOptions: string[] }> {
    const sub = await subscriptionService.getSubscription(userId);
    const tier = (sub as { tier?: string }).tier || 'free';
    const cap = CAP_BY_TIER[tier] ?? CAP_BY_TIER.free;

    if (cap >= 9999) return { allowed: true };

    const hash = filterHash(filterContext);
    const key = `initiation:${userId}:${hash}`;

    const redis = getRedis();
    const used = await redis.incr(key);

    if (used > cap) {
      await redis.decr(key); // rollback
      return {
        allowed: false,
        cap,
        used: cap,
        tierOptions: ['discreet', 'phantom', 'elite'],
      };
    }

    return { allowed: true };
  }
}
