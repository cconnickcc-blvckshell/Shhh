import { Router } from 'express';
import { z } from 'zod';
import { UsersController } from './users.controller';
import { validate } from '../../middleware/validation';
import { authenticate, requireTier } from '../../middleware/auth';

const router = Router();
const controller = new UsersController();

const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  gender: z.string().max(30).optional(),
  sexuality: z.string().max(50).optional(),
  photosJson: z.array(z.any()).optional(),
  preferencesJson: z.record(z.any()).optional(),
  kinks: z.array(z.string()).optional(),
  experienceLevel: z.enum(['new', 'curious', 'experienced', 'veteran']).optional(),
  isHost: z.boolean().optional(),
});

const reportSchema = z.object({
  reason: z.string().min(3).max(50),
  description: z.string().max(1000).optional(),
});

router.get('/me', authenticate, controller.getMe);
router.put('/me', authenticate, validate(updateProfileSchema), controller.updateMe);
router.post('/:id/like', authenticate, requireTier(1), controller.likeUser);
router.post('/:id/pass', authenticate, controller.passUser);
router.post('/:id/block', authenticate, controller.blockUser);
router.post('/:id/report', authenticate, validate(reportSchema), controller.reportUser);

export default router;
