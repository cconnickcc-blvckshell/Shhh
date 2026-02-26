import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AdService } from './ad.service';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';

const router = Router();
const svc = new AdService();

// User-facing: get eligible ad for a surface
router.get('/feed', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng } = req.query;
    const ad = await svc.getEligibleAd(
      req.user!.userId, 'discover_feed',
      lat ? parseFloat(lat as string) : undefined,
      lng ? parseFloat(lng as string) : undefined
    );
    res.json({ data: ad });
  } catch (err) { next(err); }
});

router.get('/chat', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ad = await svc.getEligibleAd(req.user!.userId, 'chat_list');
    res.json({ data: ad });
  } catch (err) { next(err); }
});

router.get('/post-event', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ad = await svc.getEligibleAd(req.user!.userId, 'post_event');
    res.json({ data: ad });
  } catch (err) { next(err); }
});

// Track impressions and interactions
router.post('/:id/impression', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.recordImpression(req.params.id as string, req.user!.userId, req.body.surface || 'discover_feed');
    res.json({ data: { recorded: true } });
  } catch (err) { next(err); }
});

router.post('/:id/tap', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.recordTap(req.params.id as string);
    res.json({ data: { recorded: true } });
  } catch (err) { next(err); }
});

router.post('/:id/dismiss', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.dismissAd(req.params.id as string, req.user!.userId);
    res.status(204).send();
  } catch (err) { next(err); }
});

// Venue-facing: create and manage placements
router.post('/placements', authenticate, validate(z.object({
  venueId: z.string().uuid(),
  surface: z.enum(['discover_feed', 'chat_list', 'post_event', 'venue_page']),
  headline: z.string().min(3).max(100),
  body: z.string().max(200).optional(),
  mediaUrl: z.string().url().optional(),
  ctaText: z.string().max(30).optional(),
  targetRadiusKm: z.number().positive().max(200).optional(),
  targetIntents: z.array(z.string()).optional(),
  budgetCents: z.number().int().nonnegative().optional(),
  maxImpressions: z.number().int().positive().optional(),
  cpmCents: z.number().int().positive().optional(),
  expiresInDays: z.number().positive().optional(),
})), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const placement = await svc.createPlacement(req.body.venueId, req.body);
    res.status(201).json({ data: placement });
  } catch (err) { next(err); }
});

router.get('/placements/:id/stats', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await svc.getPlacementStats(req.params.id as string);
    res.json({ data: stats });
  } catch (err) { next(err); }
});

export default router;
