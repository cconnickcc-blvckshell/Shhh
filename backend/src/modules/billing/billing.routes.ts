import express, { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SubscriptionService } from './subscription.service';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';
import { idempotencyMiddleware } from '../../middleware/idempotency';

const router = Router();
const svc = new SubscriptionService();

router.get('/tiers', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const tiers = await svc.getTiers();
    res.json({ data: tiers });
  } catch (err) { next(err); }
});

router.get('/subscription', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sub = await svc.getSubscription(req.user!.userId);
    res.json({ data: sub });
  } catch (err) { next(err); }
});

router.post('/checkout', authenticate, idempotencyMiddleware('checkout'), validate(z.object({
  tier: z.enum(['discreet', 'phantom', 'elite']),
})), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await svc.createCheckout(req.user!.userId, req.body.tier);
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      res.status(503).json({ error: { message: 'Webhook secret not configured' } });
      return;
    }

    const Stripe = await import('stripe');
    const stripe = new Stripe.default(process.env.STRIPE_SECRET_KEY || '');
    const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

    await svc.handleWebhook(event as any);
    res.json({ received: true });
  } catch (err: any) {
    if (err.type === 'StripeSignatureVerificationError') {
      res.status(400).json({ error: { message: 'Invalid webhook signature' } });
      return;
    }
    next(err);
  }
});

export default router;
