import { Router } from 'express';
import { z } from 'zod';
import { ComplianceController } from './compliance.controller';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';

const router = Router();
const controller = new ComplianceController();

const consentSchema = z.object({
  consentType: z.string().min(1).max(50),
  version: z.number().int().positive(),
});

const withdrawConsentSchema = z.object({
  consentType: z.string().min(1).max(50),
});

router.post('/data-export', authenticate, controller.dataExport);
router.delete('/account-deletion', authenticate, controller.requestDeletion);
router.post('/consent', authenticate, validate(consentSchema), controller.recordConsent);
router.post('/consent/withdraw', authenticate, validate(withdrawConsentSchema), controller.withdrawConsent);

export default router;
