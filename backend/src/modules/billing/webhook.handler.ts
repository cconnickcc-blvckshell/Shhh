import { Request, Response, NextFunction } from 'express';
import { SubscriptionService } from './subscription.service';

const svc = new SubscriptionService();

/**
 * Stripe webhook handler. MUST be used with express.raw({ type: 'application/json' }) so req.body is a Buffer.
 * Validates STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET before processing.
 */
export function handleStripeWebhook(req: Request, res: Response, next: NextFunction) {
  void (async () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || secretKey.trim() === '') {
    res.status(503).json({ error: { message: 'Stripe not configured: STRIPE_SECRET_KEY missing' } });
    return;
  }
  if (!webhookSecret || webhookSecret.trim() === '') {
    res.status(503).json({ error: { message: 'Stripe not configured: STRIPE_WEBHOOK_SECRET missing' } });
    return;
  }

  const sig = req.headers['stripe-signature'] as string;
  if (!sig) {
    res.status(400).json({ error: { message: 'Missing stripe-signature header' } });
    return;
  }

  const body = req.body;
  if (!body || !Buffer.isBuffer(body)) {
    res.status(400).json({ error: { message: 'Webhook body must be raw (use express.raw middleware)' } });
    return;
  }

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(secretKey);
    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

    await svc.handleWebhook(event);
    res.json({ received: true });
  } catch (err: unknown) {
    const e = err as { type?: string };
    if (e?.type === 'StripeSignatureVerificationError') {
      res.status(400).json({ error: { message: 'Invalid webhook signature' } });
      return;
    }
    next(err);
  }
  })();
}
