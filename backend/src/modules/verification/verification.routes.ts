import { Router } from 'express';
import { z } from 'zod';
import { VerificationController } from './verification.controller';
import { validate } from '../../middleware/validation';
import { authenticate, requireTier } from '../../middleware/auth';

const router = Router();
const ctrl = new VerificationController();

router.get('/status', authenticate, ctrl.getStatus);
router.post('/photo', authenticate, validate(z.object({ selfieUrl: z.string().url() })), ctrl.submitPhoto);
router.post('/id', authenticate, requireTier(1), validate(z.object({
  documentHash: z.string().min(10),
  idDocumentUrl: z.string().url().optional(),
})), ctrl.submitId);
router.post('/:id/approve', authenticate, requireTier(2), ctrl.approve);
router.post('/:id/reject', authenticate, requireTier(2), validate(z.object({ reason: z.string().max(500).optional() })), ctrl.reject);

export default router;
