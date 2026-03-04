import { Router } from 'express';
import { z } from 'zod';
import { AdminController } from './admin.controller';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';
import { requireRole, logAdminAction } from '../../middleware/adminAuth';

const router = Router();
const ctrl = new AdminController();

const resolveReportSchema = z.object({
  status: z.enum(['resolved', 'dismissed']),
  notes: z.string().max(1000).optional(),
});

const banSchema = z.object({
  reason: z.string().min(3).max(500),
});

router.use(authenticate);
router.use(requireRole('moderator'));

router.get('/stats', ctrl.getDashboardStats);
router.get('/moderation', ctrl.getModerationQueue);
router.get('/reports', ctrl.getReports);
router.post('/reports/:id/resolve', validate(resolveReportSchema), async (req, res, next) => {
  try {
    await logAdminAction(req.user!.userId, 'resolve_report', 'report', req.params.id as string, req.body.notes);
    ctrl.resolveReport(req, res, next);
  } catch (err) { next(err); }
});
router.get('/users/:userId', ctrl.getUserDetail);
router.post('/users/:userId/ban', requireRole('admin'), validate(banSchema), async (req, res, next) => {
  try {
    await logAdminAction(req.user!.userId, 'ban_user', 'user', req.params.userId as string, req.body.reason);
    ctrl.banUser(req, res, next);
  } catch (err) { next(err); }
});
router.post('/users/:userId/trust-score', ctrl.calculateTrustScore);
router.get('/audit-logs', ctrl.getAuditLogs);

export default router;
