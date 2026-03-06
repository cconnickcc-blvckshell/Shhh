import { Router, Request, Response, NextFunction } from 'express';
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

// Webhook is handled in app.ts with single raw-body middleware (see webhook.handler.ts)

export default router;
