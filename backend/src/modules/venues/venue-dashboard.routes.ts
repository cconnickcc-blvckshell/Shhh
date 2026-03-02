import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { VenueDashboardService } from './venue-dashboard.service';
import { validate } from '../../middleware/validation';
import { authenticate, requireTier, requireVenueAccess } from '../../middleware/auth';

const router = Router();
const svc = new VenueDashboardService();

// Public venue profile
router.get('/:id/full', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const venue = await svc.getFullVenueProfile(req.params.id as string);
    if (!venue) { res.status(404).json({ error: { message: 'Venue not found' } }); return; }
    res.json({ data: venue });
  } catch (err) { next(err); }
});

// Venue owner/staff dashboard (tier 2 + must be owner or staff)
router.get('/:id/dashboard', authenticate, requireTier(2), requireVenueAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dashboard = await svc.getDashboard(req.params.id as string);
    res.json({ data: dashboard });
  } catch (err) { next(err); }
});

router.get('/:id/analytics/density', authenticate, requireTier(2), requireVenueAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const data = await svc.getDensityIntelligence(req.params.id as string, days);
    res.json({ data });
  } catch (err) { next(err); }
});

router.get('/:id/analytics', authenticate, requireTier(2), requireVenueAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const analytics = await svc.getAnalyticsRange(req.params.id as string, days);
    res.json({ data: analytics });
  } catch (err) { next(err); }
});

router.get('/:id/trends', authenticate, requireTier(2), requireVenueAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trends = await svc.getWeeklyTrends(req.params.id as string);
    res.json({ data: trends });
  } catch (err) { next(err); }
});

// Venue profile updates
router.put('/:id/profile', authenticate, requireTier(2), requireVenueAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const venue = await svc.updateVenueProfile(req.params.id as string, req.body);
    res.json({ data: venue });
  } catch (err) { next(err); }
});

// Staff
router.get('/:id/staff', authenticate, requireVenueAccess, async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ data: await svc.getStaff(req.params.id as string) }); } catch (err) { next(err); }
});

router.post('/:id/staff', authenticate, requireTier(2), requireVenueAccess, validate(z.object({
  userId: z.string().uuid(), role: z.enum(['owner', 'manager', 'staff', 'security', 'dj']),
})), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = await svc.inviteStaff(req.params.id as string, req.body.userId, req.body.role);
    res.status(201).json({ data: staff });
  } catch (err) { next(err); }
});

router.delete('/:id/staff/:staffId', authenticate, requireTier(2), requireVenueAccess, async (req: Request, res: Response, next: NextFunction) => {
  try { await svc.removeStaff(req.params.id as string, req.params.staffId as string); res.status(204).send(); } catch (err) { next(err); }
});

// Reviews
router.get('/:id/reviews', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ data: await svc.getReviews(req.params.id as string) }); } catch (err) { next(err); }
});

router.post('/:id/reviews', authenticate, validate(z.object({
  rating: z.number().int().min(1).max(5),
  vibeTags: z.array(z.string()).optional(),
  comment: z.string().max(500).optional(),
})), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const review = await svc.submitReview(req.params.id as string, req.user!.userId, req.body.rating, req.body.vibeTags, req.body.comment);
    res.status(201).json({ data: review });
  } catch (err) { next(err); }
});

// Specials
router.get('/:id/specials', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ data: await svc.getSpecials(req.params.id as string) }); } catch (err) { next(err); }
});

router.post('/:id/specials', authenticate, requireTier(2), requireVenueAccess, validate(z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  isRecurring: z.boolean().optional(),
})), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const special = await svc.createSpecial(req.params.id as string, req.body);
    res.status(201).json({ data: special });
  } catch (err) { next(err); }
});

export default router;
