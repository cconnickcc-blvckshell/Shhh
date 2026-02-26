import { Router } from 'express';
import { z } from 'zod';
import { ReferencesController } from './references.controller';
import { validate } from '../../middleware/validation';
import { authenticate, requireTier } from '../../middleware/auth';

const router = Router();
const ctrl = new ReferencesController();

const createRefSchema = z.object({
  toUserId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

router.post('/', authenticate, requireTier(2), validate(createRefSchema), ctrl.create);
router.get('/:userId', authenticate, ctrl.getForUser);

export default router;
