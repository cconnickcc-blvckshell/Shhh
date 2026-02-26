import { Router } from 'express';
import { z } from 'zod';
import { AdminController } from './admin.controller';
import { validate } from '../../middleware/validation';
import { authenticate, requireTier } from '../../middleware/auth';

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
router.use(requireTier(2));

router.get('/stats', ctrl.getDashboardStats);
router.get('/moderation', ctrl.getModerationQueue);
router.get('/reports', ctrl.getReports);
router.post('/reports/:id/resolve', validate(resolveReportSchema), ctrl.resolveReport);
router.get('/users/:userId', ctrl.getUserDetail);
router.post('/users/:userId/ban', validate(banSchema), ctrl.banUser);
router.post('/users/:userId/trust-score', ctrl.calculateTrustScore);
router.get('/audit-logs', ctrl.getAuditLogs);

export default router;
