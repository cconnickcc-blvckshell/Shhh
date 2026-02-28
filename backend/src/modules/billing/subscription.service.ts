import Stripe from 'stripe';
import { query } from '../../config/database';
import { logger } from '../../config/logger';

const TIERS: Record<string, { personaSlots: number; price?: number; features: Record<string, boolean> }> = {
  free: { personaSlots: 1, features: { anonymousBrowsing: false, expandedRadius: false, visibilitySchedule: false } },
  discreet: { personaSlots: 2, price: 999, features: { anonymousBrowsing: true, expandedRadius: false, visibilitySchedule: false } },
  phantom: { personaSlots: 3, price: 1999, features: { anonymousBrowsing: true, expandedRadius: true, visibilitySchedule: true } },
  elite: { personaSlots: 5, price: 3999, features: { anonymousBrowsing: true, expandedRadius: true, visibilitySchedule: true, prioritySafety: true, unlimitedAlbums: true } },
};

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export class SubscriptionService {
  async createCheckout(userId: string, tier: 'discreet' | 'phantom' | 'elite') {
    const stripe = getStripe();
    if (!stripe) {
      throw Object.assign(new Error('Payment system not configured'), { statusCode: 503 });
    }

    const tierConfig = TIERS[tier];
    if (!tierConfig || !tierConfig.price) {
      throw Object.assign(new Error('Invalid tier'), { statusCode: 400 });
    }

    let customerId: string;
    const existing = await query(`SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`, [userId]);

    if (existing.rows[0]?.stripe_customer_id) {
      customerId = existing.rows[0].stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({ metadata: { userId } });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{
        price_data: {
          currency: 'usd',
          recurring: { interval: 'month' },
          product_data: { name: `Shhh ${tier.charAt(0).toUpperCase() + tier.slice(1)}` },
          unit_amount: tierConfig.price,
        },
        quantity: 1,
      }],
      success_url: `${process.env.APP_URL || 'shhh://'}subscription/success`,
      cancel_url: `${process.env.APP_URL || 'shhh://'}subscription/cancel`,
      metadata: { userId, tier },
    });

    return { checkoutUrl: session.url, sessionId: session.id };
  }

  async handleWebhook(event: Stripe.Event) {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const tier = session.metadata?.tier as keyof typeof TIERS;

      if (userId && tier && TIERS[tier]) {
        await this.activateSubscription(userId, tier, session.subscription as string, session.customer as string);
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription;
      await query(`UPDATE subscriptions SET status = 'cancelled', updated_at = NOW() WHERE stripe_subscription_id = $1`, [sub.id]);
    }
  }

  async activateSubscription(userId: string, tier: keyof typeof TIERS, stripeSubId: string, stripeCustomerId: string) {
    const tierConfig = TIERS[tier];

    await query(`UPDATE subscriptions SET status = 'cancelled', updated_at = NOW() WHERE user_id = $1 AND status = 'active'`, [userId]);

    await query(
      `INSERT INTO subscriptions (user_id, tier, stripe_subscription_id, stripe_customer_id, status, persona_slots, features_json, current_period_start, current_period_end)
       VALUES ($1, $2, $3, $4, 'active', $5, $6, NOW(), NOW() + INTERVAL '30 days')`,
      [userId, tier, stripeSubId, stripeCustomerId, tierConfig.personaSlots, JSON.stringify(tierConfig.features)]
    );

    logger.info({ userId, tier }, 'Subscription activated');
  }

  async getSubscription(userId: string) {
    const result = await query(
      `SELECT * FROM subscriptions WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return { tier: 'free', ...TIERS.free };
    }

    return result.rows[0];
  }

  async getTiers() {
    return Object.entries(TIERS).map(([key, val]) => ({
      id: key,
      ...val,
      priceFormatted: val.price ? `$${(val.price / 100).toFixed(2)}/mo` : 'Free',
    }));
  }

  /** Returns true if user has an active subscription that includes the given feature. */
  async hasFeature(userId: string, feature: string): Promise<boolean> {
    const sub = await this.getSubscription(userId);
    const row = sub as { tier?: string; features_json?: unknown };
    if (row.tier === 'free' || !row.tier) return false;
    const features = row.features_json as Record<string, boolean> | undefined;
    return !!(features && features[feature] === true);
  }

  /** Returns true if user has premium (non-free) subscription. */
  async isPremium(userId: string): Promise<boolean> {
    const sub = await this.getSubscription(userId);
    const tier = (sub as { tier?: string }).tier || 'free';
    return tier !== 'free';
  }
}
