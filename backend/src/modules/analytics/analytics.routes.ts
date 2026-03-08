import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';
import { AnalyticsService } from './analytics.service';

const router = Router();
const analyticsService = new AnalyticsService();

const eventSchema = z.object({
  event_type: z.string().max(80).regex(/^[a-z0-9_]+$/),
  payload: z.record(z.unknown()).optional(),
});

/** POST /v1/analytics/events — Track product analytics event (Wave 4 prerequisite) */
router.post(
  '/events',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = eventSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid event payload' });
        return;
      }
      const { event_type, payload } = parsed.data;
      await analyticsService.track(event_type, req.user!.userId, payload);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
