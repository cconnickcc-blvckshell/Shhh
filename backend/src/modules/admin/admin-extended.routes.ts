import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AdminExtendedService } from './admin-extended.service';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';
import { requireRole, logAdminAction } from '../../middleware/adminAuth';

const router = Router();
const svc = new AdminExtendedService();

router.use(authenticate);
router.use(requireRole('moderator'));

// Enhanced dashboard
router.get('/overview', async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ data: await svc.getDashboardOverview() }); } catch (err) { next(err); }
});

// Revenue
router.get('/revenue', async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ data: await svc.getRevenueOverview() }); } catch (err) { next(err); }
});

router.get('/revenue/history', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ data: await svc.getRevenueHistory(parseInt(req.query.days as string) || 30) }); } catch (err) { next(err); }
});

// Users
router.get('/users/list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const filter = req.query.filter as string;
    res.json({ data: await svc.listUsers(page, 20, filter) });
  } catch (err) { next(err); }
});

router.get('/users/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query.q as string || '';
    const page = parseInt(req.query.page as string) || 1;
    res.json({ data: await svc.searchUsers(q, page) });
  } catch (err) { next(err); }
});

router.post('/users/:userId/role', requireRole('admin'), validate(z.object({
  role: z.enum(['user', 'moderator', 'admin', 'superadmin']),
})), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await logAdminAction(req.user!.userId, 'set_role', 'user', req.params.userId as string, `Set role to ${req.body.role}`);
    await svc.setUserRole(req.params.userId as string, req.body.role);
    res.json({ data: { updated: true } });
  } catch (err) { next(err); }
});

router.post('/users/:userId/toggle-active', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await logAdminAction(req.user!.userId, 'toggle_active', 'user', req.params.userId as string);
    await svc.toggleUserActive(req.params.userId as string, req.body.active);
    res.json({ data: { updated: true } });
  } catch (err) { next(err); }
});

router.post('/users/:userId/set-tier', requireRole('admin'), validate(z.object({
  tier: z.number().int().min(0).max(3),
})), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await logAdminAction(req.user!.userId, 'set_tier', 'user', req.params.userId as string, `Set tier to ${req.body.tier}`);
    await svc.setVerificationTier(req.params.userId as string, req.body.tier);
    res.json({ data: { updated: true } });
  } catch (err) { next(err); }
});

// Venues
router.get('/venues/list', async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ data: await svc.listVenues() }); } catch (err) { next(err); }
});

// Ads
router.get('/ads/list', async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ data: await svc.listAdPlacements() }); } catch (err) { next(err); }
});

router.post('/ads/:id/toggle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.toggleAdPlacement(req.params.id as string, req.body.active);
    res.json({ data: { updated: true } });
  } catch (err) { next(err); }
});

// Events
router.get('/events/list', async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ data: await svc.listEvents() }); } catch (err) { next(err); }
});

// Safety
router.get('/safety/alerts', async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ data: await svc.getSafetyAlerts() }); } catch (err) { next(err); }
});

// Map / Geo (command center)
router.get('/presence/geo', async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ data: await svc.getPresenceGeo() }); } catch (err) { next(err); }
});

router.get('/stats/cities', async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ data: await svc.getStatsCities() }); } catch (err) { next(err); }
});

router.get('/stats/trust-scores', async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ data: await svc.getTrustScoreDistribution() }); } catch (err) { next(err); }
});

// Settings
router.get('/settings/ads', async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ data: await svc.getAdControls() }); } catch (err) { next(err); }
});

router.put('/settings/ads/:id', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await logAdminAction(req.user!.userId, 'update_ad_control', 'ad_control', req.params.id as string);
    await svc.updateAdControl(req.params.id as string, req.body.value);
    res.json({ data: { updated: true } });
  } catch (err) { next(err); }
});

export default router;
